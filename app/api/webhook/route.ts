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
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret || '');
    console.log(`Webhook Event Verified: ${event.type}`);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded') {
    const session = event.data.object as any;
    
    // session.metadata.userId 가 있는 경우 (단건 결제 또는 구독 시작)
    // 혹은 session.subscription (구독 갱신) 처리
    let userId = session.metadata?.userId;

    // 만약 인보이스 성공 이벤트인데 메타데이터가 없다면, 고객 정보를 통해 유저를 찾아야 할 수도 있음
    if (!userId && session.customer) {
      console.log(`Looking up user by customer ID: ${session.customer}`);
      const { data: userData } = await supabase
        .from('user_preferences')
        .select('user_id')
        .eq('stripe_customer_id', session.customer)
        .maybeSingle();
      userId = userData?.user_id;
    }

    if (userId) {
      console.log(`Processing premium for user: ${userId}`);

      const { error: prefError } = await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: userId, 
          is_premium: true,
          stripe_customer_id: session.customer as string
        }, { onConflict: 'user_id' });

      if (prefError) {
        console.error('Database Update Failed:', prefError.message);
        return NextResponse.json({ error: 'DB Update Failed' }, { status: 500 });
      }

      console.log(`User ${userId} successfully upgraded to PRO.`);
    } else {
      console.warn('Webhook received but no User ID found in metadata or DB.');
    }
  }

  return NextResponse.json({ received: true });
}
