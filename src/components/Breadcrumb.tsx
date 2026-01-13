'use client';

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

interface BreadcrumbItem {
  name: string;
  slug: string;
}

interface BreadcrumbProps {
  /** Liste des dossiers parents (du plus haut au plus proche) */
  parents?: BreadcrumbItem[];
  /** Nom du dossier actuel */
  currentName?: string;
  isLoading?: boolean;
}

export default function Breadcrumb({ parents = [], currentName, isLoading = false }: BreadcrumbProps) {
  return (
    <div className="flex flex-row items-center gap-6 flex-wrap">
      {/* Home Icon */}
      <Link href="/app" className="w-[42px] h-[42px] flex items-center justify-center cursor-pointer group">
        <Home className="w-[35px] h-[35px] text-[#8B8B8B] group-hover:text-[#0D0D0D] transition-colors" strokeWidth={2} />
      </Link>

      {/* Loading skeleton */}
      {isLoading && (
        <>
          <div className="w-8 h-8 flex items-center justify-center">
            <ChevronRight className="w-8 h-8 text-[#8B8B8B]" strokeWidth={2} />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </>
      )}

      {/* Parent folders (clickable) */}
      {!isLoading && parents.map((parent) => (
        <div key={parent.slug} className="flex flex-row items-center gap-6">
          <div className="w-8 h-8 flex items-center justify-center">
            <ChevronRight className="w-8 h-8 text-[#8B8B8B]" strokeWidth={2} />
          </div>
          <Link
            href={`/app/${parent.slug}`}
            className="flex flex-row items-center group"
          >
            <span
              className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#8B8B8B] group-hover:text-[#0D0D0D] transition-colors"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              {parent.name}
            </span>
          </Link>
        </div>
      ))}

      {/* Current folder (not clickable) */}
      {!isLoading && currentName && (
        <>
          <div className="w-8 h-8 flex items-center justify-center">
            <ChevronRight className="w-8 h-8 text-[#8B8B8B]" strokeWidth={2} />
          </div>
          <div className="flex flex-row items-center">
            <span
              className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              {currentName}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
