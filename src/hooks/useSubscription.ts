/**
 * Hook pour gérer l'état de l'abonnement utilisateur
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { Subscription } from '@/domain/subscription/models/Subscription';

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { session, refreshSession } = useAuthContext();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription', session?.user?.id],
    queryFn: async () => {
      if (!session?.user || !session?.accessToken) {
        return null;
      }

      const response = await fetch('/api/subscription/status', {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const result = await response.json();
      
      // Recréer une vraie instance de Subscription avec les méthodes
      if (result.subscription) {
        return Subscription.fromDatabase({
          id: result.subscription.userId,
          subscription_plan: result.subscription.plan,
          subscription_status: result.subscription.status,
          stripe_customer_id: result.subscription.stripeCustomerId,
          stripe_subscription_id: result.subscription.stripeSubscriptionId,
          stripe_price_id: result.subscription.stripePriceId,
          subscription_expires_at: result.subscription.expiresAt,
          monthly_links_used: result.subscription.monthlyLinksUsed,
          monthly_links_limit: result.subscription.monthlyLinksLimit,
          last_reset_at: result.subscription.lastResetAt,
          trial_ends_at: result.subscription.trialEndsAt,
          is_beta_user: result.subscription.isBetaUser,
        });
      }
      
      return null;
    },
    enabled: !!session?.user,
    staleTime: 0, // Toujours considérer les données comme périmées
    gcTime: 0, // Ne pas garder en cache
    retry: (failureCount, error) => {
      // Si c'est une erreur 401, on refresh la session et on réessaye
      if (error instanceof Error && error.message.includes('401')) {
        refreshSession();
        return failureCount < 2; // Réessayer max 2 fois
      }
      return false;
    },
  });

  return {
    subscription: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refreshSubscription: async () => {
      await refetch();
    },
  };
}
