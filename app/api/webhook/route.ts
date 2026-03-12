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
      
      let userId = dataObject.metadata?.userId;
      let customerId = dataObject.customer as string;
      let subscriptionId = '';
      let status = '';
      let currentPeriodEnd = null;
      let cancelAtPeriodEnd = false;
      let planType = dataObject.metadata?.planType;

      addLog(`Processing for Customer: ${customerId}, Initial UserId: ${userId}`);

      if (event.type === 'checkout.session.completed') {
        subscriptionId = dataObject.subscription as string;
        if (subscriptionId) {
          addLog(`Retrieving subscription: ${subscriptionId}`);
          const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
          status = sub.status;
          currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
          cancelAtPeriodEnd = sub.cancel_at_period_end;
          userId = userId || sub.metadata?.userId;
          planType = planType || sub.metadata?.planType || 'monthly';
        } else {
          status = 'active';
          planType = planType || 'lifetime';
        }
      } else {
        subscriptionId = dataObject.id;
        status = dataObject.status;
        currentPeriodEnd = dataObject.current_period_end ? new Date(dataObject.current_period_end * 1000).toISOString() : null;
        cancelAtPeriodEnd = dataObject.cancel_at_period_end || false;
        if (!planType) planType = dataObject.metadata?.planType;
      }

      if (!userId && customerId) {
        addLog(`UserId missing in metadata, searching DB by customerId: ${customerId}`);
        const { data: prefData, error: findError } = await supabase
          .from('user_preferences')
          .select('user_id, plan_type')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();
        
        if (findError) addLog(`DB Search Error: ${findError.message}`);
        if (prefData) {
          userId = prefData.user_id;
          planType = planType || prefData.plan_type;
          addLog(`Found UserId from DB: ${userId}`);
        }
      }

      if (userId) {
        addLog(`Final Sync: Premium=true, Plan=${planType}, Status=${status}`);

        const { error: upsertError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: userId,
            is_premium: (status === 'active' || status === 'trialing' || status === 'past_due' || event.type === 'checkout.session.completed'),
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId || null,
            subscription_status: status || null,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: cancelAtPeriodEnd,
            plan_type: planType || 'monthly',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (upsertError) throw new Error(`Supabase Upsert Error: ${upsertError.message}`);
        addLog(`Successfully synced user ${userId}`);
      } else {
        addLog(`WARNING: No UserId resolved. Skipping DB update.`);
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
