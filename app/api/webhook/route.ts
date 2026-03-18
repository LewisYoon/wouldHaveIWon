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
      'customer.subscription.created',
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
        // [수정] 상태를 여기서 active로 강제하지 않음. 하단 2번 단계에서 실제 구독 정보를 조회하게 유도.
        const pEnd = dataObject.lines?.data?.[0]?.period?.end;
        if (pEnd) currentPeriodEnd = new Date(pEnd * 1000).toISOString();
      } else if (event.type.startsWith('customer.subscription.')) {
        subscriptionId = dataObject.id;
        status = dataObject.status;
        
        cancelAtPeriodEnd = (
          dataObject.cancel_at_period_end === true || 
          !!dataObject.cancel_at || 
          dataObject.cancellation_details?.reason === 'cancellation_requested'
        );
        
        const pEnd = dataObject.current_period_end || dataObject.cancel_at;
        if (pEnd) currentPeriodEnd = new Date(pEnd * 1000).toISOString();
        userId = userId || dataObject.metadata?.userId;
        planType = planType || dataObject.metadata?.planType;
      }

      // 2. Fetch full details if data is still missing or from invoice event
      // [수정] invoice 이벤트일 때도 최신 상태(canceled 등)를 가져오기 위해 조회를 수행함
      if (subscriptionId && (!currentPeriodEnd || !userId || event.type === 'invoice.payment_succeeded')) {
        addLog(`Fetching latest subscription state for ID: ${subscriptionId}`);
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
          userId = userId || sub.metadata?.userId;
          planType = planType || sub.metadata?.planType;
          status = sub.status; // 최신 상태 (active, canceled 등) 반영
          cancelAtPeriodEnd = sub.cancel_at_period_end === true || !!sub.cancel_at;
          
          // [수정] 취소된 경우 cancel_at이나 ended_at이 만료일이 됨
          const pEnd = sub.cancel_at || sub.ended_at || sub.current_period_end;
          if (pEnd) currentPeriodEnd = new Date(pEnd * 1000).toISOString();
          addLog(`Latest State from Stripe: Status=${status}, Expiry=${currentPeriodEnd}`);
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
        
        // [수정] 잭팟 날짜나 수동 수정 시 ended_at이나 cancel_at이 더 정확할 수 있음
        let finalPeriodEnd = currentPeriodEnd || existing?.current_period_end;
        
        // [추가] Lifetime 플랜이거나 구독이 완전히 취소된 경우 날짜 정보를 초기화
        const isLifetime = (planType === 'lifetime' || existing?.plan_type === 'lifetime');
        if (isLifetime || finalStatus === 'canceled') {
          finalPeriodEnd = null;
          addLog(`Clearing period end for ${isLifetime ? 'Lifetime plan' : 'Canceled status'}`);
        }
        
        // 취소 플래그는 이번 이벤트에서 명시적으로 확인된 값을 최우선 적용
        let finalCancelAtEnd = existing?.cancel_at_period_end ?? false;
        if (event.type === 'customer.subscription.deleted') {
          finalCancelAtEnd = true;
        } else if (event.type === 'customer.subscription.updated' || event.type === 'checkout.session.completed') {
          finalCancelAtEnd = cancelAtPeriodEnd;
        }

        // [수정] 프리미엄 판정 로직 (Stripe 표준 방식)
        // active, trialing, past_due 상태인 경우만 프리미엄으로 인정합니다.
        // Stripe에서 'canceled'는 유예 기간이 완전히 끝났음을 의미하므로 즉시 해제합니다.
        const isPremium = ['active', 'trialing', 'past_due'].includes(finalStatus || '');

        addLog(`Premium Check -> Status: ${finalStatus}, Expiry: ${finalPeriodEnd}, Result: ${isPremium}`);

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
