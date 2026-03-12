import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  // Supabase client with SERVICE ROLE for bypassing RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const body = await req.text();
  const signature = (await headers()).get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set in environment variables.");
    }
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    console.log(`Webhook Event Verified: ${event.type}`);
  } catch (err: any) {
    console.error(`Webhook verification failed: ${err.message}`);
    return NextResponse.json({ error: `Verification Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded') {
    const session = event.data.object as any;
    
    let userId = session.metadata?.userId;

    if (!userId && session.customer) {
      console.log(`Looking up user by customer ID: ${session.customer}`);
      const { data: userData, error: userError } = await supabase
        .from('user_preferences')
        .select('user_id')
        .eq('stripe_customer_id', session.customer)
        .maybeSingle();
      
      if (userError) {
        console.error("User lookup error:", userError.message);
      }
      userId = userData?.user_id;
    }

    if (userId) {
      console.log(`Upgrading user ${userId} to PRO...`);

      // Try-catch for the database update to see specific DB errors
      try {
        const { error: prefError } = await supabase
          .from('user_preferences')
          .upsert({ 
            user_id: userId, 
            is_premium: true,
            stripe_customer_id: session.customer as string
          }, { onConflict: 'user_id' });

        if (prefError) {
          throw new Error(`Supabase Upsert Error: ${prefError.message}`);
        }

        console.log(`User ${userId} successfully upgraded to PRO.`);
      } catch (dbErr: any) {
        console.error('Database Operation Failed:', dbErr.message);
        return NextResponse.json({ error: `Database Error: ${dbErr.message}` }, { status: 500 });
      }
    } else {
      console.warn('No User ID found for session:', session.id);
      return NextResponse.json({ error: 'No User ID found' }, { status: 400 });
    }
  }

  return NextResponse.json({ received: true });
}
