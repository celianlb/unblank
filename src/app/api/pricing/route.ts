import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function GET() {
  try {
    // Log pour debug
    console.log('[PRICING API] Fetching prices from Stripe...');
    console.log('[PRICING API] Expected price IDs:', {
      proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      proYearly: process.env.STRIPE_PRICE_PRO_YEARLY,
      teamMonthly: process.env.STRIPE_PRICE_TEAM_MONTHLY,
      teamYearly: process.env.STRIPE_PRICE_TEAM_YEARLY,
    });

    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    console.log('[PRICING API] Found prices:', prices.data.length);
    console.log('[PRICING API] Price IDs from Stripe:', prices.data.map(p => p.id));

    // Mapper les prix par plan
    const pricingData: Record<string, any> = {
      pro: { monthly: null, annual: null },
      team: { monthly: null, annual: null },
    };

    prices.data.forEach((price) => {
      // Identifier le plan basé sur le price ID des variables d'environnement
      let planType: 'pro' | 'team' | null = null;
      
      if (price.id === process.env.STRIPE_PRICE_PRO_MONTHLY) {
        planType = 'pro';
      } else if (price.id === process.env.STRIPE_PRICE_PRO_YEARLY) {
        planType = 'pro';
      } else if (price.id === process.env.STRIPE_PRICE_TEAM_MONTHLY) {
        planType = 'team';
      } else if (price.id === process.env.STRIPE_PRICE_TEAM_YEARLY) {
        planType = 'team';
      }

      if (!planType) return;

      const interval = price.recurring?.interval;
      const amount = price.unit_amount ? price.unit_amount / 100 : 0;

      if (interval === 'month') {
        pricingData[planType].monthly = {
          amount,
          priceId: price.id,
          formatted: `${amount.toFixed(2).replace('.', ',')}€`,
        };
      } else if (interval === 'year') {
        pricingData[planType].annual = {
          amount,
          priceId: price.id,
          formatted: `${amount.toFixed(2).replace('.', ',')}€`,
        };
      }
    });

    console.log('[PRICING API] Final pricing data:', JSON.stringify(pricingData, null, 2));

    return NextResponse.json(pricingData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching Stripe prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing data' },
      { status: 500 }
    );
  }
}

// Cache de 1 heure
export const revalidate = 3600;
