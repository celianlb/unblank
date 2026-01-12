'use client';

import React from 'react';
import { OnboardingOption } from './OnboardingOption';

export type UsageType = 'personal' | 'professional' | 'mixed';

interface OnboardingStep1Props {
  value: UsageType | null;
  onChange: (value: UsageType) => void;
}

const OPTIONS: { value: UsageType; label: string }[] = [
  { value: 'personal', label: 'Personnel' },
  { value: 'professional', label: 'Professionnel' },
  { value: 'mixed', label: 'Mixte' },
];

export function OnboardingStep1({ value, onChange }: OnboardingStep1Props) {
  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <h1 className="text-2xl md:text-4xl font-extrabold text-[#0D0D0D] text-center leading-tight">
        Comment vas-tu utiliser Unblank ?
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
