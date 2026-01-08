/**
 * Hook pour mettre à jour un abonnement existant (upgrade/downgrade)
 */

'use client';

import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { SubscriptionPlanType } from '@/domain/subscription/models/SubscriptionPlan';
import { useQueryClient } from '@tanstack/react-query';

interface UseUpdateSubscriptionReturn {
  updateSubscription: (planType: SubscriptionPlanType, billingPeriod?: 'monthly' | 'annual') => Promise<boolean>;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export function useUpdateSubscription(): UseUpdateSubscriptionReturn {
  const { session } = useAuthContext();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateSubscription = async (
    planType: SubscriptionPlanType,
    billingPeriod: 'monthly' | 'annual' = 'monthly'
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      if (!session?.accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/stripe/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ planType, billingPeriod }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to update subscription`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error('Failed to update subscription');
      }

      // Invalider et refetch le cache React Query pour rafraîchir les données immédiatement
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
      await queryClient.refetchQueries({ queryKey: ['subscription', session.user?.id] });

      setLoading(false);
      setSuccess(true);

      // Réinitialiser le succès après un court délai pour éviter les boucles
      setTimeout(() => setSuccess(false), 100);

      return true;
    } catch (err) {
      console.error('Error updating subscription:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
      setSuccess(false);
      return false;
    }
  };

  return {
    updateSubscription,
    loading,
    error,
    success,
  };
}
