import { SubscriptionPlanType, SubscriptionStatus, BillingInterval } from './SubscriptionPlan';

/**
 * Domain Model: Abonnement utilisateur
 * Entity représentant l'abonnement actif d'un utilisateur
 */
export class Subscription {
  constructor(
    public readonly userId: string,
    public readonly plan: SubscriptionPlanType,
    public readonly status: SubscriptionStatus,
    public readonly stripeCustomerId?: string,
    public readonly stripeSubscriptionId?: string,
    public readonly stripePriceId?: string,
    public readonly expiresAt?: Date,
    public readonly monthlyLinksUsed: number = 0,
    public readonly monthlyLinksLimit: number = 50,
    public readonly lastResetAt: Date = new Date()
  ) {}

  /**
   * Vérifier si l'abonnement est actif
   */
  isActive(): boolean {
    if (this.status !== 'active') return false;
    if (!this.expiresAt) return true; // Free plan ou subscription sans expiration
    return new Date() < this.expiresAt;
  }

  /**
   * Vérifier si l'utilisateur a atteint sa limite de liens
   */
  hasReachedLinksLimit(): boolean {
    if (this.monthlyLinksLimit === -1) return false; // Illimité
    return this.monthlyLinksUsed >= this.monthlyLinksLimit;
  }

  /**
   * Calculer le pourcentage d'utilisation des liens
   */
  getLinksUsagePercentage(): number {
    if (this.monthlyLinksLimit === -1) return 0; // Illimité
    return Math.round((this.monthlyLinksUsed / this.monthlyLinksLimit) * 100);
  }

  /**
   * Vérifier si l'abonnement doit être réinitialisé (nouveau mois)
   */
  shouldResetMonthlyUsage(): boolean {
    const now = new Date();
    const lastReset = new Date(this.lastResetAt);
    return (
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    );
  }

  /**
   * Créer une subscription depuis la DB
   */
  static fromDatabase(data: {
    id: string;
    subscription_plan: SubscriptionPlanType;
    subscription_status: SubscriptionStatus;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    stripe_price_id?: string;
    subscription_expires_at?: string;
    monthly_links_used: number;
    monthly_links_limit: number;
    last_reset_at: string;
  }): Subscription {
    return new Subscription(
      data.id,
      data.subscription_plan,
      data.subscription_status,
      data.stripe_customer_id,
      data.stripe_subscription_id,
      data.stripe_price_id,
      data.subscription_expires_at ? new Date(data.subscription_expires_at) : undefined,
      data.monthly_links_used,
      data.monthly_links_limit,
      new Date(data.last_reset_at)
    );
  }

  /**
   * Convertir en objet pour la DB
   */
  toDatabase() {
    return {
      subscription_plan: this.plan,
      subscription_status: this.status,
      stripe_customer_id: this.stripeCustomerId,
      stripe_subscription_id: this.stripeSubscriptionId,
      stripe_price_id: this.stripePriceId,
      subscription_expires_at: this.expiresAt?.toISOString(),
      monthly_links_used: this.monthlyLinksUsed,
      monthly_links_limit: this.monthlyLinksLimit,
      last_reset_at: this.lastResetAt.toISOString(),
    };
  }
}
