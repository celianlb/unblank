'use client';

import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  isDeleting: boolean;
}

export default function DeleteAccountModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  isDeleting 
}: DeleteAccountModalProps) {
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (deleteConfirmText !== 'SUPPRIMER') {
      setError('Veuillez taper "SUPPRIMER" pour confirmer');
      return;
    }

    const success = await onConfirm();
    if (!success) {
      setError('Une erreur est survenue lors de la suppression du compte');
    }
    // Si succès, la redirection sera gérée par le parent
  };

  const handleClose = () => {
    if (!isDeleting) {
      setDeleteConfirmText('');
      setError('');
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/70"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} className="flex flex-col p-8 gap-6">
            {/* Header */}
            <div className="flex items-center justify-center w-full mb-2 relative">
              <h2 className="text-3xl font-bold text-black">Supprimer le compte</h2>
              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting}
                className="hover:text-[#FF506F] transition-colors cursor-pointer absolute right-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-8 h-8" strokeWidth={2} />
              </button>
            </div>

            {/* Warning Message */}
            <div className="bg-red-50 border-2 border-red-600 rounded-xl p-4">
              <p className="text-base text-red-700 font-medium font-[Heebo]">
                Cette action est irréversible. Toutes vos données seront définitivement effacées.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border-2 border-red-500 rounded-xl p-4">
                <p className="text-red-700 font-medium text-base font-[Heebo]">{error}</p>
              </div>
            )}

            {/* Confirmation Input */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-base font-medium text-black font-[Heebo]">
                Pour confirmer, tapez <span className="text-red-600 font-bold">SUPPRIMER</span>
              </label>
              <input
                type="text"
                placeholder="SUPPRIMER"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full h-14 px-4 rounded-xl border-2 border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 text-base font-[Heebo] font-normal placeholder:font-[Heebo] placeholder:font-normal"
                disabled={isDeleting}
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {/* Cancel Button */}
              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting}
                className="flex-1 h-14 rounded-xl bg-[#FEF8EE] hover:bg-[#FFE3E8] active:translate-y-[2px] active:shadow-none transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black font-bold text-base cursor-pointer font-[Heebo] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>

              {/* Confirm Button */}
              <button
                type="submit"
                disabled={isDeleting || deleteConfirmText !== 'SUPPRIMER'}
                className="flex-1 h-14 rounded-xl bg-red-600 hover:bg-red-700 active:translate-y-[2px] active:shadow-none transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black font-bold text-base cursor-pointer font-[Heebo] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Suppression...</span>
                  </>
                ) : (
                  'Confirmer'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

