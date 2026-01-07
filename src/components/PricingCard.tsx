/**
 * Composant pour afficher une carte de plan d'abonnement
 */

"use client";

import { ReactNode } from "react";
import { SubscriptionPlanType } from "@/domain/subscription/models/SubscriptionPlan";
import { useCheckout } from "@/hooks/useCheckout";
import { useAuthContext } from "@/contexts/AuthContext";

interface Feature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  planType: SubscriptionPlanType;
  name: string;
  price: string;
  period: string;
  description: string;
  features: Feature[];
  highlighted?: boolean;
  currentPlan?: boolean;
}

export function PricingCard({
  planType,
  name,
  price,
  period,
  description,
  features,
  highlighted = false,
  currentPlan = false,
}: PricingCardProps) {
  const { createCheckoutSession, loading } = useCheckout();
  const { session } = useAuthContext();

  const handleSubscribe = () => {
    if (!session?.user) {
      // Rediriger vers la page de connexion
      window.location.href = "/auth/signin?redirect=/pricing";
      return;
    }

    createCheckoutSession(planType);
  };

  return (
    <div
      className={`
        relative rounded-2xl border p-8 
        ${
          highlighted
            ? "border-blue-500 shadow-xl scale-105"
            : "border-gray-200"
        }
        ${currentPlan ? "bg-gray-50" : "bg-white"}
        transition-all duration-300 hover:shadow-lg
      `}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
          Populaire
        </div>
      )}

      {currentPlan && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
          Plan actuel
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
        <p className="text-gray-600 text-sm mb-4">{description}</p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-gray-900">{price}</span>
          <span className="text-gray-600">/ {period}</span>
        </div>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            {feature.included ? (
              <svg
                className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
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
            ) : (
              <svg
                className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span
              className={`text-sm ${
                feature.included
                  ? "text-gray-700"
                  : "text-gray-400 line-through"
              }`}
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSubscribe}
        disabled={loading || currentPlan}
        className={`
          w-full py-3 px-6 rounded-lg font-medium transition-colors
          ${
            currentPlan
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : highlighted
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-900 text-white hover:bg-gray-800"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {loading
          ? "Chargement..."
          : currentPlan
          ? "Plan actuel"
          : "Choisir ce plan"}
      </button>
    </div>
  );
}
