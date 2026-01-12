"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSubscription } from "@/hooks/useSubscription";

interface BetaTrialBannerProps {
  className?: string;
}

export default function BetaTrialBanner({ className = "" }: BetaTrialBannerProps) {
  const { subscription, loading } = useSubscription();

  // Ne pas afficher si en cours de chargement ou pas en trial
  if (loading || !subscription?.isOnBetaTrial()) {
    return null;
  }

  const daysRemaining = subscription.getTrialDaysRemaining();

  return (
    <div
      className={`w-full bg-gradient-to-r from-[#FFE3E8] to-[#E8D4FF] border-b-2 border-black ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#FF506F] border-2 border-black">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-black">
            Essai Pro gratuit
            {daysRemaining > 0 && (
              <span className="ml-1.5 text-[#636363]">
                • {daysRemaining} jour{daysRemaining > 1 ? "s" : ""} restant
                {daysRemaining > 1 ? "s" : ""}
              </span>
            )}
          </span>
        </div>

        <Link
          href="/pricing"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          Garder Pro
          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}
