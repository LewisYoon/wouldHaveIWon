import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'edge';

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  try {
    const { userId, userEmail, planType } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const isMonthly = planType === 'monthly';
    const amount = isMonthly ? 299 : 1999; // $2.99 vs $19.99
    const mode = isMonthly ? 'subscription' : 'payment';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: `WhatIFLotto PRO (${isMonthly ? 'Monthly' : 'Lifetime'})`,
              description: isMonthly 
                ? 'Monthly subscription to PRO features.' 
                : 'One-time payment for lifetime access to PRO features.',
            },
            unit_amount: amount,
            ...(isMonthly && {
              recurring: {
                interval: 'month',
              },
            }),
          },
          quantity: 1,
        },
      ],
      mode: mode,
      // 구독 데이터에 메타데이터 추가 (구독 관련 웹훅에서 userId를 바로 확인하기 위함)
      ...(isMonthly && {
        subscription_data: {
          metadata: {
            userId: userId,
            planType: planType,
          },
        },
      }),
      success_url: `${origin}/luck/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing/`,
      metadata: {
        userId: userId,
        planType: planType,
      },
      client_reference_id: userId,
      customer_email: userEmail,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Session Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
