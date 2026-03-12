import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: Request) {
  const logs: string[] = [];
  const addLog = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  try {
    addLog("Webhook process started.");
    
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeSecret || !webhookSecret || !supabaseUrl || !supabaseServiceKey) {
      const missing = [];
      if (!stripeSecret) missing.push("STRIPE_SECRET_KEY");
      if (!webhookSecret) missing.push("STRIPE_WEBHOOK_SECRET");
      if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
      if (!supabaseServiceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
      throw new Error(`Missing environment variables: ${missing.join(", ")}`);
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: '2026-02-25.clover',
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = (await headers()).get('stripe-signature') as string;

    if (!signature) throw new Error("No stripe-signature header found.");

    addLog("Attempting event verification...");
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    addLog(`Verified Event: ${event.type}`);

    const relevantEvents = [
      'checkout.session.completed',
      'invoice.payment_succeeded',
      'customer.subscription.updated',
      'customer.subscription.deleted'
    ];

    if (relevantEvents.includes(event.type)) {
      const dataObject = event.data.object as any;
      
      let userId = dataObject.metadata?.userId || dataObject.client_reference_id;
      let customerId = dataObject.customer as string;
      let customerEmail = dataObject.customer_email || dataObject.billing_details?.email;
      let subscriptionId = '';
      let status = '';
      let currentPeriodEnd = null;
      let cancelAtPeriodEnd = false;
      let planType = dataObject.metadata?.planType;

      addLog(`Event ${event.type} for Customer ${customerId}. Initial UserId: ${userId}`);

      // 1. 객체 종류별 ID 및 기본 상태 추출
      if (event.type === 'checkout.session.completed') {
        subscriptionId = dataObject.subscription as string;
        status = dataObject.payment_status === 'paid' ? 'active' : 'incomplete';
      } else if (event.type === 'invoice.payment_succeeded') {
        subscriptionId = dataObject.subscription as string;
        status = 'active';
        // Invoice에서 기간 종료일 추출 (가장 정확함)
        const lineItem = dataObject.lines?.data?.[0];
        if (lineItem?.period?.end) {
          currentPeriodEnd = new Date(lineItem.period.end * 1000).toISOString();
          addLog(`Extracted Expiry from Invoice: ${currentPeriodEnd}`);
        }
      } else if (event.type.startsWith('customer.subscription.')) {
        subscriptionId = dataObject.id;
        status = dataObject.status;
        // 취소 여부 확인 (여러 경로 시도)
        cancelAtPeriodEnd = dataObject.cancel_at_period_end === true || 
                            dataObject.cancel_at === true ||
                            dataObject.cancellation_details?.reason === 'cancellation_requested';

        addLog(`Subscription Event: ${event.type}, CancelFlag: ${cancelAtPeriodEnd}`);

        userId = userId || dataObject.metadata?.userId;
        planType = planType || dataObject.metadata?.planType;

        const periodEnd = dataObject.current_period_end || dataObject.trial_end;
        if (periodEnd) {
          currentPeriodEnd = new Date(periodEnd * 1000).toISOString();
        }
      }

      // 2. 구독 정보가 있지만 날짜 정보가 없다면(Session 이벤트 등) Stripe에서 직접 조회
      if (subscriptionId && !currentPeriodEnd) {
        addLog(`Fetching details for Subscription: ${subscriptionId}`);
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
          if (sub) {
            userId = userId || sub.metadata?.userId;
            planType = planType || sub.metadata?.planType;
            status = sub.status;
            cancelAtPeriodEnd = sub.cancel_at_period_end === true || !!sub.cancel_at;

            const periodEnd = sub.current_period_end || sub.trial_end;
            if (periodEnd) {
              currentPeriodEnd = new Date(periodEnd * 1000).toISOString();
            }
            addLog(`Fetched from Stripe API: Status=${status}, Expiry=${currentPeriodEnd}, CancelAtEnd=${cancelAtPeriodEnd}`);
          }
        } catch (subErr: any) {
          addLog(`Sub Fetch Error: ${subErr.message}`);
        }
      }


      // 3. UserId가 없다면 DB/Auth 검색 (이전과 동일)
      if (!userId && customerId) {
        const { data: prefData } = await supabase.from('user_preferences').select('user_id, plan_type').eq('stripe_customer_id', customerId).maybeSingle();
        if (prefData) {
          userId = prefData.user_id;
          planType = planType || prefData.plan_type;
          addLog(`Resolved UserId from DB: ${userId}`);
        }
      }

      // 4. 최종 DB 업데이트
      if (userId) {
        const isPremium = (status === 'active' || status === 'trialing' || status === 'past_due' || event.type === 'checkout.session.completed');
        
        const upsertData = {
          user_id: userId,
          is_premium: isPremium,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId || null,
          subscription_status: status || null,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
          plan_type: planType || 'monthly',
          updated_at: new Date().toISOString(),
        };

        addLog(`Upserting: Premium=${isPremium}, CancelAtEnd=${cancelAtPeriodEnd}, Expiry=${currentPeriodEnd}`);

        const { error: upsertError } = await supabase
          .from('user_preferences')
          .upsert(upsertData, { onConflict: 'user_id' });

        if (upsertError) throw new Error(`Supabase Upsert Error: ${upsertError.message}`);
        addLog(`SUCCESS: Full sync for user ${userId}`);
      } else {
        addLog(`FATAL: Could not identify user.`);
      }
    }

    return NextResponse.json({ received: true, logs });

  } catch (err: any) {
    console.error("WEBHOOK CRITICAL ERROR:", err.message);
    return NextResponse.json({ 
      error: err.message, 
      stack: err.stack,
      logs 
    }, { status: 500 });
  }
}
