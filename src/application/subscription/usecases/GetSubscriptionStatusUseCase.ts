import { Subscription } from '@/domain/subscription/models';
import { supabase } from '@/infra/db/supabase';

/**
 * Use Case: Récupérer le statut d'abonnement d'un utilisateur
 * Application Layer
 */

export class GetSubscriptionStatusUseCase {
  async execute(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('users')
      .select(
        'id, subscription_plan, subscription_status, stripe_customer_id, stripe_subscription_id, stripe_price_id, subscription_expires_at, monthly_links_used, monthly_links_limit, last_reset_at'
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
