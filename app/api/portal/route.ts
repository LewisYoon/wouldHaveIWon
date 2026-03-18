import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    console.error("CRITICAL: STRIPE_SECRET_KEY is missing.");
    return NextResponse.json({ error: 'Billing configuration error.' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: '2025-01-27.acacia',
  });
  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Fetch the stripe_customer_id from DB
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data, error } = await supabase
      .from('user_preferences')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data?.stripe_customer_id) {
      console.error('Customer Portal Error: No Stripe Customer ID found.');
      return NextResponse.json({ error: 'No billing history found.' }, { status: 404 });
    }

    // 2. Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${origin}/billing/?source=stripe`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Portal Session Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
