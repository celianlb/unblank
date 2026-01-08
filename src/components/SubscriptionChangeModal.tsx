'use client';

interface SubscriptionChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentPlan: string;
  newPlan: string;
  currentPrice: string;
  newPrice: string;
  billingPeriod: 'monthly' | 'annual';
}

export default function SubscriptionChangeModal({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  newPlan,
  currentPrice,
  newPrice,
  billingPeriod
}: SubscriptionChangeModalProps) {
  if (!isOpen) return null;

  const isUpgrade = (currentPlan === 'free' && newPlan !== 'free') ||
                    (currentPlan === 'pro' && newPlan === 'team');
  const isDowngrade = (currentPlan === 'team' && newPlan === 'pro') ||
                      ((currentPlan === 'pro' || currentPlan === 'team') && newPlan === 'free');

  const getTitle = () => {
    if (isUpgrade) {
      return `Passer au forfait ${newPlan === 'pro' ? 'Pro' : 'Team'} ?`;
    }
    if (isDowngrade) {
      return `Rétrograder vers ${newPlan === 'free' ? 'le forfait Gratuit' : 'le forfait Pro'} ?`;
    }
    return 'Modifier votre abonnement ?';
  };

  const getMessage = () => {
    if (isUpgrade) {
      return `Vous allez passer du forfait ${currentPlan === 'free' ? 'Gratuit' : 'Pro'} au forfait ${newPlan === 'pro' ? 'Pro' : 'Team'} pour ${newPrice}${billingPeriod === 'annual' ? '/an' : '/mois'}.`;
    }
    if (isDowngrade) {
      return `Vous allez rétrograder du forfait ${currentPlan === 'team' ? 'Team' : 'Pro'} vers ${newPlan === 'free' ? 'le forfait Gratuit' : `le forfait Pro à ${newPrice}${billingPeriod === 'annual' ? '/an' : '/mois'}`}.`;
    }
    return `Vous allez changer votre abonnement de ${currentPrice} à ${newPrice}.`;
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[520px] pointer-events-auto flex flex-col items-center p-8 gap-2.5 box-border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center gap-6 w-full">
            {/* Title & Message */}
            <div className="flex flex-col items-center gap-4 w-full">
              <h2
                className="text-2xl leading-[110%] font-extrabold text-[#0D0D0D] text-center"
                style={{ fontFamily: 'Area Inktrap, sans-serif' }}
              >
                {getTitle()}
              </h2>
              <p
                className="text-base leading-[140%] font-normal text-[#0D0D0D] text-center"
                style={{ fontFamily: 'Heebo, sans-serif' }}
              >
                {getMessage()}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-row items-start gap-4 w-full h-[54px] mt-2">
              {/* Annuler Button */}
              <button
                onClick={onClose}
                className="flex-1 h-[54px] rounded-xl bg-[#FEF8EE] hover:bg-[#FFEFD9] active:translate-y-[2px] active:shadow-none transition-all border-2 border-[#0D0D0D] shadow-[3px_3px_0px_#000000] flex items-center justify-center px-[27px] py-2.5 gap-2.5 cursor-pointer"
              >
                <span className="text-base leading-[23px] font-bold text-[#0D0D0D] font-[Heebo]">
                  Annuler
                </span>
              </button>

              {/* Confirmer Button */}
              <button
                onClick={onConfirm}
                className="flex-1 h-[54px] rounded-xl bg-[#FF506F] hover:bg-[#FF6080] active:translate-y-[2px] active:shadow-none transition-all border-2 border-[#0D0D0D] shadow-[3px_3px_0px_#000000] flex items-center justify-center px-[27px] py-2.5 gap-2.5 cursor-pointer"
              >
                <span className="text-base leading-[23px] font-bold text-[#0D0D0D] font-[Heebo] text-center">
                  Confirmer
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
