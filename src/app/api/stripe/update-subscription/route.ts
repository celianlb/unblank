import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionFactory } from '@/infra/subscription/SubscriptionFactory';
import { authenticateRequest, handleApiError } from '@/lib/api/auth';
import { BillingInterval } from '@/domain/subscription/models';

/**
 * API Route: POST /api/stripe/update-subscription
 * Met à jour un abonnement existant (upgrade/downgrade)
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
      planType: 'pro';
      billingPeriod?: 'monthly' | 'annual';
    };

    if (!planType) {
      return NextResponse.json(
        { error: 'Missing planType' },
        { status: 400 }
      );
    }

    // Convertir billingPeriod en billingInterval
    const billingInterval: BillingInterval = billingPeriod === 'annual' ? 'yearly' : 'monthly';

    // 3. Créer le use case via la Factory
    const updateSubscriptionUseCase = SubscriptionFactory.createUpdateSubscriptionUseCase(supabase);

    // 4. Exécuter le use case
    const result = await updateSubscriptionUseCase.execute({
      userId: user.id,
      planType,
      billingInterval,
    });

    return NextResponse.json({
      success: true,
      subscription: result,
    });
  } catch (error) {
    console.error('[UpdateSubscription] Error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return handleApiError(error, 'stripe/update-subscription');
  }
}
