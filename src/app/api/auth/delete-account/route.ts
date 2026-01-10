import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SupabaseAuthRepository } from '@/infra/auth/SupabaseAuthRepository';
import { AvatarUrlService } from '@/application/auth/AvatarUrlService';
import { SubscriptionFactory } from '@/infra/subscription/SubscriptionFactory';
import { DeleteAccountWithSubscriptionUseCase } from '@/application/auth/usecases/DeleteAccountWithSubscriptionUseCase';

/**
 * API Route: DELETE /api/auth/delete-account
 * Supprime le compte de l'utilisateur authentifié après avoir annulé son abonnement Stripe
 *
 * Architecture:
 * Route API → Use Case (Application) → Repository (Infra) → Supabase
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('[DELETE /api/auth/delete-account] Request received');

    // Récupérer le token d'accès depuis le header Authorization
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      console.error('[DELETE /api/auth/delete-account] No access token found');
      return NextResponse.json(
        { error: 'Non autorisé - token manquant' },
        { status: 401 }
      );
    }

    // Créer le client Supabase côté serveur avec le token de l'utilisateur
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[DELETE /api/auth/delete-account] Unauthorized:', authError);
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const userId = user.id;
    console.log('[DELETE /api/auth/delete-account] User authenticated:', userId);

    // Créer les dépendances pour le use case
    const avatarUrlService = new AvatarUrlService(process.env.NEXT_PUBLIC_SUPABASE_URL!);
    const authRepository = new SupabaseAuthRepository(supabase, avatarUrlService);
    const cancelSubscriptionUseCase = SubscriptionFactory.createCancelSubscriptionUseCase(supabase);

    // Créer et exécuter le use case
    const deleteAccountUseCase = new DeleteAccountWithSubscriptionUseCase(
      authRepository,
      cancelSubscriptionUseCase,
      supabase
    );

    await deleteAccountUseCase.execute(userId);

    console.log('[DELETE /api/auth/delete-account] Account deleted successfully');

    return NextResponse.json(
      { success: true, message: 'Compte supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DELETE /api/auth/delete-account] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Erreur inattendue lors de la suppression du compte' },
      { status: 500 }
    );
  }
}
