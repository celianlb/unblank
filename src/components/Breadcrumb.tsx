'use client';

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

interface BreadcrumbProps {
  groupName: string;
}

export default function Breadcrumb({ groupName }: BreadcrumbProps) {
  return (
    <div className="flex flex-row items-center gap-6">
      {/* Home Icon */}
      <Link href="/" className="w-[42px] h-[42px] flex items-center justify-center cursor-pointer group">
        <Home className="w-[35px] h-[35px] text-[#8B8B8B] group-hover:text-[#0D0D0D] transition-colors" strokeWidth={2} />
      </Link>

      {/* Chevron */}
      <div className="w-8 h-8 flex items-center justify-center">
        <ChevronRight className="w-8 h-8 text-[#8B8B8B]" strokeWidth={2} />
      </div>

      {/* Group Name */}
      <div className="flex flex-row items-center gap-[22px]">
        <span
          className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
          style={{ fontFamily: 'Area Inktrap, sans-serif' }}
        >
          {groupName}
        </span>
      </div>
    </div>
  );
}
