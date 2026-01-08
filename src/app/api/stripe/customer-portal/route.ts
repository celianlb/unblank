import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { authenticateRequest, handleApiError } from '@/lib/api/auth';
import { GetSubscriptionStatusUseCase } from '@/application/subscription/usecases/GetSubscriptionStatusUseCase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function POST(req: NextRequest) {
  try {
    // Authentifier la requête
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return authResult.error;
    }

    const { user, supabase } = authResult.data;

    // ✅ CLEAN ARCHITECTURE: Récupérer le stripe_customer_id via GetSubscriptionStatusUseCase
    const getSubscriptionStatus = new GetSubscriptionStatusUseCase(supabase);
    const subscription = await getSubscriptionStatus.execute(user.id);

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Aucun compte Stripe trouvé' },
        { status: 400 }
      );
    }

    const { returnUrl } = await req.json();

    // Créer une session du portail client Stripe
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return handleApiError(error, 'stripe/customer-portal');
  }
}
