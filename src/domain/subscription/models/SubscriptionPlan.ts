/**
 * Domain Model: Plan d'abonnement
 * Représente les différents plans disponibles sur Unblank
 */

export type SubscriptionPlanType = 'free' | 'pro';
export type SubscriptionStatus = 'inactive' | 'active' | 'canceled' | 'past_due';
export type BillingInterval = 'monthly' | 'yearly';

export interface SubscriptionPlanFeatures {
  monthlyLinksLimit: number; // 50 pour free, illimité pour pro
  canUseAITags: boolean; // false pour free, true pour pro
  canCreateGroups: boolean; // false pour free, true pour pro
  canShareWithEdit: boolean; // false pour free, true pour pro
  maxShareMembers: number; // 15 pour free, 30 pour pro
}

export interface SubscriptionPlanPricing {
  monthlyPrice: number; // en euros
  yearlyPrice: number; // en euros
  yearlyDiscount: number; // en pourcentage
}

export class  SubscriptionPlan {
  constructor(
    public readonly type: SubscriptionPlanType,
    public readonly name: string,
    public readonly description: string,
    public readonly features: SubscriptionPlanFeatures,
    public readonly pricing: SubscriptionPlanPricing | null, // null pour free
    public readonly stripePriceIds?: {
      monthly?: string;
      yearly?: string;
    }
  ) {}

  /**
   * Plans disponibles
   */
  static readonly FREE = new SubscriptionPlan(
    'free',
    'Gratuit',
    'Pour découvrir Unblank',
    {
      monthlyLinksLimit: 50,
      canUseAITags: false,
      canCreateGroups: false,
      canShareWithEdit: false,
      maxShareMembers: 15,
    },
    null
  );

  static readonly PRO = new SubscriptionPlan(
    'pro',
    'Pro',
    'Pour créatifs réguliers',
    {
      monthlyLinksLimit: -1, // illimité
      canUseAITags: true,
      canCreateGroups: true,
      canShareWithEdit: true,
      maxShareMembers: 30,
    },
    {
      monthlyPrice: 6.99,
      yearlyPrice: 59.0,
      yearlyDiscount: 30, // ~30% de réduction
    },
    {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    }
  );

  /**
   * Récupérer un plan par son type
   */
  static getByType(type: SubscriptionPlanType): SubscriptionPlan {
    switch (type) {
      case 'free':
        return SubscriptionPlan.FREE;
      case 'pro':
        return SubscriptionPlan.PRO;
      default:
        return SubscriptionPlan.FREE;
    }
  }

  /**
   * Vérifier si un plan peut utiliser une fonctionnalité
   */
  canUseFeature(feature: keyof SubscriptionPlanFeatures): boolean {
    return !!this.features[feature];
  }

  /**
   * Obtenir le prix d'un plan selon l'intervalle
   */
  getPrice(interval: BillingInterval): number {
    if (!this.pricing) return 0;
    return interval === 'monthly' ? this.pricing.monthlyPrice : this.pricing.yearlyPrice;
  }

  /**
   * Obtenir le Stripe Price ID selon l'intervalle
   */
  getStripePriceId(interval: BillingInterval): string | undefined {
    return interval === 'monthly' ? this.stripePriceIds?.monthly : this.stripePriceIds?.yearly;
  }
}
