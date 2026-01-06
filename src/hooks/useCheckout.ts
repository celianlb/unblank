/**
 * Hook pour gérer le processus de checkout Stripe
 */

'use client';

import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { SubscriptionPlanType } from '@/domain/subscription/models/SubscriptionPlan';

interface UseCheckoutReturn {
  createCheckoutSession: (planType: SubscriptionPlanType, billingPeriod?: 'monthly' | 'annual') => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useCheckout(): UseCheckoutReturn {
  const { session } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = async (planType: SubscriptionPlanType, billingPeriod: 'monthly' | 'annual' = 'monthly') => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ planType, billingPeriod }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      if (!url) {
        throw new Error('No checkout URL returned');
      }

      // Rediriger vers Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  return {
    createCheckoutSession,
    loading,
    error,
  };
}
