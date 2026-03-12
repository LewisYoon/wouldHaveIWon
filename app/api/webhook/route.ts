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

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const body = await req.text();
  const signature = (await headers()).get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    if (!webhookSecret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    addLog(`Verified Event: ${event.type}`);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

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

    addLog(`Processing data for Customer: ${customerId}, Initial UserId: ${userId}`);

    if (event.type === 'checkout.session.completed') {
      subscriptionId = dataObject.subscription as string;
      if (subscriptionId) {
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
      currentPeriodEnd = new Date(dataObject.current_period_end * 1000).toISOString();
      cancelAtPeriodEnd = dataObject.cancel_at_period_end;
      if (!planType) planType = dataObject.metadata?.planType;
    }

    if (!userId && customerId) {
      addLog(`UserId missing, searching DB by customerId: ${customerId}`);
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
      const isPremium = (status === 'active' || status === 'trialing' || event.type === 'checkout.session.completed');
      addLog(`Upserting to DB. Premium: ${isPremium}, Plan: ${planType}, CancelAtEnd: ${cancelAtPeriodEnd}`);

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
        addLog(`CRITICAL: Upsert Failed: ${upsertError.message}`);
        return NextResponse.json({ error: upsertError.message, logs }, { status: 500 });
      }
      addLog(`Successfully synced user ${userId}`);
    } else {
      addLog(`WARNING: Still no UserId found. Skipping update.`);
    }
  }

  return NextResponse.json({ received: true, logs });
}
