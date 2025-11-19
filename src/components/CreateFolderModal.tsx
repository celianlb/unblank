'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateFolderModal({ isOpen, onClose }: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Logique de création du dossier
    console.log({ folderName });
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white border-4 border-black rounded-[20px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} className="flex flex-col items-center p-8 gap-6">
            {/* Header */}
            <div className="flex items-center justify-between w-full mb-2">
              <h2 className="text-3xl font-bold text-black">Créer un dossier</h2>
              <button
                type="button"
                onClick={onClose}
                className="hover:opacity-70 transition-opacity"
              >
                <X className="w-8 h-8 text-black" strokeWidth={2} />
              </button>
            </div>

            {/* Nom du dossier */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-base font-semibold text-black">Nom du dossier</label>
              <input
                type="text"
                placeholder="Nom"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="w-full h-14 px-4 rounded-xl border-2 border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black text-base"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-14 rounded-xl bg-[#FF5070] hover:bg-[#FF3D5F] active:translate-y-[2px] active:shadow-none transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black font-bold text-base"
            >
              Créer le dossier
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
