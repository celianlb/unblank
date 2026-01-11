/**
 * Hook pour récupérer les prix Stripe dynamiques
 */

'use client';

import { useState, useEffect } from 'react';

interface PriceData {
  amount: number;
  priceId: string;
  formatted: string;
}

interface PlanPricing {
  monthly: PriceData | null;
  annual: PriceData | null;
}

interface PricingData {
  pro: PlanPricing;
}

// Prix de fallback en cas d'erreur
const FALLBACK_PRICING: PricingData = {
  pro: {
    monthly: { amount: 6.99, priceId: '', formatted: '6,99€' },
    annual: { amount: 69.99, priceId: '', formatted: '69,99€' },
  },
};

export function usePricing() {
  const [pricing, setPricing] = useState<PricingData>(FALLBACK_PRICING);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/pricing')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch pricing');
        return res.json();
      })
      .then((data) => {
        setPricing(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching pricing:', err);
        setError(err.message);
        setLoading(false);
        // Garder les prix de fallback
      });
  }, []);

  return { pricing, loading, error };
}
