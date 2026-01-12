'use client';

import React from 'react';
import { OnboardingOption } from './OnboardingOption';
import { Button } from '@/components/ui';

export type Domain =
  | 'graphisme'
  | 'motion_design'
  | 'photographie'
  | 'illustration'
  | 'design_produit'
  | 'architecture'
  | 'etudiant'
  | 'autre';

interface OnboardingStep2Props {
  values: Domain[];
  onChange: (values: Domain[]) => void;
  onNext: () => void;
}

const OPTIONS: { value: Domain; label: string }[] = [
  { value: 'graphisme', label: 'Graphisme' },
  { value: 'motion_design', label: 'Motion design' },
  { value: 'photographie', label: 'Photographie' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'design_produit', label: 'Design produit' },
  { value: 'architecture', label: 'Architecture / espace' },
  { value: 'etudiant', label: 'Étudiant' },
  { value: 'autre', label: 'Autre' },
];

export function OnboardingStep2({ values, onChange, onNext }: OnboardingStep2Props) {
  const toggleDomain = (domain: Domain) => {
    if (values.includes(domain)) {
      onChange(values.filter((v) => v !== domain));
    } else {
      onChange([...values, domain]);
    }
  };

  const canProceed = values.length > 0;

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <h1 className="text-2xl md:text-4xl font-extrabold text-[#0D0D0D] text-center leading-tight">
        Tu es plutôt dans quel domaine ?
      </h1>

      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
        {OPTIONS.map((option) => (
          <OnboardingOption
            key={option.value}
            label={option.label}
            selected={values.includes(option.value)}
            onClick={() => toggleDomain(option.value)}
          />
        ))}

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={onNext}
          disabled={!canProceed}
          className={`
            min-h-[70px]
            ${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
