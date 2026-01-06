import Stripe from 'stripe';
import {
  SubscriptionPaymentPort,
  CheckoutSessionData,
  WebhookEventData,
} from '@/application/subscription/ports/SubscriptionPaymentPort';

/**
 * Infrastructure Layer: Implémentation Stripe du port de paiement
 * Gère toutes les interactions avec l'API Stripe
 */
export class StripePaymentService implements SubscriptionPaymentPort {
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia',
    });
  }

  /**
   * Créer une session Stripe Checkout
   */
  async createCheckoutSession(params: {
    userId: string;
    userEmail: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSessionData> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.userEmail,
      client_reference_id: params.userId, // Pour lier au user après checkout
      metadata: {
        userId: params.userId,
      },
      subscription_data: {
        metadata: {
          userId: params.userId,
        },
      },
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Créer un portail client pour gérer l'abonnement
   */
  async createCustomerPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });

    return { url: session.url };
  }

  /**
   * Vérifier et parser un webhook Stripe
   */
  async verifyAndParseWebhook(params: {
    body: string | Buffer;
    signature: string;
  }): Promise<WebhookEventData> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
    }

    // Vérifier la signature du webhook
    const event = this.stripe.webhooks.constructEvent(
      params.body,
      params.signature,
      webhookSecret
    );

    // Parser les données selon le type d'événement
    return this.parseStripeEvent(event);
  }

  /**
   * Récupérer les détails d'un abonnement
   */
  async getSubscriptionDetails(subscriptionId: string): Promise<{
    status: string;
    priceId: string;
    currentPeriodEnd: number;
  }> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

    return {
      status: subscription.status,
      priceId: subscription.items.data[0].price.id,
      currentPeriodEnd: subscription.current_period_end,
    };
  }

  /**
   * Annuler un abonnement
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.cancel(subscriptionId);
  }

  /**
   * Parser un événement Stripe en WebhookEventData
   */
  private parseStripeEvent(event: Stripe.Event): WebhookEventData {
    const data: WebhookEventData = {
      type: event.type,
    };

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        data.customerId = session.customer as string;
        data.subscriptionId = session.subscription as string;

        // Récupérer le price ID depuis line_items
        if (session.line_items?.data[0]) {
          data.priceId = session.line_items.data[0].price?.id;
        }

        data.status = 'active';
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        data.customerId = subscription.customer as string;
        data.subscriptionId = subscription.id;
        data.priceId = subscription.items.data[0].price.id;
        data.status = subscription.status;
        data.currentPeriodEnd = subscription.current_period_end;
        break;
      }

      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        data.customerId = invoice.customer as string;
        data.subscriptionId = invoice.subscription as string;
        data.amount = invoice.amount_paid;
        data.currency = invoice.currency;
        data.status = invoice.status || undefined;
        break;
      }
    }

    return data;
  }
}
