'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingStep1, UsageType } from './OnboardingStep1';
import { OnboardingStep2, Domain } from './OnboardingStep2';
import { OnboardingStep3, DiscoverySource } from './OnboardingStep3';
import { Button } from '@/components/ui';

interface OnboardingData {
  usageType: UsageType | null;
  domains: Domain[];
  discoverySource: DiscoverySource | null;
}

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<OnboardingData>({
    usageType: null,
    domains: [],
    discoverySource: null,
  });

  const handleUsageTypeChange = (value: UsageType) => {
    setData((prev) => ({ ...prev, usageType: value }));
    // Auto-advance après sélection
    setTimeout(() => setStep(2), 300);
  };

  const handleDomainsChange = (values: Domain[]) => {
    setData((prev) => ({ ...prev, domains: values }));
  };

  const handleDiscoverySourceChange = (value: DiscoverySource) => {
    setData((prev) => ({ ...prev, discoverySource: value }));
  };

  const handleSubmit = async () => {
    if (!data.usageType || data.domains.length === 0 || !data.discoverySource) {
      setError('Veuillez répondre à toutes les questions');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usageType: data.usageType,
          domains: data.domains,
          discoverySource: data.discoverySource,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      // Rediriger vers le dashboard
      router.push('/app');
    } catch (err) {
      console.error('[Onboarding] Submit error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = data.usageType && data.domains.length > 0 && data.discoverySource;

  // Indicateur de progression
  const ProgressIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={`
            w-3 h-3 rounded-full transition-all duration-300
            ${s === step ? 'bg-[#FF506F] w-8' : s < step ? 'bg-[#FF506F]' : 'bg-gray-300'}
          `}
        />
      ))}
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[#FEF8EE] p-4 md:p-6 lg:p-10 overscroll-none">
      <div className="w-full max-w-[800px] bg-white border-4 border-black rounded-[24px] shadow-[6px_6px_0px_#000000] p-2.5">
        <div className="flex flex-col items-center p-4 md:p-8">
          <ProgressIndicator />

          {error && (
            <div className="w-full bg-red-50 border-2 border-red-500 rounded-xl p-4 mb-8">
              <p className="text-sm text-red-700 font-medium text-center">{error}</p>
            </div>
          )}

          {step === 1 && (
            <OnboardingStep1
              value={data.usageType}
              onChange={handleUsageTypeChange}
            />
          )}

          {step === 2 && (
            <OnboardingStep2
              values={data.domains}
              onChange={handleDomainsChange}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <div className="w-full flex flex-col gap-8">
              <OnboardingStep3
                value={data.discoverySource}
                onChange={handleDiscoverySourceChange}
              />

              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className={`
                  w-full min-h-[70px]
                  ${!canSubmit || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isSubmitting ? 'Enregistrement...' : 'Commencer'}
              </Button>
            </div>
          )}

          {/* Bouton retour (sauf étape 1) */}
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="mt-6 text-[#0D0D0D] font-medium hover:opacity-70 transition-opacity underline"
            >
              Retour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
