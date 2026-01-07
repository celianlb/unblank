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
  planType: 'pro' | 'team';
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
    // 1. Récupérer le plan demandé
    const plan = SubscriptionPlan.getByType(input.planType);

    // 2. Obtenir le Stripe Price ID selon l'intervalle
    const priceId = plan.getStripePriceId(input.billingInterval);

    if (!priceId) {
      throw new Error(`No Stripe Price ID found for ${input.planType} ${input.billingInterval}`);
    }

    // 3. Créer la session Checkout via le service de paiement
    const session = await this.paymentService.createCheckoutSession({
      userId: input.userId,
      userEmail: input.userEmail,
      priceId,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    });

    // 4. Sauvegarder le stripe_customer_id dans la DB
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
