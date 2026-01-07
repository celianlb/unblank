import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionFactory } from '@/infra/subscription/SubscriptionFactory';
import { authenticateRequest, handleApiError } from '@/lib/api/auth';

/**
 * API Route: GET /api/subscription/status
 * Récupère le statut de l'abonnement de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentifier la requête
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return authResult.error;
    }

    const { user, supabase } = authResult.data;

    // 2. Créer le use case via la Factory (Clean Architecture)
    const getStatusUseCase = SubscriptionFactory.createGetSubscriptionStatusUseCase(supabase);

    // 3. Exécuter le use case
    const subscription = await getStatusUseCase.execute(user.id);

    return NextResponse.json({ subscription });
  } catch (error) {
    return handleApiError(error, 'subscription/status');
  }
}
