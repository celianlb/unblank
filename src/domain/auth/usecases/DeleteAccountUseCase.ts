import { AuthService } from '../services';
import { CancelSubscriptionUseCase } from '@/application/subscription/usecases';

/**
 * Use Case: Suppression du compte utilisateur
 *
 * Ce use case s'assure que l'abonnement Stripe de l'utilisateur est annulé
 * avant de supprimer son compte, pour éviter qu'il continue à être facturé.
 */
export class DeleteAccountUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly cancelSubscriptionUseCase?: CancelSubscriptionUseCase
  ) {}

  async execute(): Promise<void> {
    console.log('[DeleteAccountUseCase] Starting account deletion...');

    // Récupérer l'utilisateur actuellement connecté pour obtenir son ID
    console.log('[DeleteAccountUseCase] Getting current session...');
    const session = await this.authService.getCurrentSession();

    if (!session || !session.user) {
      console.error('[DeleteAccountUseCase] No authenticated user found');
      throw new Error('No authenticated user found');
    }

    const userId = session.user.id;
    console.log('[DeleteAccountUseCase] User ID:', userId);

    // Annuler l'abonnement Stripe si le use case est disponible
    if (this.cancelSubscriptionUseCase) {
      console.log('[DeleteAccountUseCase] CancelSubscriptionUseCase is available, attempting to cancel subscription...');
      try {
        await this.cancelSubscriptionUseCase.execute(userId);
        console.log('[DeleteAccountUseCase] Subscription canceled successfully');
      } catch (error) {
        console.error('[DeleteAccountUseCase] Error canceling subscription:', error);
        // On continue quand même avec la suppression du compte
        // pour ne pas bloquer l'utilisateur si Stripe a un problème
      }
    } else {
      console.warn('[DeleteAccountUseCase] CancelSubscriptionUseCase not available - subscription will not be canceled!');
    }

    // Supprimer le compte
    console.log('[DeleteAccountUseCase] Deleting account...');
    await this.authService.deleteAccount();
    console.log('[DeleteAccountUseCase] Account deleted successfully');
  }
}
