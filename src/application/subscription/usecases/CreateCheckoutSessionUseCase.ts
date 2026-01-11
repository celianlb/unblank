import { SubscriptionPaymentPort } from '../ports/SubscriptionPaymentPort';
import { SubscriptionPlan, BillingInterval } from '@/domain/subscription/models';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Use Case: Créer une session Stripe Checkout
 * Application Layer - Orchestre la création d'une session de paiement
 */

export interface CreateCheckoutSessionInput {
  userId: string;
  userEmail: string;
  planType: 'pro';
  billingInterval: BillingInterval;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionOutput {
  sessionId: string;
  checkoutUrl: string;
}

export class CreateCheckoutSessionUseCase {
  constructor(
    private readonly paymentService: SubscriptionPaymentPort,
    private readonly supabase: SupabaseClient
  ) {}

  async execute(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionOutput> {
    // 1. Vérifier si l'utilisateur a déjà un abonnement actif
    const { data: userData, error: userDataError } = await this.supabase
      .from('users')
      .select('stripe_subscription_id, stripe_customer_id, subscription_status, subscription_plan')
      .eq('id', input.userId)
      .single();

    if (userDataError) {
      console.error('[CreateCheckout] Error fetching user data:', userDataError);
      // Ne pas bloquer si c'est juste une erreur de requête
    }

    // Si l'utilisateur a déjà un abonnement actif vers un plan payant, on bloque la création
    if (userData?.stripe_subscription_id && 
        userData?.subscription_status === 'active' && 
        userData?.subscription_plan !== 'free') {
      console.log('[CreateCheckout] User already has active subscription:', {
        userId: input.userId,
        subscriptionId: userData.stripe_subscription_id,
        currentPlan: userData.subscription_plan,
      });
      throw new Error(
        'ACTIVE_SUBSCRIPTION_EXISTS: Vous avez déjà un abonnement actif. Le changement de plan se fait automatiquement.'
      );
    }

    // 2. Récupérer le plan demandé
    const plan = SubscriptionPlan.getByType(input.planType);

    // 3. Obtenir le Stripe Price ID selon l'intervalle
    const priceId = plan.getStripePriceId(input.billingInterval);

    if (!priceId) {
      throw new Error(`No Stripe Price ID found for ${input.planType} ${input.billingInterval}`);
    }

    // 4. Créer la session Checkout via le service de paiement
    const session = await this.paymentService.createCheckoutSession({
      userId: input.userId,
      userEmail: input.userEmail,
      priceId,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    });

    // 5. Sauvegarder le stripe_customer_id dans la DB
    const { error } = await this.supabase
      .from('users')
      .update({ stripe_customer_id: session.customerId })
      .eq('id', input.userId);

    if (error) {
      console.error('[CreateCheckout] Failed to save stripe_customer_id:', error);
      // On ne throw pas pour ne pas bloquer le checkout
    }

    return {
      sessionId: session.sessionId,
      checkoutUrl: session.url,
    };
  }
}
