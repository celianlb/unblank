"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";

/**
 * Page de confirmation après un paiement Stripe réussi
 * Affiche un message de succès et redirige vers l'app
 */
function SubscriptionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useAuthContext();
  const queryClient = useQueryClient();

  const sessionId = searchParams.get("session_id");

  // Redirection immédiate si pas de session_id
  useEffect(() => {
    if (!sessionId) {
      router.push("/app");
    }
  }, [sessionId, router]);

  // Invalider le cache de subscription au montage
  useEffect(() => {
    if (sessionId) {
      // Petit délai pour laisser le temps au webhook de terminer
      const timer = setTimeout(async () => {
        // Invalider le cache pour forcer un refetch
        await queryClient.invalidateQueries({ queryKey: ["subscription"] });

        // Rafraîchir la session pour obtenir les nouvelles données
        await refreshSession();

        // Forcer un refetch immédiat
        await queryClient.refetchQueries({ queryKey: ["subscription"] });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [sessionId, queryClient, refreshSession]);

  if (!sessionId) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-[#FEF8EE] flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Main content card */}
      <div className="relative w-full max-w-2xl">
        <div className="bg-white border-4 border-black rounded-[24px] shadow-[8px_8px_0px_#000000] p-6 sm:p-8 md:p-10">
          {/* Success badge */}
          <div className="flex justify-center" style={{ marginBottom: "2.5rem" }}>
            <div className="relative">
              <div className="w-20 h-20 bg-[#FF506F] border-4 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_#000000]">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="#0D0D0D"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              {/* Sparkle effects */}
              <div className="absolute -top-2 -right-2 w-6 h-6 text-[#FFD93D]">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -left-1 w-4 h-4 text-[#202AED]">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight text-center text-[#0D0D0D]"
            style={{ fontFamily: "Area Inktrap, sans-serif", marginBottom: "3rem" }}
          >
            Bienvenue dans l&apos;aventure !
          </h1>

          {/* Subheading */}
          <p
            className="text-lg sm:text-xl text-center text-[#0D0D0D]"
            style={{ fontFamily: "Heebo, sans-serif", marginBottom: "3rem" }}
          >
            Votre abonnement est maintenant actif.<br />
            Prêt à découvrir toutes les fonctionnalités ?
          </p>

          {/* Mascot */}
          <div className="flex justify-center" style={{ marginBottom: "3rem" }}>
            <div className="relative w-32 h-32 sm:w-40 sm:h-40">
              <Image
                src="/Mascottt.svg"
                alt="Mascotte UnBlank"
                width={160}
                height={160}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => router.push("/app")}
            className="w-full h-16 sm:h-[72px] px-8 rounded-xl sm:rounded-[20px] bg-[#FF506F] hover:bg-[#FF6080] active:translate-y-[3px] active:shadow-none transition-all border-4 border-black shadow-[6px_6px_0px_#000000] font-bold text-[#0D0D0D] text-xl sm:text-2xl cursor-pointer"
            style={{ fontFamily: "Heebo, sans-serif" }}
          >
            C&apos;est parti !
          </button>
        </div>

        {/* Shadow decoration behind card */}
        <div className="absolute inset-0 bg-black rounded-[24px] -z-10 translate-x-2 translate-y-2" />
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FEF8EE]">
        <div className="text-lg font-bold text-[#0D0D0D]" style={{ fontFamily: "Heebo, sans-serif" }}>
          Chargement...
        </div>
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
