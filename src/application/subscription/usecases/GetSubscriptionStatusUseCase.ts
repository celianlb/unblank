import { Subscription } from '@/domain/subscription/models';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Use Case: Récupérer le statut d'abonnement d'un utilisateur
 * Application Layer
 */

export class GetSubscriptionStatusUseCase {
  constructor(private supabase: SupabaseClient) {}

  async execute(userId: string): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select(
        'id, subscription_plan, subscription_status, stripe_customer_id, stripe_subscription_id, stripe_price_id, subscription_expires_at, monthly_links_used, monthly_links_limit, last_reset_at, trial_ends_at, is_beta_user'
      )
      .eq('id', userId)
      .single();

    if (error) {
      // PGRST116 = utilisateur pas encore créé dans la table users (normal)
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('[GetSubscriptionStatus] Error:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return Subscription.fromDatabase(data);
  }
}
