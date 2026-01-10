/**
 * Factory pour créer les instances des services de subscription
 * Gère l'injection de dépendances en respectant la Clean Architecture
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { StripePaymentService } from './StripePaymentService';
import { SubscriptionService } from '@/domain/subscription/services/SubscriptionService';
import { CreateCheckoutSessionUseCase } from '@/application/subscription/usecases/CreateCheckoutSessionUseCase';
import { UpdateSubscriptionUseCase } from '@/application/subscription/usecases/UpdateSubscriptionUseCase';
import { HandleWebhookUseCase } from '@/application/subscription/usecases/HandleWebhookUseCase';
import { GetSubscriptionStatusUseCase } from '@/application/subscription/usecases/GetSubscriptionStatusUseCase';
import { CancelSubscriptionUseCase } from '@/application/subscription/usecases/CancelSubscriptionUseCase';

/**
 * Factory pour créer les instances configurées
 */
export class SubscriptionFactory {
  /**
   * Crée le service Stripe (Infrastructure Layer)
   */
  static createStripeService(): StripePaymentService {
    return new StripePaymentService();
  }

  /**
   * Crée le service Domain
   */
  static createSubscriptionService(): SubscriptionService {
    return new SubscriptionService();
  }

  /**
   * Crée le use case pour créer une session checkout
   */
  static createCheckoutSessionUseCase(supabase: SupabaseClient): CreateCheckoutSessionUseCase {
    const stripeService = this.createStripeService();

    return new CreateCheckoutSessionUseCase(stripeService, supabase);
  }

  /**
   * Crée le use case pour mettre à jour un abonnement existant
   */
  static createUpdateSubscriptionUseCase(supabase: SupabaseClient): UpdateSubscriptionUseCase {
    const stripeService = this.createStripeService();

    return new UpdateSubscriptionUseCase(stripeService, supabase);
  }

  /**
   * Crée le use case pour gérer les webhooks
   */
  static createHandleWebhookUseCase(supabase: SupabaseClient): HandleWebhookUseCase {
    const stripeService = this.createStripeService();
    const subscriptionService = this.createSubscriptionService();

    return new HandleWebhookUseCase(stripeService, subscriptionService, supabase);
  }

  /**
   * Crée le use case pour récupérer le status de subscription
   */
  static createGetSubscriptionStatusUseCase(supabase: SupabaseClient): GetSubscriptionStatusUseCase {
    return new GetSubscriptionStatusUseCase(supabase);
  }

  /**
   * Crée le use case pour annuler un abonnement
   */
  static createCancelSubscriptionUseCase(supabase: SupabaseClient): CancelSubscriptionUseCase {
    const stripeService = this.createStripeService();

    return new CancelSubscriptionUseCase(stripeService, supabase);
  }
}
