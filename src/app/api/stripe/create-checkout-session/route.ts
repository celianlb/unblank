import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionFactory } from '@/infra/subscription/SubscriptionFactory';
import { authenticateRequest, handleApiError } from '@/lib/api/auth';
import { BillingInterval } from '@/domain/subscription/models';

/**
 * API Route: POST /api/stripe/create-checkout-session
 * Crée une session Stripe Checkout pour souscrire à un plan
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentifier la requête
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return authResult.error;
    }

    const { user, supabase } = authResult.data;

    // 2. Parser et valider le body
    const body = await request.json();
    const { planType, billingPeriod } = body as {
      planType: 'pro' | 'team';
      billingPeriod?: 'monthly' | 'annual';
    };

    if (!planType) {
      return NextResponse.json(
        { error: 'Missing planType' },
        { status: 400 }
      );
    }

    // Convertir billingPeriod en billingInterval (monthly → monthly, annual → yearly)
    const billingInterval: BillingInterval = billingPeriod === 'annual' ? 'yearly' : 'monthly';

    // 3. Créer le use case via la Factory (Clean Architecture)
    const createCheckoutUseCase = SubscriptionFactory.createCheckoutSessionUseCase(supabase);

    // 4. Exécuter le use case
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const result = await createCheckoutUseCase.execute({
      userId: user.id,
      userEmail: user.email!,
      planType,
      billingInterval,
      successUrl: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/pricing`,
    });

    return NextResponse.json({
      sessionId: result.sessionId,
      url: result.checkoutUrl,
    });
  } catch (error) {
    console.error('[CreateCheckoutSession] Error:', error);
    
    // Si c'est une erreur d'abonnement actif existant
    if (error instanceof Error && error.message.includes('ACTIVE_SUBSCRIPTION_EXISTS')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 } // 409 Conflict
      );
    }
    
    return handleApiError(error, 'create-checkout-session');
  }
}
