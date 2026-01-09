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
      apiVersion: '2025-12-15.clover',
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
    // Créer ou récupérer le customer Stripe
    const customers = await this.stripe.customers.list({
      email: params.userEmail,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await this.stripe.customers.create({
        email: params.userEmail,
        metadata: {
          userId: params.userId,
        },
      });
      customerId = customer.id;
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      client_reference_id: params.userId,
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
      customerId,
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
    return await this.parseStripeEvent(event);
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
      priceId: (subscription.items.data[0].price as Stripe.Price).id,
      currentPeriodEnd: (subscription as any).current_period_end,
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
  private async parseStripeEvent(event: Stripe.Event): Promise<WebhookEventData> {
    const data: WebhookEventData = {
      type: event.type,
      eventId: event.id, // Vrai ID d'événement Stripe
    };

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        data.customerId = session.customer as string;
        data.subscriptionId = session.subscription as string;
        data.amount = session.amount_total || 0; // Montant total de la session
        data.currency = session.currency || 'eur';

        // Si subscription est expanded dans la session, l'utiliser directement
        if (session.subscription && typeof session.subscription === 'object') {
          const subscription = session.subscription as any;
          data.priceId = subscription.items.data[0].price.id;
          data.currentPeriodEnd = subscription.current_period_end;
          data.cancelAtPeriodEnd = subscription.cancel_at_period_end;
          
          console.log('[StripePaymentService] Using expanded subscription from session:', {
            id: subscription.id,
            current_period_end: subscription.current_period_end,
          });
        } else if (typeof session.subscription === 'string') {
          // Si subscription n'est pas expanded, on doit faire un retrieve
          // Mais avec l'API actuelle, retrieve ne renvoie pas current_period_end
          // Donc on va se fier à customer.subscription.created qui arrive avant
          console.log('[StripePaymentService] Subscription not expanded, will rely on customer.subscription.created event');
        }

        data.status = 'active';
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as any;
        data.customerId = subscription.customer as string;
        data.subscriptionId = subscription.id;
        data.priceId = subscription.items.data[0].price.id;
        data.status = subscription.status;
        data.currentPeriodEnd = subscription.current_period_end;
        data.cancelAtPeriodEnd = subscription.cancel_at_period_end;
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const previousAttributes = (event.data as any).previous_attributes;

        data.customerId = subscription.customer as string;
        data.subscriptionId = subscription.id;
        data.priceId = subscription.items.data[0].price.id;
        data.status = subscription.status;
        data.currentPeriodEnd = subscription.current_period_end;
        data.cancelAtPeriodEnd = subscription.cancel_at_period_end;

        // Tracker le changement de plan si présent
        if (previousAttributes?.items?.data?.[0]?.price?.id) {
          data.previousPriceId = previousAttributes.items.data[0].price.id;
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        data.customerId = subscription.customer as string;
        data.subscriptionId = subscription.id;
        data.priceId = subscription.items.data[0].price.id;
        data.status = subscription.status;
        data.currentPeriodEnd = subscription.current_period_end;
        break;
      }

      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        data.customerId = invoice.customer as string;
        data.subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : undefined;
        data.amount = invoice.amount_paid;
        data.currency = invoice.currency;
        data.status = invoice.status ? String(invoice.status) : undefined;
        
        // Récupérer current_period_end depuis les lignes de la facture
        if (invoice.lines?.data?.[0]) {
          const line = invoice.lines.data[0];
          if (line.period?.end) {
            data.currentPeriodEnd = line.period.end;
            console.log('[StripePaymentService] Invoice period from line item:', {
              period_start: line.period.start,
              period_end: line.period.end,
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        data.customerId = invoice.customer as string;
        data.subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : undefined;
        data.amount = invoice.amount_due; // Montant dû pour les échecs
        data.currency = invoice.currency;
        data.status = invoice.status ? String(invoice.status) : undefined;
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        data.customerId = charge.customer as string;
        data.amount = charge.amount_refunded;
        data.currency = charge.currency;
        data.status = 'refunded';
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        data.amount = dispute.amount;
        data.currency = dispute.currency;
        data.status = dispute.status;
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as any;
        data.customerId = subscription.customer as string;
        data.subscriptionId = subscription.id;
        data.priceId = subscription.items.data[0].price.id;
        data.status = subscription.status;
        data.currentPeriodEnd = subscription.trial_end || subscription.current_period_end;
        break;
      }
    }

    return data;
  }

  /**
   * Mettre à jour un abonnement existant (upgrade/downgrade)
   */
  async updateSubscription(params: {
    subscriptionId: string;
    priceId: string;
  }): Promise<{
    subscriptionId: string;
    status: string;
    currentPeriodEnd: number;
  }> {
    console.log('[StripePaymentService] Updating subscription:', {
      subscriptionId: params.subscriptionId,
      newPriceId: params.priceId,
    });

    try {
      // Récupérer l'abonnement actuel pour obtenir l'item ID
      const subscription = await this.stripe.subscriptions.retrieve(params.subscriptionId);

      if (!subscription.items.data[0]) {
        throw new Error('No subscription items found');
      }

      console.log('[StripePaymentService] Current subscription:', {
        id: subscription.id,
        status: subscription.status,
        currentPriceId: subscription.items.data[0].price.id,
        itemId: subscription.items.data[0].id,
      });

      // Mettre à jour l'abonnement avec le nouveau prix
      const updated = await this.stripe.subscriptions.update(params.subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: params.priceId,
          },
        ],
        proration_behavior: 'create_prorations', // Créer automatiquement les prorations
      });

      // Dans la nouvelle API Stripe, current_period_end est dans items.data[0]
      const currentPeriodEnd = (updated.items.data[0] as any).current_period_end;

      console.log('[StripePaymentService] Subscription updated successfully:', {
        subscriptionId: updated.id,
        status: updated.status,
        currentPeriodEnd: currentPeriodEnd,
        newPriceId: updated.items.data[0].price.id,
      });

      if (!currentPeriodEnd) {
        console.error('[StripePaymentService] WARNING: current_period_end is missing from Stripe response!');
        console.error('[StripePaymentService] Full Stripe response:', JSON.stringify(updated, null, 2));
        throw new Error('Stripe did not return current_period_end');
      }

      return {
        subscriptionId: updated.id,
        status: updated.status,
        currentPeriodEnd: currentPeriodEnd,
      };
    } catch (error) {
      console.error('[StripePaymentService] Error updating subscription:', error);
      throw error;
    }
  }
}
