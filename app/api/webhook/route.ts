import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

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
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret || '');
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    if (userId) {
      console.log(`Payment successful for user: ${userId}. Upgrading to PRO...`);

      // 1. Update user_preferences to PRO
      const { error: prefError } = await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: userId, 
          is_premium: true,
          is_auto_track_enabled: true, // Default to true after upgrade
          auto_track_qty: 10          // Default qty
        }, { onConflict: 'user_id' });

      if (prefError) {
        console.error('Error updating user premium status:', prefError.message);
        return NextResponse.json({ error: 'DB Update Failed' }, { status: 500 });
      }

      console.log(`Successfully upgraded user ${userId} to PRO.`);
    }
  }

  return NextResponse.json({ received: true });
}
