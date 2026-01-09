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
import SubscriptionChangeModal from "@/components/SubscriptionChangeModal";

export default function PricingPage() {
  const { session } = useAuthContext();
  const { subscription, loading } = useSubscription();
  const {
    createCheckoutSession,
    loading: checkoutLoading,
    hasActiveSubscription,
  } = useCheckout();
  const { updateSubscription, loading: updateLoading } =
    useUpdateSubscription();
  const { pricing } = usePricing();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPlanChange, setPendingPlanChange] = useState<{
    planType: "pro" | "team";
    planName: string;
    price: string;
  } | null>(null);

  const currentPlanType = subscription?.plan || "free";

  // Déterminer la période de facturation actuelle de l'abonnement
  const getCurrentBillingPeriod = (): "monthly" | "annual" => {
    if (!subscription?.stripePriceId) return "monthly";

    const currentPriceId = subscription.stripePriceId;

    // Vérifier si le price ID correspond à un plan annuel
    if (
      currentPriceId === pricing.pro.annual?.priceId ||
      currentPriceId === pricing.team.annual?.priceId
    ) {
      return "annual";
    }

    return "monthly";
  };

  const currentBillingPeriod = getCurrentBillingPeriod();

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
      console.log(
        "[PricingPage] Active subscription detected, redirecting to portal..."
      );
      handleManageSubscription();
    }
  }, [hasActiveSubscription, managingSubscription, handleManageSubscription]);

  // Gérer la confirmation du changement de plan
  const handleConfirmPlanChange = async () => {
    if (!pendingPlanChange) return;

    setShowConfirmModal(false);
    await updateSubscription(pendingPlanChange.planType, billingPeriod);
    setPendingPlanChange(null);
  };

  // Gérer le clic sur un bouton de plan
  const handlePlanClick = (plan: (typeof plans)[number]) => {
    // Si c'est le plan actuel ET la même période de facturation (et pas gratuit), ouvrir le portail de gestion
    const isSamePlanAndPeriod =
      !loading &&
      plan.planType === currentPlanType &&
      billingPeriod === currentBillingPeriod &&
      plan.planType !== "free";

    if (isSamePlanAndPeriod) {
      handleManageSubscription();
    } else if (plan.planType !== "free") {
      // Si on a déjà un abonnement actif, afficher la modale de confirmation
      if (
        subscription &&
        subscription.plan !== "free" &&
        subscription.status === "active"
      ) {
        setPendingPlanChange({
          planType: plan.planType,
          planName: plan.name,
          price:
            billingPeriod === "monthly" ? plan.priceMonthly : plan.priceAnnual,
        });
        setShowConfirmModal(true);
      } else {
        // Sinon créer un nouveau checkout
        createCheckoutSession(plan.planType, billingPeriod);
      }
    }
  };

  // Calculer les pourcentages de réduction pour les plans annuels
  const calculateDiscount = (
    monthlyPrice: number,
    annualPrice: number
  ): number => {
    const yearlyFromMonthly = monthlyPrice * 12;
    const discount =
      ((yearlyFromMonthly - annualPrice) / yearlyFromMonthly) * 100;
    return Math.round(discount);
  };

  const proDiscount = calculateDiscount(
    pricing.pro.monthly?.amount || 6.99,
    pricing.pro.annual?.amount || 69.99
  );

  const teamDiscount = calculateDiscount(
    pricing.team.monthly?.amount || 18.99,
    pricing.team.annual?.amount || 189.99
  );

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
      discount: 0,
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
        "Collaboration jusqu'à 4 personnes en simultané",
      ],
      buttonText: "Choisir ce forfait",
      buttonStyle: "secondary",
      cardStyle: "black",
      highlighted: true,
      discount: proDiscount,
    },
    {
      name: "Team",
      priceMonthly: pricing.team.monthly?.formatted || "18,99€",
      priceAnnual: pricing.team.annual?.formatted || "189,99€",
      planType: "team" as const,
      description: "Pour les équipes de 3 à 5 membres",
      features: ["Toutes les features du plan pro", "Collaboration illimité"],
      buttonText: "Continuer avec ce plan",
      buttonStyle: "primary",
      cardStyle: "white",
      discount: teamDiscount,
    },
  ];

  // Filtrer les plans : ne pas afficher "free" si l'utilisateur a un plan payant
  const displayedPlans = plans.filter((plan) => {
    if (currentPlanType === "pro" || currentPlanType === "team") {
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

          {/* Toggle Mensuel/Annuel */}
          <div className="flex items-center gap-3 p-1.5 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_#000000]">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer border-2 ${
                billingPeriod === "monthly"
                  ? "bg-[#FF506F] text-black border-black"
                  : "bg-gray-50 text-black border-transparent hover:bg-gray-100"
              }`}
              style={{ fontFamily: "Heebo, sans-serif" }}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer border-2 ${
                billingPeriod === "annual"
                  ? "bg-[#FF506F] text-black border-black"
                  : "bg-gray-50 text-black border-transparent hover:bg-gray-100"
              }`}
              style={{ fontFamily: "Heebo, sans-serif" }}
            >
              Annuel
            </button>
          </div>

          {/* Pricing Cards */}
          <div className="flex flex-row justify-center items-start gap-8 w-full">
            {displayedPlans.map((plan, index) => (
              <div
                key={plan.planType}
                className={`relative flex flex-col justify-between items-start p-8 gap-7 w-[308px] h-[573px] rounded-xl ${
                  plan.cardStyle === "black"
                    ? "bg-[#0D0D0D] border-2 border-[#0D0D0D]"
                    : "bg-white border-4 border-[#0D0D0D]"
                } shadow-[6px_6px_0px_#000000]`}
              >
                {/* Badge de réduction (seulement pour les plans annuels payants) */}
                {billingPeriod === "annual" &&
                  plan.planType !== "free" &&
                  plan.discount > 0 && (
                    <div className="absolute -top-5 right-8 flex justify-center items-center px-3 py-3 bg-white border-2 border-black z-10">
                      <span
                        className="text-[18px] font-bold leading-[109%] text-center uppercase text-[#0D0D0D] whitespace-nowrap"
                        style={{ fontFamily: "Heebo, sans-serif" }}
                      >
                        Économisez {plan.discount}%
                      </span>
                    </div>
                  )}
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
                  onClick={() => handlePlanClick(plan)}
                  disabled={
                    checkoutLoading ||
                    updateLoading ||
                    managingSubscription ||
                    (!loading &&
                      plan.planType === currentPlanType &&
                      plan.planType === "free")
                  }
                  className={`flex flex-row justify-center items-center py-2.5 px-[27px] gap-2.5 w-full h-[54px] border-2 border-[#0D0D0D] shadow-[3px_3px_0px_#000000] rounded-xl transition-all ${
                    plan.buttonStyle === "primary"
                      ? "bg-[#FF506F] text-[#0D0D0D]"
                      : "bg-[#FEF8EE] text-[#0D0D0D]"
                  } ${
                    checkoutLoading ||
                    updateLoading ||
                    managingSubscription ||
                    (!loading &&
                      plan.planType === currentPlanType &&
                      plan.planType === "free")
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#FF6080] active:translate-y-[2px] active:shadow-none cursor-pointer"
                  }`}
                >
                  <span
                    className="text-[16px] font-semibold leading-[23px] text-center"
                    style={{ fontFamily: "Heebo, sans-serif" }}
                  >
                    {!loading &&
                    plan.planType === currentPlanType &&
                    billingPeriod === currentBillingPeriod &&
                    plan.planType !== "free"
                      ? "Gérer l'abonnement"
                      : !loading &&
                        plan.planType === currentPlanType &&
                        plan.planType === "free"
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

      {/* Modale de confirmation */}
      {pendingPlanChange && (
        <SubscriptionChangeModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setPendingPlanChange(null);
          }}
          onConfirm={handleConfirmPlanChange}
          currentPlan={currentPlanType}
          newPlan={pendingPlanChange.planType}
          currentPrice={
            currentPlanType === "pro"
              ? billingPeriod === "monthly"
                ? pricing.pro.monthly?.formatted || "6,99€"
                : pricing.pro.annual?.formatted || "69,99€"
              : currentPlanType === "team"
              ? billingPeriod === "monthly"
                ? pricing.team.monthly?.formatted || "18,99€"
                : pricing.team.annual?.formatted || "189,99€"
              : "0€"
          }
          newPrice={pendingPlanChange.price}
          billingPeriod={billingPeriod}
        />
      )}
    </>
  );
}
