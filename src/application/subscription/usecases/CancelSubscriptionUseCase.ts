import { SubscriptionPaymentPort } from '@/application/subscription/ports/SubscriptionPaymentPort';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Use Case: Annuler l'abonnement d'un utilisateur
 * Application Layer
 *
 * Ce use case annule l'abonnement Stripe de l'utilisateur.
 * Utilisé notamment lors de la suppression d'un compte pour éviter que
 * l'utilisateur continue à être facturé après la suppression.
 */
export class CancelSubscriptionUseCase {
  constructor(
    private paymentService: SubscriptionPaymentPort,
    private supabase: SupabaseClient
  ) {}

  async execute(userId: string): Promise<void> {
    console.log('[CancelSubscriptionUseCase] execute() called with userId:', userId);

    // Récupérer les informations de l'abonnement de l'utilisateur
    console.log('[CancelSubscriptionUseCase] Fetching user subscription info from database...');
    const { data: user, error } = await this.supabase
      .from('users')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[CancelSubscriptionUseCase] Error fetching user:', error);
      throw new Error('Failed to fetch user subscription information');
    }

    console.log('[CancelSubscriptionUseCase] User data retrieved:', {
      userId,
      hasStripeSubscriptionId: !!user?.stripe_subscription_id,
      hasStripeCustomerId: !!user?.stripe_customer_id,
      stripeSubscriptionId: user?.stripe_subscription_id,
      stripeCustomerId: user?.stripe_customer_id,
    });

    // Si l'utilisateur n'a pas d'abonnement Stripe actif, rien à faire
    if (!user?.stripe_subscription_id) {
      console.log('[CancelSubscriptionUseCase] No active Stripe subscription found for user:', userId);
      return;
    }

    console.log('[CancelSubscriptionUseCase] Canceling Stripe subscription:', {
      userId,
      subscriptionId: user.stripe_subscription_id,
    });

    try {
      // Annuler l'abonnement via Stripe
      await this.paymentService.cancelSubscription(user.stripe_subscription_id);

      console.log('[CancelSubscriptionUseCase] Stripe subscription canceled successfully');

      // Note: La mise à jour de la base de données sera gérée automatiquement
      // par le webhook Stripe (customer.subscription.deleted)
    } catch (error) {
      console.error('[CancelSubscriptionUseCase] Error canceling Stripe subscription:', error);
      throw new Error('Failed to cancel Stripe subscription');
    }
  }
}
