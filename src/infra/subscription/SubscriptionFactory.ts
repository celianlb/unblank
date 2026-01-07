/**
 * Factory pour créer les instances des services de subscription
 * Gère l'injection de dépendances en respectant la Clean Architecture
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { StripePaymentService } from './StripePaymentService';
import { SubscriptionService } from '@/domain/subscription/services/SubscriptionService';
import { CreateCheckoutSessionUseCase } from '@/application/subscription/usecases/CreateCheckoutSessionUseCase';
import { HandleWebhookUseCase } from '@/application/subscription/usecases/HandleWebhookUseCase';
import { GetSubscriptionStatusUseCase } from '@/application/subscription/usecases/GetSubscriptionStatusUseCase';

/**
 * Factory pour créer les instances configurées
 */
export class SubscriptionFactory {
  /**
   * Crée le service Stripe (Infrastructure Layer)
   */
  static createStripeService(): StripePaymentService {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    return new StripePaymentService(stripeSecretKey, webhookSecret);
  }

  /**
   * Crée le service Domain
   */
  static createSubscriptionService(supabase: SupabaseClient): SubscriptionService {
    return new SubscriptionService(supabase);
  }

  /**
   * Crée le use case pour créer une session checkout
   */
  static createCheckoutSessionUseCase(supabase: SupabaseClient): CreateCheckoutSessionUseCase {
    const stripeService = this.createStripeService();
    const subscriptionService = this.createSubscriptionService(supabase);

    return new CreateCheckoutSessionUseCase(stripeService, subscriptionService);
  }

  /**
   * Crée le use case pour gérer les webhooks
   */
  static createHandleWebhookUseCase(supabase: SupabaseClient): HandleWebhookUseCase {
    const stripeService = this.createStripeService();
    const subscriptionService = this.createSubscriptionService(supabase);

    return new HandleWebhookUseCase(stripeService, subscriptionService);
  }

  /**
   * Crée le use case pour récupérer le status de subscription
   */
  static createGetSubscriptionStatusUseCase(supabase: SupabaseClient): GetSubscriptionStatusUseCase {
    return new GetSubscriptionStatusUseCase(supabase);
  }
}
