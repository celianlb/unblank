/**
 * Page Pricing - Affiche les différents plans d'abonnement
 */

"use client";

import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useCheckout } from "@/hooks/useCheckout";
import Header from "@/components/Header";

export default function PricingPage() {
  const { subscription, loading } = useSubscription();
  const { createCheckoutSession, loading: checkoutLoading } = useCheckout();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "monthly"
  );

  const currentPlanType = subscription?.planType || "free";

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
        "Collaboration limité à 2 personnes en simultané",
        "Création de liens d'affiliations",
      ],
      buttonText: "Continuer avec ce plan",
      buttonStyle: "primary",
      cardStyle: "white",
    },
    {
      name: "Pro",
      priceMonthly: "6,99€",
      priceAnnual: "69,99€",
      planType: "pro" as const,
      description: "Tester l'expérience complète",
      features: [
        "Toutes les features du plan gratuit",
        "Tags des liens et images automatiquement par IA",
        "Création de groupe de dossier et de sous-dossier en illimités",
        "Collaboration jusqu'à 4 personnes en simultané",
      ],
      buttonText: "Choisir ce forfait",
      buttonStyle: "secondary",
      cardStyle: "black",
      highlighted: true,
    },
    {
      name: "Team",
      priceMonthly: "18,99€",
      priceAnnual: "189,99€",
      planType: "team" as const,
      description: "Pour les équipes de 3 à 5 membres",
      features: ["Toutes les features du plan pro", "Collaboration illimité"],
      buttonText: "Continuer avec ce plan",
      buttonStyle: "primary",
      cardStyle: "white",
    },
  ];

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

          <div className="flex flex-col items-center gap-16 w-full">
            {/* Toggle Mensuel/Annuel */}
            <div className="flex flex-row items-start p-2 gap-2 w-[231px] h-[68px] bg-white border-[3px] border-black shadow-[4px_4px_0px_#000000] rounded-xl">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`flex flex-row justify-center items-center py-[18px] px-5 gap-2 w-[110px] h-[52px] rounded border-2 border-black transition-colors ${
                  billingPeriod === "monthly"
                    ? "bg-[#FF506F]"
                    : "bg-transparent"
                }`}
              >
                <span
                  className="text-lg font-medium leading-[90%] text-center text-[#0D0D0D]"
                  style={{ fontFamily: "Heebo, sans-serif" }}
                >
                  Mensuel
                </span>
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={`flex flex-row justify-center items-center py-[18px] px-5 gap-2 flex-1 h-[52px] rounded border-2 border-transparent transition-colors ${
                  billingPeriod === "annual"
                    ? "bg-[#FF506F] border-black"
                    : "bg-transparent"
                }`}
              >
                <span
                  className="text-lg font-medium leading-[90%] text-center text-[#0D0D0D]"
                  style={{ fontFamily: "Heebo, sans-serif" }}
                >
                  Annuel
                </span>
              </button>
            </div>

            {/* Pricing Cards */}
            <div className="flex flex-row justify-between items-start gap-8 w-full">
              {plans.map((plan, index) => (
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
                        <p
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
                          {billingPeriod === "annual" &&
                          plan.planType !== "free"
                            ? "/an"
                            : "/mois"}
                        </p>
                        <p
                          className={`text-sm font-medium leading-[120%] ${
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
                            className={`text-sm font-normal leading-[120%] flex-1 ${
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
                    onClick={() =>
                      plan.planType !== "free" &&
                      createCheckoutSession(plan.planType, billingPeriod)
                    }
                    disabled={
                      checkoutLoading ||
                      (!loading && plan.planType === currentPlanType)
                    }
                    className={`flex flex-row justify-center items-center py-2.5 px-7 gap-2.5 w-full h-[54px] border-2 border-[#0D0D0D] shadow-[3px_3px_0px_#000000] rounded-xl transition-all ${
                      plan.buttonStyle === "primary"
                        ? "bg-[#FF506F] text-[#0D0D0D]"
                        : "bg-[#FEF8EE] text-[#0D0D0D]"
                    } ${
                      checkoutLoading ||
                      (!loading && plan.planType === currentPlanType)
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-[#FF6080] active:translate-y-[2px] active:shadow-none cursor-pointer"
                    }`}
                  >
                    <span
                      className="text-base font-semibold leading-[23px] text-center"
                      style={{ fontFamily: "Heebo, sans-serif" }}
                    >
                      {!loading && plan.planType === currentPlanType
                        ? "Plan actuel"
                        : checkoutLoading
                        ? "Chargement..."
                        : plan.buttonText}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
