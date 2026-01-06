import { Subscription } from '../models/Subscription';
import { SubscriptionPlan, SubscriptionPlanType, SubscriptionStatus } from '../models/SubscriptionPlan';

/**
 * Domain Service: Logique métier des abonnements
 * Pure business logic sans dépendance infrastructure
 */
export class SubscriptionService {
  /**
   * Vérifier si un utilisateur peut ajouter un lien
   */
  canAddLink(subscription: Subscription): { allowed: boolean; reason?: string } {
    if (!subscription.isActive()) {
      return { allowed: false, reason: 'Subscription is not active' };
    }

    if (subscription.hasReachedLinksLimit()) {
      return {
        allowed: false,
        reason: `Monthly links limit reached (${subscription.monthlyLinksLimit}). Upgrade to Pro to continue.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Vérifier si un utilisateur peut partager avec permissions d'édition
   */
  canShareWithEdit(subscription: Subscription): { allowed: boolean; reason?: string } {
    const plan = SubscriptionPlan.getByType(subscription.plan);

    if (!plan.features.canShareWithEdit) {
      return {
        allowed: false,
        reason: 'Edit sharing requires Pro or Team plan',
      };
    }

    return { allowed: true };
  }

  /**
   * Vérifier si un utilisateur peut créer des groupes de dossiers
   */
  canCreateGroups(subscription: Subscription): { allowed: boolean; reason?: string } {
    const plan = SubscriptionPlan.getByType(subscription.plan);

    if (!plan.features.canCreateGroups) {
      return {
        allowed: false,
        reason: 'Groups require Pro or Team plan',
      };
    }

    return { allowed: true };
  }

  /**
   * Vérifier si un utilisateur peut ajouter un membre à un partage
   */
  canAddShareMember(
    subscription: Subscription,
    currentMembersCount: number
  ): { allowed: boolean; reason?: string } {
    const plan = SubscriptionPlan.getByType(subscription.plan);
    const maxMembers = plan.features.maxShareMembers;

    if (maxMembers === -1) {
      // Illimité
      return { allowed: true };
    }

    if (currentMembersCount >= maxMembers) {
      return {
        allowed: false,
        reason: `Share members limit reached for ${plan.name} plan (${maxMembers} max)`,
      };
    }

    return { allowed: true };
  }

  /**
   * Calculer la nouvelle status d'abonnement selon webhook Stripe
   */
  computeStatusFromStripeEvent(
    stripeStatus: string
  ): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
      case 'trialing':
        return 'active';
      case 'canceled':
      case 'incomplete_expired':
        return 'canceled';
      case 'past_due':
      case 'unpaid':
        return 'past_due';
      default:
        return 'inactive';
    }
  }

  /**
   * Calculer la date d'expiration à partir d'un timestamp Stripe
   */
  computeExpirationDate(stripeCurrentPeriodEnd: number): Date {
    return new Date(stripeCurrentPeriodEnd * 1000);
  }

  /**
   * Déterminer le type de plan à partir du Stripe Price ID
   */
  getPlanFromPriceId(priceId: string): SubscriptionPlanType {
    const proMonthly = process.env.STRIPE_PRICE_PRO_MONTHLY;
    const proYearly = process.env.STRIPE_PRICE_PRO_YEARLY;
    const teamMonthly = process.env.STRIPE_PRICE_TEAM_MONTHLY;
    const teamYearly = process.env.STRIPE_PRICE_TEAM_YEARLY;

    if (priceId === proMonthly || priceId === proYearly) {
      return 'pro';
    }

    if (priceId === teamMonthly || priceId === teamYearly) {
      return 'team';
    }

    return 'free';
  }
}
