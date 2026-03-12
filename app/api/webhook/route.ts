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

    const stripe = new Stripe(stripeSecret);
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
      
      // 1. Try to find userId via different fields
      let userId = dataObject.metadata?.userId || dataObject.client_reference_id;
      let customerId = dataObject.customer as string;
      let customerEmail = dataObject.customer_email || dataObject.billing_details?.email;
      let subscriptionId = '';
      let status = '';
      let currentPeriodEnd = null;
      let cancelAtPeriodEnd = false;
      let planType = dataObject.metadata?.planType;

      addLog(`Event ${event.type} for Customer ${customerId}. Email: ${customerEmail}, RefID: ${dataObject.client_reference_id}`);

      // 2. ID Extraction based on event type
      if (event.type === 'checkout.session.completed') {
        subscriptionId = dataObject.subscription as string;
        status = dataObject.payment_status === 'paid' ? 'active' : 'incomplete';
      } else if (event.type === 'invoice.payment_succeeded') {
        subscriptionId = dataObject.subscription as string;
        status = 'active';
      } else if (event.type.startsWith('customer.subscription.')) {
        subscriptionId = dataObject.id;
        status = dataObject.status;
      }

      // 3. Robust UserId Resolution
      // Step A: Check Subscription Metadata
      if (!userId && subscriptionId) {
        addLog(`Fetching Subscription ${subscriptionId} for metadata...`);
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
          userId = sub.metadata?.userId;
          planType = planType || sub.metadata?.planType;
          status = status || sub.status;
          currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
          cancelAtPeriodEnd = sub.cancel_at_period_end;
          addLog(`Resolved from Subscription: ${userId}`);
        } catch (subErr: any) { addLog(`Sub Fetch Error: ${subErr.message}`); }
      }

      // Step B: Search DB by Customer ID
      if (!userId && customerId) {
        addLog(`Searching DB by customerId: ${customerId}`);
        const { data: prefData } = await supabase
          .from('user_preferences')
          .select('user_id, plan_type')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();
        if (prefData) {
          userId = prefData.user_id;
          planType = planType || prefData.plan_type;
          addLog(`Resolved from DB (Customer): ${userId}`);
        }
      }

      // Step C: Search Auth by Email (Last Resort)
      if (!userId && customerEmail) {
        addLog(`Searching Auth by email: ${customerEmail}`);
        const { data: authData } = await supabase.auth.admin.listUsers();
        const userMatch = authData.users.find(u => u.email === customerEmail);
        if (userMatch) {
          userId = userMatch.id;
          addLog(`Resolved from Auth (Email): ${userId}`);
        }
      }

      // 4. Final Database Sync
      if (userId) {
        const isPremium = (status === 'active' || status === 'trialing' || status === 'past_due' || event.type === 'checkout.session.completed');
        addLog(`Syncing DB: Premium=${isPremium}, Plan=${planType || 'monthly'}`);

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

        if (upsertError) throw new Error(`Supabase Upsert Error: ${upsertError.message}`);
        addLog(`SUCCESS: Synced user ${userId}`);
      } else {
        addLog(`FATAL: No identification found for Customer ${customerId}`);
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
