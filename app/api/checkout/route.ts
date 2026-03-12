import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(req: Request) {
  try {
    const { userId, userEmail } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: 'WhatIFLotto PRO Membership',
              description: 'Unlock Auto-Tracker, Unlimited Tickets, and Advanced Analytics.',
            },
            unit_amount: 1900, // $19.00 AUD (One-time or Monthly depending on your strategy)
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // Use 'subscription' if you want recurring billing
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/luck?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard`,
      metadata: {
        userId: userId,
      },
      customer_email: userEmail,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Session Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
