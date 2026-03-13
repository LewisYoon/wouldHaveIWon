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
        cancelAtPeriodEnd = dataObject.cancel_at_period_end === true;
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

      // 4. Final DB Sync
      if (userId) {
        // Check existing record to avoid overwriting with nulls
        const { data: existing } = await supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle();

        const finalPeriodEnd = currentPeriodEnd || existing?.current_period_end || null;
        const finalStatus = status || existing?.subscription_status || 'active';
        
        // Premium if active OR if it's canceled but the period hasn't ended yet
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
          stripe_subscription_id: subscriptionId || existing?.stripe_subscription_id || null,
          subscription_status: finalStatus,
          current_period_end: finalPeriodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
          plan_type: planType || existing?.plan_type || 'monthly',
          updated_at: new Date().toISOString(),
        };

        addLog(`Upserting Data for ${userId}: ${JSON.stringify(upsertData)}`);

        const { error: upsertError } = await supabase
          .from('user_preferences')
          .upsert(upsertData, { onConflict: 'user_id' });

        if (upsertError) throw new Error(`Supabase Error: ${upsertError.message}`);
        addLog(`SUCCESS: Full sync for user ${userId}`);
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
