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
    const dataObject = event.data.object as any;
    
    let userId = dataObject.metadata?.userId;
    let customerId = dataObject.customer as string;
    let subscriptionId = '';
    let status = '';
    let currentPeriodEnd = null;
    let cancelAtPeriodEnd = false;
    let planType = dataObject.metadata?.planType;

    // 1. 데이터 추출 분기 처리
    if (event.type === 'checkout.session.completed') {
      // Checkout Session 객체인 경우
      subscriptionId = dataObject.subscription as string;
      if (subscriptionId) {
        // 구독 결제라면 상세 정보 가져오기
        const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
        status = sub.status;
        currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
        cancelAtPeriodEnd = sub.cancel_at_period_end;
        if (!userId) userId = sub.metadata?.userId;
        if (!planType) planType = sub.metadata?.planType || 'monthly';
      } else {
        // 단건 결제(Lifetime)인 경우
        status = 'active';
        planType = planType || 'lifetime';
      }
    } else {
      // Subscription 객체인 경우 (updated, deleted)
      subscriptionId = dataObject.id;
      status = dataObject.status;
      currentPeriodEnd = new Date(dataObject.current_period_end * 1000).toISOString();
      cancelAtPeriodEnd = dataObject.cancel_at_period_end;
      if (!planType) planType = dataObject.metadata?.planType || 'monthly';
    }

    // 2. UserId가 메타데이터에 없다면 DB에서 검색 (매우 중요)
    if (!userId && customerId) {
      console.log(`Lookup user by customerId: ${customerId}`);
      const { data: prefData } = await supabase
        .from('user_preferences')
        .select('user_id, plan_type')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();
      
      if (prefData) {
        userId = prefData.user_id;
        if (!planType) planType = prefData.plan_type;
      }
    }

    if (userId) {
      console.log(`Syncing DB for User: ${userId}, Event: ${event.type}, Status: ${status}`);

      const isPremium = (status === 'active' || status === 'trialing' || event.type === 'checkout.session.completed');

      const { error: upsertError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          is_premium: isPremium,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId || null,
          subscription_status: status || null,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
          plan_type: planType || 'monthly',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error('Supabase Upsert Error:', upsertError.message);
        return NextResponse.json({ error: 'Database Update Failed' }, { status: 500 });
      }
      
      console.log(`Successfully synced ${userId} to DB.`);
    } else {
      console.warn('No UserID found for this event. Customer ID:', customerId);
    }
  }

  return NextResponse.json({ received: true });
}
