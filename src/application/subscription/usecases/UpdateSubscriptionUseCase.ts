import { SubscriptionPaymentPort } from '../ports/SubscriptionPaymentPort';
import { SubscriptionPlan, BillingInterval } from '@/domain/subscription/models';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Use Case: Mettre à jour un abonnement existant (upgrade/downgrade)
 * Application Layer
 */

export interface UpdateSubscriptionInput {
  userId: string;
  planType: 'pro' | 'team';
  billingInterval: BillingInterval;
}

export interface UpdateSubscriptionOutput {
  subscriptionId: string;
  plan: string;
  status: string;
  currentPeriodEnd: Date;
}

export class UpdateSubscriptionUseCase {
  constructor(
    private readonly paymentService: SubscriptionPaymentPort,
    private readonly supabase: SupabaseClient
  ) {}

  async execute(input: UpdateSubscriptionInput): Promise<UpdateSubscriptionOutput> {
    // 1. Récupérer l'abonnement actuel de l'utilisateur
    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .select('stripe_subscription_id, subscription_plan, subscription_status')
      .eq('id', input.userId)
      .single();

    if (userError || !userData) {
      throw new Error('User not found');
    }

    if (!userData.stripe_subscription_id) {
      throw new Error('No active subscription found. Please create a subscription first.');
    }

    if (userData.subscription_status !== 'active') {
      throw new Error('Current subscription is not active. Please create a new subscription.');
    }

    // 2. Récupérer le plan demandé
    const plan = SubscriptionPlan.getByType(input.planType);

    // 3. Obtenir le nouveau Stripe Price ID
    const newPriceId = plan.getStripePriceId(input.billingInterval);

    if (!newPriceId) {
      throw new Error(`No Stripe Price ID found for ${input.planType} ${input.billingInterval}`);
    }

    console.log('[UpdateSubscription] Updating subscription:', {
      userId: input.userId,
      subscriptionId: userData.stripe_subscription_id,
      fromPlan: userData.subscription_plan,
      toPlan: input.planType,
      newPriceId,
    });

    // 4. Mettre à jour l'abonnement via Stripe
    let updatedSubscription;
    try {
      updatedSubscription = await this.paymentService.updateSubscription({
        subscriptionId: userData.stripe_subscription_id,
        priceId: newPriceId,
      });

      console.log('[UpdateSubscription] Stripe API response:', JSON.stringify(updatedSubscription, null, 2));
    } catch (error) {
      console.error('[UpdateSubscription] Error from Stripe:', error);
      throw new Error(`Failed to update subscription with Stripe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!updatedSubscription || !updatedSubscription.currentPeriodEnd) {
      console.error('[UpdateSubscription] Invalid response from Stripe:', updatedSubscription);
      throw new Error('Invalid subscription update response: missing currentPeriodEnd');
    }

    const expiresAt = new Date(updatedSubscription.currentPeriodEnd * 1000);

    if (isNaN(expiresAt.getTime())) {
      throw new Error(`Invalid date from currentPeriodEnd: ${updatedSubscription.currentPeriodEnd}`);
    }

    // 5. Mettre à jour la DB immédiatement (le webhook viendra confirmer)
    const { error: updateError } = await this.supabase
      .from('users')
      .update({
        subscription_plan: input.planType,
        stripe_price_id: newPriceId,
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq('id', input.userId);

    if (updateError) {
      console.error('[UpdateSubscription] Failed to update user:', updateError);
      // Ne pas throw, le webhook va mettre à jour de toute façon
    }

    return {
      subscriptionId: updatedSubscription.subscriptionId,
      plan: input.planType,
      status: updatedSubscription.status,
      currentPeriodEnd: expiresAt,
    };
  }
}
