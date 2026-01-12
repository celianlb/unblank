'use client';

import React from 'react';

interface OnboardingOptionProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function OnboardingOption({
  label,
  selected,
  onClick,
  disabled = false,
}: OnboardingOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full min-h-[70px] px-6 py-4
        border-2 border-black rounded-xl
        font-semibold text-lg text-[#0D0D0D]
        transition-all duration-200
        ${selected
          ? 'bg-[#FF506F] shadow-[4px_4px_0px_#000000]'
          : 'bg-white shadow-[4px_4px_0px_#000000] hover:bg-[#FFF5F7]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#000000]
      `}
    >
      {label}
    </button>
  );
}
