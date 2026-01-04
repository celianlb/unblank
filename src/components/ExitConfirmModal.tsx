'use client';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
}

export default function ExitConfirmModal({ isOpen, onClose, onConfirm, title = "Êtes-vous sûr de vouloir quitter ce dossier/groupe partagé ?" }: ExitConfirmModalProps) {
  if (!isOpen) return null;

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
          className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] h-[220px] pointer-events-auto flex flex-col items-center p-8 gap-2.5 box-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Frame 61 */}
          <div className="flex flex-col items-center gap-8 w-full max-w-[415px] h-[156px]">
            {/* Frame 56 - Title container */}
            <div className="flex flex-col items-center gap-8 w-full">
              {/* Frame 54 */}
              <div className="flex flex-row justify-center items-center gap-2.5 w-full h-[70px]">
                {/* Title */}
                <h2
                  className="text-2xl leading-[110%] font-extrabold text-[#0D0D0D] text-center flex-1"
                  style={{ fontFamily: 'Area Inktrap, sans-serif' }}
                >
                  {title}
                </h2>
              </div>
            </div>

            {/* Frame 118 - Buttons */}
            <div className="flex flex-row items-start gap-4 w-full h-[54px]">
              {/* Annuler Button */}
              <button
                onClick={onClose}
                className="flex-1 h-[54px] rounded-xl bg-[#FEF8EE] hover:bg-[#FFEFD9] active:translate-y-[2px] active:shadow-none transition-all border-2 border-[#0D0D0D] shadow-[3px_3px_0px_#000000] flex items-center justify-center px-[27px] py-2.5 gap-2.5 cursor-pointer"
              >
                <span className="text-base leading-[23px] font-bold text-[#0D0D0D] font-[Heebo]">
                  Annuler
                </span>
              </button>

              {/* Quitter Button */}
              <button
                onClick={onConfirm}
                className="flex-1 h-[54px] rounded-xl bg-[#FF506F] hover:bg-[#FF6080] active:translate-y-[2px] active:shadow-none transition-all border-2 border-[#0D0D0D] shadow-[3px_3px_0px_#000000] flex items-center justify-center px-[27px] py-2.5 gap-2.5 cursor-pointer"
              >
                <span className="text-base leading-[23px] font-bold text-[#0D0D0D] font-[Heebo] text-center">
                  Quitter
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
