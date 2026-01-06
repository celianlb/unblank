import { BillingInterval } from '@/domain/subscription/models';

/**
 * Port: Interface pour le système de paiement
 * Abstraction Clean Architecture - implémenté par StripePaymentService
 */

export interface CheckoutSessionData {
  sessionId: string;
  url: string;
}

export interface WebhookEventData {
  type: string;
  customerId?: string;
  subscriptionId?: string;
  priceId?: string;
  status?: string;
  currentPeriodEnd?: number;
  amount?: number;
  currency?: string;
}

export interface SubscriptionPaymentPort {
  /**
   * Créer une session de paiement Checkout
   */
  createCheckoutSession(params: {
    userId: string;
    userEmail: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSessionData>;

  /**
   * Créer un portail client Stripe pour gérer l'abonnement
   */
  createCustomerPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string }>;

  /**
   * Vérifier et parser un webhook Stripe
   */
  verifyAndParseWebhook(params: {
    body: string | Buffer;
    signature: string;
  }): Promise<WebhookEventData>;

  /**
   * Récupérer les informations d'un abonnement Stripe
   */
  getSubscriptionDetails(subscriptionId: string): Promise<{
    status: string;
    priceId: string;
    currentPeriodEnd: number;
  }>;

  /**
   * Annuler un abonnement Stripe
   */
  cancelSubscription(subscriptionId: string): Promise<void>;
}
