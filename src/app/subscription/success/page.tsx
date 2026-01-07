"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Page de confirmation après un paiement Stripe réussi
 * Affiche un message de succès et redirige vers l'app
 */
export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, refreshSession } = useAuthContext();
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState(5);

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

  // Compte à rebours
  useEffect(() => {
    if (!sessionId) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionId]);

  // Redirection quand countdown atteint 0
  useEffect(() => {
    if (countdown === 0) {
      router.push("/app");
    }
  }, [countdown, router]);

  if (!sessionId) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Paiement réussi !
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Votre abonnement a été activé avec succès. Vous allez être redirigé
          dans {countdown} seconde{countdown > 1 ? "s" : ""}.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => router.push("/app")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Accéder à l&apos;application
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Voir mon profil
          </button>
        </div>

        {session && (
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Connecté en tant que {session.user?.email}
          </p>
        )}
      </div>
    </div>
  );
}
