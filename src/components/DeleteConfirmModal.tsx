'use client';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
}

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title = "Êtes vous sur de vouloir supprimer cet élément ?" }: DeleteConfirmModalProps) {
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
          className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] h-[220px] pointer-events-auto flex flex-col items-center justify-center p-8 gap-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Frame 61 */}
          <div className="flex flex-col items-center p-0 gap-8 w-full max-w-[415px]">
            {/* Title */}
            <h2
              className="text-2xl font-bold text-black text-center"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              {title}
            </h2>

            {/* Buttons */}
            <div className="flex flex-row items-center gap-4 w-full">
              {/* Annuler Button */}
              <button
                onClick={onClose}
                className="flex-1 h-14 rounded-xl bg-white hover:bg-gray-50 transition-colors border-2 border-black text-black font-bold text-base cursor-pointer font-[Heebo]"
              >
                Annuler
              </button>

              {/* Supprimer Button */}
              <button
                onClick={onConfirm}
                className="flex-1 h-14 rounded-xl bg-[#FF506F] hover:bg-[#FF6080] transition-colors border-2 border-black text-black font-bold text-base cursor-pointer font-[Heebo]"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
