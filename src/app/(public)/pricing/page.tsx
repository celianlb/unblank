/**
 * Page Pricing - Affiche les différents plans d'abonnement
 */

"use client";

import { PricingCard } from "@/components/PricingCard";
import { useSubscription } from "@/hooks/useSubscription";
import { SUBSCRIPTION_PLANS } from "@/domain/subscription/models/SubscriptionPlan";

export default function PricingPage() {
  const { subscription, loading } = useSubscription();

  const currentPlanType = subscription?.planType || "free";

  const plans = [
    {
      planType: "free" as const,
      name: "Gratuit",
      price: "0€",
      period: "mois",
      description: "Pour découvrir Unblank",
      features: [
        { text: "30 liens par mois", included: true },
        { text: "Partage avec 2 personnes max", included: true },
        { text: "Extension Chrome", included: true },
        { text: "Recherche de base", included: true },
        { text: "Support par email", included: false },
        { text: "Analytics avancées", included: false },
      ],
    },
    {
      planType: "pro" as const,
      name: "Pro",
      price: "9€",
      period: "mois",
      description: "Pour les utilisateurs avancés",
      highlighted: true,
      features: [
        { text: "Liens illimités", included: true },
        { text: "Partage avec 4 personnes max", included: true },
        { text: "Extension Chrome", included: true },
        { text: "Recherche avancée", included: true },
        { text: "Support par email", included: true },
        { text: "Analytics avancées", included: true },
      ],
    },
    {
      planType: "team" as const,
      name: "Team",
      price: "29€",
      period: "mois",
      description: "Pour les équipes",
      features: [
        { text: "Liens illimités", included: true },
        { text: "Partage illimité", included: true },
        { text: "Extension Chrome", included: true },
        { text: "Recherche avancée", included: true },
        { text: "Support prioritaire", included: true },
        { text: "Analytics avancées", included: true },
        { text: "Gestion d'équipe", included: true },
        { text: "SSO (bientôt)", included: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Choisissez le plan qui vous convient
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Organisez vos liens, collaborez avec votre équipe et augmentez votre
            productivité.
          </p>
        </div>

        {/* Pricing Cards - Afficher directement sans attendre le loading */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <PricingCard
              key={plan.planType}
              {...plan}
              currentPlan={!loading && plan.planType === currentPlanType}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Questions fréquentes
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Puis-je changer de plan à tout moment ?
              </h3>
              <p className="text-gray-600">
                Oui, vous pouvez upgrader ou downgrader votre plan à tout
                moment. Les changements sont appliqués immédiatement et la
                facturation est ajustée au prorata.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Que se passe-t-il si je dépasse ma limite ?
              </h3>
              <p className="text-gray-600">
                Pour le plan gratuit, vous ne pourrez plus ajouter de liens
                jusqu'au mois suivant. Nous vous enverrons une notification
                avant d'atteindre la limite.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Puis-je annuler mon abonnement ?
              </h3>
              <p className="text-gray-600">
                Oui, vous pouvez annuler votre abonnement à tout moment depuis
                votre profil. Vous conserverez l'accès jusqu'à la fin de la
                période payée.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Quels moyens de paiement acceptez-vous ?
              </h3>
              <p className="text-gray-600">
                Nous acceptons les cartes bancaires (Visa, Mastercard, American
                Express) via Stripe, notre processeur de paiement sécurisé.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
