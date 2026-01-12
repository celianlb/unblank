'use client';

import React from 'react';
import { OnboardingOption } from './OnboardingOption';

export type DiscoverySource =
  | 'twitter'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'bouche_a_oreille'
  | 'google'
  | 'autre';

interface OnboardingStep3Props {
  value: DiscoverySource | null;
  onChange: (value: DiscoverySource) => void;
}

const OPTIONS: { value: DiscoverySource; label: string }[] = [
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'bouche_a_oreille', label: 'Bouche à oreille' },
  { value: 'google', label: 'Recherche Google' },
  { value: 'autre', label: 'Autre' },
];

export function OnboardingStep3({ value, onChange }: OnboardingStep3Props) {
  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <h1 className="text-2xl md:text-4xl font-extrabold text-[#0D0D0D] text-center leading-tight">
        Comment as-tu connu Unblank ?
      </h1>

      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
        {OPTIONS.map((option) => (
          <OnboardingOption
            key={option.value}
            label={option.label}
            selected={value === option.value}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
    </div>
  );
}
