'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingStep1, UsageType } from './OnboardingStep1';
import { OnboardingStep2, Domain } from './OnboardingStep2';
import { OnboardingStep3, DiscoverySource } from './OnboardingStep3';
import { Button } from '@/components/ui';
import { supabase } from '@/infra/db/supabase';

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
      // Récupérer le token d'authentification
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
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
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={`
            h-2 rounded-full transition-all duration-300
            ${s === step ? 'bg-[#FF506F] w-8' : s < step ? 'bg-[#FF506F] w-2' : 'bg-gray-300 w-2'}
          `}
        />
      ))}
    </div>
  );

  // Bouton retour avec flèche
  const BackButton = () => (
    <button
      type="button"
      onClick={() => setStep(step - 1)}
      className="
        w-12 h-12 flex items-center justify-center
        bg-white border-2 border-black rounded-full
        shadow-[3px_3px_0px_#000000]
        hover:bg-gray-50 transition-colors
        active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#000000]
      "
      aria-label="Retour"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
    </button>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#FEF8EE] p-4 md:p-6 lg:p-10 overscroll-none">
      {/* Container principal avec bouton retour */}
      <div className="w-full max-w-[800px] flex flex-col gap-6">
        {/* Bouton retour en haut à gauche (sauf étape 1) */}
        <div className="h-12">
          {step > 1 && <BackButton />}
        </div>

        {/* Card principale */}
        <div className="w-full bg-white border-4 border-black rounded-[24px] shadow-[6px_6px_0px_#000000] p-2.5">
          <div className="flex flex-col items-center p-4 md:p-8">
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
          </div>
        </div>

        {/* Indicateur de progression en bas */}
        <div className="py-4">
          <ProgressIndicator />
        </div>
      </div>
    </div>
  );
}
