'use client';

import { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
  disabled?: boolean;
}

export default function Tooltip({ children, content, disabled = false }: TooltipProps) {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 font-[Heebo] max-w-[280px] w-max text-center">
        {content}
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
          <div className="border-4 border-transparent border-t-black" />
        </div>
      </div>
    </div>
  );
}
