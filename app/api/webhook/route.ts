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

  // Handle the events
  const relevantEvents = [
    'checkout.session.completed',
    'invoice.payment_succeeded',
    'customer.subscription.updated',
    'customer.subscription.deleted'
  ];

  if (relevantEvents.includes(event.type)) {
    const session = event.data.object as any;
    let userId = session.metadata?.userId;
    let subscriptionId = '';
    let status = '';
    let currentPeriodEnd = null;
    let cancelAtPeriodEnd = false;

    // 1. Get Subscription details if available
    if (session.subscription) {
      const sub = await stripe.subscriptions.retrieve(session.subscription as string);
      subscriptionId = sub.id;
      status = sub.status;
      currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
      cancelAtPeriodEnd = sub.cancel_at_period_end;
    } else if (event.type.startsWith('customer.subscription.')) {
      subscriptionId = session.id;
      status = session.status;
      currentPeriodEnd = new Date(session.current_period_end * 1000).toISOString();
      cancelAtPeriodEnd = session.cancel_at_period_end;
    }

    // 2. Find User ID if not in metadata (for update/delete events)
    if (!userId && session.customer) {
      const { data: userData } = await supabase
        .from('user_preferences')
        .select('user_id')
        .eq('stripe_customer_id', session.customer)
        .maybeSingle();
      userId = userData?.user_id;
    }

    if (userId) {
      console.log(`Syncing subscription for user ${userId}. Status: ${status || 'active'}`);

      const updateData: any = { 
        user_id: userId, 
        is_premium: status === 'active' || status === 'trialing' || !status, // status가 없으면 단건 결제(Lifetime)로 간주
        stripe_customer_id: session.customer as string,
      };

      if (subscriptionId) {
        updateData.stripe_subscription_id = subscriptionId;
        updateData.subscription_status = status;
        updateData.current_period_end = currentPeriodEnd;
        updateData.cancel_at_period_end = cancelAtPeriodEnd;
        // 구독이 취소되거나 만료된 경우 처리
        if (status === 'canceled' || status === 'incomplete_expired') {
          updateData.is_premium = false;
        }
      }

      const { error: prefError } = await supabase
        .from('user_preferences')
        .upsert(updateData, { onConflict: 'user_id' });

      if (prefError) {
        console.error('Database Sync Failed:', prefError.message);
        return NextResponse.json({ error: 'DB Sync Failed' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
