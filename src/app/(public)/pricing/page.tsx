/**
 * Page Pricing - Affiche les différents plans d'abonnement
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useCheckout } from "@/hooks/useCheckout";
import { useUpdateSubscription } from "@/hooks/useUpdateSubscription";
import { usePricing } from "@/hooks/usePricing";
import { useAuthContext } from "@/contexts/AuthContext";
import Header from "@/components/Header";

export default function PricingPage() {
  const { session } = useAuthContext();
  const { subscription, loading } = useSubscription();
  const { createCheckoutSession, loading: checkoutLoading, hasActiveSubscription } = useCheckout();
  const { updateSubscription, loading: updateLoading, success: updateSuccess } = useUpdateSubscription();
  const { pricing } = usePricing();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [managingSubscription, setManagingSubscription] = useState(false);

  const currentPlanType = subscription?.plan || "free";

  // Fonction pour ouvrir le portail Stripe
  const handleManageSubscription = useCallback(async () => {
    if (!session?.accessToken) return;

    setManagingSubscription(true);
    try {
      const response = await fetch("/api/stripe/customer-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error opening customer portal:", error);
      setManagingSubscription(false);
    }
  }, [session?.accessToken]);

  // Si une tentative de checkout échoue car il y a déjà un abonnement actif, ouvrir le portail
  useEffect(() => {
    if (hasActiveSubscription && !managingSubscription) {
      console.log('[PricingPage] Active subscription detected, redirecting to portal...');
      handleManageSubscription();
    }
  }, [hasActiveSubscription, managingSubscription, handleManageSubscription]);

  const plans = [
    {
      name: "Gratuit",
      priceMonthly: "0€",
      priceAnnual: "0€",
      planType: "free" as const,
      description: "Idéal pour tester UnBlank",
      features: [
        "Extension navigateur Chrome",
        "Capture multi-sources (Instagram, Pinterest, Behance...)",
        "Tags manuels",
        "Création de dossiers illimité",
        "Sauvegarde de 50 liens par mois",
        "Collaboration limité à 15 personnes",
        "Création de liens d'affiliations",
      ],
      buttonText: "Continuer avec ce plan",
      buttonStyle: "primary",
      cardStyle: "white",
    },
    {
      name: "Pro",
      priceMonthly: pricing.pro.monthly?.formatted || "6,99€",
      priceAnnual: pricing.pro.annual?.formatted || "69,99€",
      planType: "pro" as const,
      description: "Tester l'expérience complète",
      features: [
        "Toutes les features du plan gratuit",
        "Tags des liens et images automatiquement par IA",
        "Création de groupe de dossier et de sous-dossier en illimités",
        "Collaboration jusqu'à 30 personnes",
        "Liens illimités par mois",
      ],
      buttonText: "Choisir ce forfait",
      buttonStyle: "secondary",
      cardStyle: "black",
      highlighted: true,
    },
  ];

  // Filtrer les plans : ne pas afficher "free" si l'utilisateur a un plan payant
  const displayedPlans = plans.filter((plan) => {
    if (currentPlanType === "pro") {
      return plan.planType !== "free";
    }
    return true;
  });

  return (
    <>
      <Header minimal />
      <div className="min-h-screen bg-[#FEF8EE] flex flex-col justify-center items-center py-16 px-4 gap-12">
        <div className="flex flex-col items-center gap-8 w-full max-w-[956px]">
          {/* Header */}
          <div className="flex flex-col items-center gap-8 w-full max-w-[514px]">
            <h1
              className="text-[42px] font-extrabold leading-[90%] text-center text-[#0D0D0D]"
              style={{ fontFamily: "Area Inktrap, sans-serif" }}
            >
              Tarifs, pensés pour créer
            </h1>
            <p
              className="text-lg font-normal leading-[110%] text-center text-[#0D0D0D]"
              style={{ fontFamily: "Heebo, sans-serif" }}
            >
              Accède à 80% des fonctionnalités gratuitement dès maintenant.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="flex flex-row justify-center items-start gap-8 w-full">
            {displayedPlans.map((plan, index) => (
              <div
                key={plan.planType}
                className={`flex flex-col justify-between items-start p-8 gap-7 w-[308px] h-[573px] rounded-xl ${
                  plan.cardStyle === "black"
                    ? "bg-[#0D0D0D] border-2 border-[#0D0D0D]"
                    : "bg-white border-4 border-[#0D0D0D]"
                } shadow-[6px_6px_0px_#000000]`}
              >
                <div className="flex flex-col items-start gap-7 w-full">
                  {/* Header */}
                  <div className="flex flex-col items-start gap-2.5 w-full">
                    <h3
                      className={`text-[32px] font-extrabold leading-[90%] ${
                        plan.cardStyle === "black"
                          ? "text-[#FEF8EE]"
                          : "text-[#0D0D0D]"
                      }`}
                      style={{ fontFamily: "Area Inktrap, sans-serif" }}
                    >
                      {plan.name}
                    </h3>
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="flex items-baseline gap-1">
                        <span
                          className={`text-[42px] font-extrabold leading-[90%] ${
                            plan.cardStyle === "black"
                              ? "text-[#FEF8EE]"
                              : "text-[#0D0D0D]"
                          }`}
                          style={{ fontFamily: "Area Inktrap, sans-serif" }}
                        >
                          {billingPeriod === "monthly"
                            ? plan.priceMonthly
                            : plan.priceAnnual}
                        </span>
                        <span
                          className={`text-[14px] font-medium leading-[120%] ${
                            plan.cardStyle === "black"
                              ? "text-[#FEF8EE]"
                              : "text-[#0D0D0D]"
                          }`}
                          style={{ fontFamily: "Heebo, sans-serif" }}
                        >
                          {billingPeriod === "annual" &&
                          plan.planType !== "free"
                            ? "/an"
                            : "/mois"}
                        </span>
                      </div>
                      <p
                        className={`text-[14px] font-medium leading-[120%] ${
                          plan.cardStyle === "black"
                            ? "text-[#FEF8EE]"
                            : "text-[#0D0D0D]"
                        }`}
                        style={{ fontFamily: "Heebo, sans-serif" }}
                      >
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-col items-start gap-2.5 w-full">
                    {plan.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex flex-row items-center gap-2.5 w-full"
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="flex-shrink-0"
                        >
                          <path
                            d="M5 13l4 4L19 7"
                            stroke="#FF506F"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span
                          className={`text-[14px] font-normal leading-[120%] flex-1 ${
                            plan.cardStyle === "black"
                              ? "text-[#FEF8EE]"
                              : "text-[#0D0D0D]"
                          }`}
                          style={{ fontFamily: "Heebo, sans-serif" }}
                        >
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={async () => {
                    // Si c'est le plan actuel (et pas gratuit), ouvrir le portail de gestion
                    if (!loading && plan.planType === currentPlanType && plan.planType !== "free") {
                      handleManageSubscription();
                    } else if (plan.planType !== "free") {
                      // Si on a déjà un abonnement actif, mettre à jour au lieu de créer
                      if (subscription && subscription.plan !== "free" && subscription.status === "active") {
                        await updateSubscription(plan.planType, billingPeriod);
                      } else {
                        // Sinon créer un nouveau checkout
                        createCheckoutSession(plan.planType, billingPeriod);
                      }
                    }
                  }}
                  disabled={
                    checkoutLoading || 
                    updateLoading ||
                    managingSubscription ||
                    (!loading && plan.planType === currentPlanType && plan.planType === "free")
                  }
                  className={`flex flex-row justify-center items-center py-2.5 px-[27px] gap-2.5 w-full h-[54px] border-2 border-[#0D0D0D] shadow-[3px_3px_0px_#000000] rounded-xl transition-all ${
                    plan.buttonStyle === "primary"
                      ? "bg-[#FF506F] text-[#0D0D0D]"
                      : "bg-[#FEF8EE] text-[#0D0D0D]"
                  } ${
                    checkoutLoading || updateLoading || managingSubscription || (!loading && plan.planType === currentPlanType && plan.planType === "free")
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#FF6080] active:translate-y-[2px] active:shadow-none cursor-pointer"
                  }`}
                >
                  <span
                    className="text-[16px] font-semibold leading-[23px] text-center"
                    style={{ fontFamily: "Heebo, sans-serif" }}
                  >
                    {!loading && plan.planType === currentPlanType && plan.planType !== "free"
                      ? "Gérer l'abonnement"
                      : !loading && plan.planType === currentPlanType && plan.planType === "free"
                      ? "Plan actuel"
                      : checkoutLoading || updateLoading || managingSubscription
                      ? "Chargement..."
                      : plan.buttonText}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
