import { AuthRepository } from '@/domain/auth/ports/AuthRepository';
import { CancelSubscriptionUseCase } from '@/application/subscription/usecases/CancelSubscriptionUseCase';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Application Layer Use Case: Suppression du compte avec annulation d'abonnement
 *
 * Ce use case orchestre la suppression complète d'un compte utilisateur :
 * 1. Annule l'abonnement Stripe si l'utilisateur en a un
 * 2. Supprime le compte et toutes les données associées
 *
 * Ce use case est dans la couche application car il coordonne plusieurs
 * services (paiement + authentification) qui ne font pas partie du même domaine.
 */
export class DeleteAccountWithSubscriptionUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
    private readonly supabase: SupabaseClient
  ) {}

  async execute(userId: string): Promise<void> {
    console.log('[DeleteAccountWithSubscriptionUseCase] Starting account deletion for user:', userId);

    // Étape 1 : Annuler l'abonnement Stripe si l'utilisateur en a un
    try {
      console.log('[DeleteAccountWithSubscriptionUseCase] Attempting to cancel subscription...');
      await this.cancelSubscriptionUseCase.execute(userId);
      console.log('[DeleteAccountWithSubscriptionUseCase] Subscription canceled successfully');
    } catch (error) {
      console.error('[DeleteAccountWithSubscriptionUseCase] Error canceling subscription:', error);
      // On continue quand même avec la suppression du compte
      // pour ne pas bloquer l'utilisateur si Stripe a un problème
    }

    // Étape 2 : Supprimer le compte via le repository
    console.log('[DeleteAccountWithSubscriptionUseCase] Deleting account...');
    await this.authRepository.deleteAccount();
    console.log('[DeleteAccountWithSubscriptionUseCase] Account deleted successfully');
  }
}
