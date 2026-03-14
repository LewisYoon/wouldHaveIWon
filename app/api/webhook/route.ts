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
      throw new Error("Missing environment variables.");
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: '2026-02-25.clover',
    });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = (await headers()).get('stripe-signature') as string;

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

      // 1. Extract IDs and initial status
      if (event.type === 'checkout.session.completed') {
        subscriptionId = dataObject.subscription as string;
        status = dataObject.payment_status === 'paid' ? 'active' : 'incomplete';
      } else if (event.type === 'invoice.payment_succeeded') {
        subscriptionId = dataObject.subscription as string;
        status = 'active';
        const pEnd = dataObject.lines?.data?.[0]?.period?.end;
        if (pEnd) currentPeriodEnd = new Date(pEnd * 1000).toISOString();
      } else if (event.type.startsWith('customer.subscription.')) {
        subscriptionId = dataObject.id;
        status = dataObject.status;
        
        // [수정] 취소 여부를 판단하는 가장 확실한 3가지 경로 체크
        cancelAtPeriodEnd = (
          dataObject.cancel_at_period_end === true || 
          !!dataObject.cancel_at || 
          dataObject.cancellation_details?.reason === 'cancellation_requested' ||
          dataObject.cancellation_details?.feedback === 'customer_service' // 일부 환경 대응
        );
        
        addLog(`Subscription Object Detected. ID: ${subscriptionId}, Status: ${status}, CancelFlag Found: ${cancelAtPeriodEnd}`);

        const pEnd = dataObject.current_period_end || dataObject.cancel_at;
        if (pEnd) currentPeriodEnd = new Date(pEnd * 1000).toISOString();
        userId = userId || dataObject.metadata?.userId;
        planType = planType || dataObject.metadata?.planType;
      }

      // 2. Fetch full details if data is still missing
      if (subscriptionId && (!currentPeriodEnd || !userId)) {
        addLog(`Fetching full details for Subscription: ${subscriptionId}`);
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
          userId = userId || sub.metadata?.userId;
          planType = planType || sub.metadata?.planType;
          status = status || sub.status;
          cancelAtPeriodEnd = sub.cancel_at_period_end === true || !!sub.cancel_at;
          const pEnd = sub.current_period_end || sub.cancel_at || sub.trial_end;
          if (pEnd) currentPeriodEnd = new Date(pEnd * 1000).toISOString();
          addLog(`Fetched from API: Status=${status}, Expiry=${currentPeriodEnd}`);
        } catch (subErr: any) {
          addLog(`Sub Fetch Error: ${subErr.message}`);
        }
      }

      // 3. User Resolution Fallbacks
      if (!userId && customerId) {
        const { data: prefData } = await supabase.from('user_preferences').select('user_id, plan_type').eq('stripe_customer_id', customerId).maybeSingle();
        if (prefData) {
          userId = prefData.user_id;
          planType = planType || prefData.plan_type;
        }
      }
      if (!userId && customerEmail) {
        const { data: authData } = await supabase.auth.admin.listUsers();
        const userMatch = authData.users.find(u => u.email === customerEmail);
        if (userMatch) userId = userMatch.id;
      }

      // 4. 최종 DB 업데이트 (데이터 무결성 보장)
      if (userId) {
        addLog(`Preparing final sync for user ${userId}. Status: ${status}, CancelAtEnd: ${cancelAtPeriodEnd}`);

        // 기존 데이터를 가져오되, 필수 식별 정보(customer_id 등)가 누락된 경우만 활용
        const { data: existing } = await supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle();

        // [핵심 로직] Stripe에서 온 값을 최우선으로 하되, 없을 때만 기존 값 유지
        const finalSubscriptionId = subscriptionId || existing?.stripe_subscription_id;
        const finalStatus = status || existing?.subscription_status;
        const finalPeriodEnd = currentPeriodEnd || existing?.current_period_end;
        
        // 취소 플래그는 이번 이벤트에서 명시적으로 확인된 값을 최우선 적용
        let finalCancelAtEnd = existing?.cancel_at_period_end ?? false;
        if (event.type.startsWith('customer.subscription.') || event.type === 'checkout.session.completed') {
          finalCancelAtEnd = cancelAtPeriodEnd;
          addLog(`Overriding CancelFlag with fresh signal: ${finalCancelAtEnd}`);
        } else if (cancelAtPeriodEnd === true) {
          finalCancelAtEnd = true;
        }

        const isPremium = (
          finalStatus === 'active' || 
          finalStatus === 'trialing' || 
          finalStatus === 'past_due' || 
          (finalPeriodEnd && new Date(finalPeriodEnd) > new Date())
        );

        const upsertData = {
          user_id: userId,
          is_premium: isPremium,
          stripe_customer_id: customerId || existing?.stripe_customer_id,
          stripe_subscription_id: finalSubscriptionId || null,
          subscription_status: finalStatus || null,
          current_period_end: finalPeriodEnd || null,
          cancel_at_period_end: finalCancelAtEnd,
          plan_type: planType || existing?.plan_type || 'monthly',
          updated_at: new Date().toISOString(),
        };

        addLog(`FINAL UPSERT DATA: ${JSON.stringify(upsertData)}`);

        const { error: upsertError } = await supabase
          .from('user_preferences')
          .upsert(upsertData, { onConflict: 'user_id' });

        if (upsertError) throw new Error(`Supabase Error: ${upsertError.message}`);
        addLog(`SUCCESS: Full sync completed for user ${userId}`);
      } else {
        addLog(`FATAL: Could not identify user for Customer ${customerId}`);
      }
    }

    return NextResponse.json({ received: true, logs });

  } catch (err: any) {
    console.error("WEBHOOK ERROR:", err.message);
    return NextResponse.json({ error: err.message, logs }, { status: 500 });
  }
}
