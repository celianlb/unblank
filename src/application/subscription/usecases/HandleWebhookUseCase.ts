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

    console.log(`[Webhook] Processing event: ${event.type}`, {
      subscriptionId: event.subscriptionId,
      currentPeriodEnd: event.currentPeriodEnd,
      currentPeriodEndDate: event.currentPeriodEnd 
        ? new Date(event.currentPeriodEnd * 1000).toISOString() 
        : null,
    });

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
   * Note: Cet événement peut arriver avant ou après customer.subscription.created
   * Si priceId manque (subscription not expanded), on laisse customer.subscription.created gérer
   */
  private async handleCheckoutCompleted(event: WebhookEventData): Promise<void> {
    if (!event.customerId || !event.subscriptionId) {
      console.error('[Webhook] Missing customerId or subscriptionId in checkout.session.completed');
      return;
    }

    // Si priceId manque, c'est que la subscription n'est pas expanded
    // On laisse customer.subscription.created gérer la création
    if (!event.priceId) {
      console.log('[Webhook] No priceId in checkout.session.completed, relying on customer.subscription.created');
      return;
    }

    // Déterminer le plan depuis le Price ID
    const plan = this.subscriptionService.getPlanFromPriceId(event.priceId);
    const status = this.subscriptionService.computeStatusFromStripeEvent(event.status || 'active');

    // IMPORTANT: Pour les abonnements actifs, on stocke current_period_end
    // Cela permet de savoir jusqu'à quand l'accès reste valide si l'abonnement est annulé
    const currentPeriodEnd = event.currentPeriodEnd
      ? this.subscriptionService.computeExpirationDate(event.currentPeriodEnd)
      : null;

    console.log(`[Webhook] Subscription data:`, {
      customerId: event.customerId,
      subscriptionId: event.subscriptionId,
      priceId: event.priceId,
      currentPeriodEnd: currentPeriodEnd?.toISOString(),
      cancelAtPeriodEnd: event.cancelAtPeriodEnd,
    });

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
        // Pour un abonnement actif récurrent: stocke la fin de période actuelle
        // Pour un abonnement annulé: permet de garder l'accès jusqu'à cette date
        subscription_expires_at: currentPeriodEnd?.toISOString() || null,
        monthly_links_limit: plan === 'pro' ? -1 : 50,
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    // Logger l'événement
    await this.logSubscriptionEvent(user.id, event);

    console.log(`[Webhook] ✅ Checkout completed for user ${user.id}, plan: ${plan}, expires_at: ${currentPeriodEnd?.toISOString()}`);
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
    const currentPeriodEnd = event.currentPeriodEnd
      ? this.subscriptionService.computeExpirationDate(event.currentPeriodEnd)
      : null;

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

    // Si l'abonnement est annulé mais reste actif jusqu'à la fin de la période
    // (cancel_at_period_end = true), on garde le plan actif avec la date d'expiration
    const finalStatus = event.cancelAtPeriodEnd && status === 'active' ? 'active' : status;

    console.log(`[Webhook] Subscription update:`, {
      userId: user.id,
      plan,
      status: finalStatus,
      cancelAtPeriodEnd: event.cancelAtPeriodEnd,
      currentPeriodEnd: currentPeriodEnd?.toISOString(),
    });

    // Mettre à jour
    const { error: updateError } = await this.supabase
      .from('users')
      .update({
        subscription_plan: plan,
        subscription_status: finalStatus,
        stripe_price_id: event.priceId,
        subscription_expires_at: currentPeriodEnd?.toISOString() || null,
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    await this.logSubscriptionEvent(user.id, event);

    console.log(`[Webhook] ✅ Subscription updated for user ${user.id}, expires_at: ${currentPeriodEnd?.toISOString()}`);
  }

  /**
   * Abonnement supprimé/annulé
   * Cet événement arrive quand l'abonnement expire définitivement
   */
  private async handleSubscriptionDeleted(event: WebhookEventData): Promise<void> {
    console.log(`[Webhook] Processing subscription deletion:`, {
      subscriptionId: event.subscriptionId,
      customerId: event.customerId,
      eventId: event.eventId,
    });

    if (!event.subscriptionId) {
      console.error('[Webhook] Missing subscription ID in customer.subscription.deleted');
      throw new Error('Missing subscription ID in customer.subscription.deleted');
    }

    // Chercher par stripe_subscription_id d'abord
    let user = await this.supabase
      .from('users')
      .select('id, username, subscription_plan')
      .eq('stripe_subscription_id', event.subscriptionId)
      .single();

    // Fallback: chercher par stripe_customer_id si subscription_id ne trouve rien
    if (user.error && event.customerId) {
      console.log('[Webhook] User not found by subscription_id, trying by customer_id:', event.customerId);
      user = await this.supabase
        .from('users')
        .select('id, username, subscription_plan')
        .eq('stripe_customer_id', event.customerId)
        .single();
    }

    if (user.error || !user.data) {
      console.error('[Webhook] User not found for subscription:', event.subscriptionId, 'Error:', user.error);
      // Logger l'événement même si l'utilisateur n'est pas trouvé (pour audit)
      await this.supabase.from('subscription_events').insert({
        user_id: null,
        event_type: event.type,
        stripe_event_id: event.eventId,
        amount: event.amount,
        currency: event.currency,
        status: event.status,
        metadata: event as any,
      });
      return;
    }

    console.log(`[Webhook] Found user ${user.data.id} (${user.data.username}), current plan: ${user.data.subscription_plan}`);

    // Révoquer l'abonnement → retour au plan gratuit
    const { error: updateError } = await this.supabase
      .from('users')
      .update({
        subscription_plan: 'free',
        subscription_status: 'canceled',
        monthly_links_limit: 50,
        subscription_expires_at: null, // Nettoyer la date d'expiration
      })
      .eq('id', user.data.id);

    if (updateError) {
      console.error('[Webhook] Failed to update user:', updateError);
      throw new Error(`Failed to cancel subscription: ${updateError.message}`);
    }

    // Logger l'événement
    await this.logSubscriptionEvent(user.data.id, event);

    console.log(`[Webhook] ✅ Subscription canceled for user ${user.data.id} (${user.data.username})`);
  }

  /**
   * Facture payée - Renouvellement mensuel
   */
  private async handleInvoicePaid(event: WebhookEventData): Promise<void> {
    if (!event.subscriptionId) {
      console.log('[Webhook] No subscription ID in invoice.paid event');
      return;
    }

    // Chercher par stripe_subscription_id d'abord
    let user = await this.supabase
      .from('users')
      .select('id, subscription_plan, subscription_status')
      .eq('stripe_subscription_id', event.subscriptionId)
      .single();

    // Fallback: chercher par stripe_customer_id si subscription_id ne trouve rien
    if (user.error && event.customerId) {
      console.log('[Webhook] User not found by subscription_id, trying by customer_id:', event.customerId);
      user = await this.supabase
        .from('users')
        .select('id, subscription_plan, subscription_status')
        .eq('stripe_customer_id', event.customerId)
        .single();
    }

    if (user.error || !user.data) {
      console.error('[Webhook] User not found for subscription:', event.subscriptionId, 'or customer:', event.customerId);
      return;
    }

    // Mettre à jour la date d'expiration si on a currentPeriodEnd
    if (event.currentPeriodEnd) {
      const expirationDate = this.subscriptionService.computeExpirationDate(event.currentPeriodEnd);
      
      const { error: updateError } = await this.supabase
        .from('users')
        .update({
          subscription_expires_at: expirationDate.toISOString(),
          subscription_status: 'active', // Remettre à actif en cas de past_due
        })
        .eq('id', user.data.id);

      if (updateError) {
        console.error('[Webhook] Failed to update expiration date:', updateError);
      } else {
        console.log(`[Webhook] ✅ Invoice paid for user ${user.data.id}, expires_at updated to: ${expirationDate.toISOString()}`);
      }
    } else {
      console.log(`[Webhook] Invoice paid for user ${user.data.id} (no currentPeriodEnd to update)`);
    }

    await this.logSubscriptionEvent(user.data.id, event);
  }

  /**
   * Échec de paiement
   */
  private async handleInvoicePaymentFailed(event: WebhookEventData): Promise<void> {
    if (!event.subscriptionId) return;

    // Chercher par stripe_subscription_id d'abord
    let user = await this.supabase
      .from('users')
      .select('id')
      .eq('stripe_subscription_id', event.subscriptionId)
      .single();

    // Fallback: chercher par stripe_customer_id
    if (user.error && event.customerId) {
      console.log('[Webhook] User not found by subscription_id, trying by customer_id:', event.customerId);
      user = await this.supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', event.customerId)
        .single();
    }

    if (user.data) {
      // Marquer comme past_due
      await this.supabase
        .from('users')
        .update({ subscription_status: 'past_due' })
        .eq('id', user.data.id);

      await this.logSubscriptionEvent(user.data.id, event);

      console.log(`[Webhook] Payment failed for user ${user.data.id}`);
    } else {
      console.error('[Webhook] User not found for failed payment:', event.subscriptionId);
    }
  }

  /**
   * Abonnement créé (premier événement lors d'une nouvelle souscription)
   * Cet événement arrive AVANT ou APRÈS checkout.session.completed selon les cas
   */
  private async handleSubscriptionCreated(event: WebhookEventData): Promise<void> {
    if (!event.subscriptionId || !event.customerId || !event.priceId) {
      console.log('[Webhook] Missing required fields in customer.subscription.created');
      return;
    }

    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('id, stripe_subscription_id, subscription_plan')
      .eq('stripe_customer_id', event.customerId)
      .single();

    if (userError || !user) {
      console.error('[Webhook] User not found for customer:', event.customerId);
      return;
    }

    // Déterminer le plan
    const plan = this.subscriptionService.getPlanFromPriceId(event.priceId);
    const status = this.subscriptionService.computeStatusFromStripeEvent(event.status || 'active');
    const currentPeriodEnd = event.currentPeriodEnd
      ? this.subscriptionService.computeExpirationDate(event.currentPeriodEnd)
      : null;

    console.log(`[Webhook] Creating subscription for user ${user.id}, plan: ${plan}, expires_at: ${currentPeriodEnd?.toISOString()}`);

    // Mettre à jour l'abonnement (même si un ancien existe, on écrase)
    const { error: updateError } = await this.supabase
      .from('users')
      .update({
        subscription_plan: plan,
        subscription_status: status,
        stripe_subscription_id: event.subscriptionId,
        stripe_price_id: event.priceId,
        subscription_expires_at: currentPeriodEnd?.toISOString() || null,
        monthly_links_limit: plan === 'pro' ? -1 : 50,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[Webhook] Failed to update subscription:', updateError);
    } else {
      console.log(`[Webhook] ✅ Subscription created for user ${user.id}`);
    }

    await this.logSubscriptionEvent(user.id, event);
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
