import { SubscriptionPaymentPort, WebhookEventData } from '../ports/SubscriptionPaymentPort';
import { SubscriptionService } from '@/domain/subscription/services/SubscriptionService';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Use Case: Gérer les webhooks Stripe
 * Application Layer - Traite les événements Stripe et met à jour la DB
 */

export class HandleWebhookUseCase {
  constructor(
    private readonly paymentService: SubscriptionPaymentPort,
    private readonly subscriptionService: SubscriptionService,
    private readonly supabase: SupabaseClient
  ) {}

  async execute(body: string | Buffer, signature: string): Promise<void> {
    // 1. Vérifier et parser le webhook
    const event = await this.paymentService.verifyAndParseWebhook({
      body,
      signature,
    });

    console.log(`[Webhook] Processing event: ${event.type}`);

    // 2. Router selon le type d'événement
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event);
        break;

      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event);
        break;

      case 'invoice.paid':
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaid(event);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event);
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(event);
        break;

      case 'charge.dispute.created':
        await this.handleChargeDispute(event);
        break;

      case 'customer.subscription.trial_will_end':
        await this.handleTrialWillEnd(event);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Checkout complété - Première souscription
   */
  private async handleCheckoutCompleted(event: WebhookEventData): Promise<void> {
    if (!event.customerId || !event.subscriptionId || !event.priceId) {
      throw new Error('Missing required fields in checkout.session.completed');
    }

    // Déterminer le plan depuis le Price ID
    const plan = this.subscriptionService.getPlanFromPriceId(event.priceId);
    const status = this.subscriptionService.computeStatusFromStripeEvent(event.status || 'active');
    const expiresAt = event.currentPeriodEnd
      ? this.subscriptionService.computeExpirationDate(event.currentPeriodEnd)
      : undefined;

    // Trouver l'utilisateur par stripe_customer_id
    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', event.customerId)
      .single();

    if (userError || !user) {
      console.error('[Webhook] User not found for customer:', event.customerId, userError);
      return;
    }

    // Mettre à jour l'abonnement
    const { error: updateError } = await this.supabase
      .from('users')
      .update({
        subscription_plan: plan,
        subscription_status: status,
        stripe_subscription_id: event.subscriptionId,
        stripe_price_id: event.priceId,
        subscription_expires_at: expiresAt?.toISOString(),
        monthly_links_limit: plan === 'pro' || plan === 'team' ? -1 : 50,
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    // Logger l'événement
    await this.logSubscriptionEvent(user.id, event);

    console.log(`[Webhook] ✅ Checkout completed for user ${user.id}, plan: ${plan}`);
  }

  /**
   * Abonnement mis à jour
   */
  private async handleSubscriptionUpdated(event: WebhookEventData): Promise<void> {
    if (!event.subscriptionId || !event.priceId) {
      throw new Error('Missing required fields in customer.subscription.updated');
    }

    const plan = this.subscriptionService.getPlanFromPriceId(event.priceId);
    const status = this.subscriptionService.computeStatusFromStripeEvent(event.status || 'active');
    const expiresAt = event.currentPeriodEnd
      ? this.subscriptionService.computeExpirationDate(event.currentPeriodEnd)
      : undefined;

    // Trouver l'utilisateur
    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('id')
      .eq('stripe_subscription_id', event.subscriptionId)
      .single();

    if (userError || !user) {
      console.error('[Webhook] User not found for subscription:', event.subscriptionId);
      return;
    }

    // Mettre à jour
    const { error: updateError } = await this.supabase
      .from('users')
      .update({
        subscription_plan: plan,
        subscription_status: status,
        stripe_price_id: event.priceId,
        subscription_expires_at: expiresAt?.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    await this.logSubscriptionEvent(user.id, event);

    console.log(`[Webhook] Subscription updated for user ${user.id}`);
  }

  /**
   * Abonnement supprimé/annulé
   */
  private async handleSubscriptionDeleted(event: WebhookEventData): Promise<void> {
    if (!event.subscriptionId) {
      throw new Error('Missing subscription ID in customer.subscription.deleted');
    }

    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('id')
      .eq('stripe_subscription_id', event.subscriptionId)
      .single();

    if (userError || !user) {
      console.error('[Webhook] User not found for subscription:', event.subscriptionId);
      return;
    }

    // Révoquer l'abonnement → retour au plan gratuit
    const { error: updateError } = await this.supabase
      .from('users')
      .update({
        subscription_plan: 'free',
        subscription_status: 'canceled',
        monthly_links_limit: 50,
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(`Failed to cancel subscription: ${updateError.message}`);
    }

    await this.logSubscriptionEvent(user.id, event);

    console.log(`[Webhook] Subscription canceled for user ${user.id}`);
  }

  /**
   * Facture payée
   */
  private async handleInvoicePaid(event: WebhookEventData): Promise<void> {
    if (!event.subscriptionId) return;

    const { data: user } = await this.supabase
      .from('users')
      .select('id')
      .eq('stripe_subscription_id', event.subscriptionId)
      .single();

    if (user) {
      await this.logSubscriptionEvent(user.id, event);
      console.log(`[Webhook] Invoice paid for user ${user.id}`);
    }
  }

  /**
   * Échec de paiement
   */
  private async handleInvoicePaymentFailed(event: WebhookEventData): Promise<void> {
    if (!event.subscriptionId) return;

    const { data: user } = await this.supabase
      .from('users')
      .select('id')
      .eq('stripe_subscription_id', event.subscriptionId)
      .single();

    if (user) {
      // Marquer comme past_due
      await this.supabase
        .from('users')
        .update({ subscription_status: 'past_due' })
        .eq('id', user.id);

      await this.logSubscriptionEvent(user.id, event);

      console.log(`[Webhook] Payment failed for user ${user.id}`);
    }
  }

  /**
   * Abonnement créé (premier événement lors d'une nouvelle souscription)
   */
  private async handleSubscriptionCreated(event: WebhookEventData): Promise<void> {
    if (!event.subscriptionId || !event.customerId) return;

    const { data: user } = await this.supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', event.customerId)
      .single();

    if (user) {
      await this.logSubscriptionEvent(user.id, event);
      console.log(`[Webhook] Subscription created for user ${user.id}`);
    }
  }

  /**
   * Remboursement émis
   */
  private async handleChargeRefunded(event: WebhookEventData): Promise<void> {
    if (!event.customerId) return;

    const { data: user } = await this.supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', event.customerId)
      .single();

    if (user) {
      await this.logSubscriptionEvent(user.id, event);
      console.log(`[Webhook] ⚠️ Charge refunded for user ${user.id}, amount: ${event.amount}`);
    }
  }

  /**
   * Litige bancaire créé
   */
  private async handleChargeDispute(event: WebhookEventData): Promise<void> {
    // Les disputes n'ont pas toujours de customerId directement
    await this.supabase.from('subscription_events').insert({
      user_id: null,
      event_type: event.type,
      stripe_event_id: event.eventId,
      amount: event.amount,
      currency: event.currency,
      status: event.status,
      metadata: event as any,
    });

    console.log(`[Webhook] ⚠️ Dispute created, amount: ${event.amount}`);
  }

  /**
   * Période d'essai bientôt terminée
   */
  private async handleTrialWillEnd(event: WebhookEventData): Promise<void> {
    if (!event.subscriptionId) return;

    const { data: user } = await this.supabase
      .from('users')
      .select('id')
      .eq('stripe_subscription_id', event.subscriptionId)
      .single();

    if (user) {
      await this.logSubscriptionEvent(user.id, event);
      console.log(`[Webhook] Trial will end soon for user ${user.id}`);
    }
  }

  /**
   * Logger l'événement dans subscription_events
   */
  private async logSubscriptionEvent(userId: string, event: WebhookEventData): Promise<void> {
    await this.supabase.from('subscription_events').insert({
      user_id: userId,
      event_type: event.type,
      stripe_event_id: event.eventId, // Vrai Stripe event ID
      amount: event.amount,
      currency: event.currency,
      status: event.status,
      metadata: event as any,
    });
  }
}
