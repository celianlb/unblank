"use client";

import { X, Folder, Link } from "lucide-react";

interface CreateNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: () => void;
  onAddLink: () => void;
  canCreateFolder?: boolean;
  canAddLink?: boolean;
}

export default function CreateNewModal({
  isOpen,
  onClose,
  onCreateFolder,
  onAddLink,
  canCreateFolder = true,
  canAddLink = true,
}: CreateNewModalProps) {
  if (!isOpen) return null;

  const handleCreateFolder = () => {
    if (canCreateFolder) {
      onClose();
      onCreateFolder();
    }
  };

  const handleAddLink = () => {
    if (canAddLink) {
      onClose();
      onAddLink();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[400px] pointer-events-auto flex flex-col p-8 gap-8 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title with Close Button */}
          <div className="flex items-start justify-between">
            <h2
              className="text-[32px] leading-[90%] font-extrabold text-[#0D0D0D] flex-1"
              style={{ fontFamily: "Area Inktrap, sans-serif" }}
            >
              Créer un nouveau :
            </h2>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center cursor-pointer shrink-0 -mt-1 -mr-1"
            >
              <X
                className="w-6 h-6 hover:text-[#FF5070] transition-colors"
                strokeWidth={2.5}
              />
            </button>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Dossier */}
            <button
              onClick={handleCreateFolder}
              disabled={!canCreateFolder}
              className={`flex flex-col items-center justify-center gap-4 p-6 rounded-xl border-3 border-black bg-[#FEF8EE] transition-all ${
                canCreateFolder
                  ? "hover:bg-[#FFE3E8] active:translate-y-[1px] cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <Folder className="w-16 h-16 text-[#0D0D0D]" strokeWidth={1.5} />
              <span
                className="text-[18px] font-bold text-[#0D0D0D] text-center"
                style={{ fontFamily: "Area Inktrap, sans-serif" }}
              >
                Dossier
              </span>
            </button>

            {/* Lien */}
            <button
              onClick={handleAddLink}
              disabled={!canAddLink}
              className={`flex flex-col items-center justify-center gap-4 p-6 rounded-xl border-3 border-black bg-[#FEF8EE] transition-all ${
                canAddLink
                  ? "hover:bg-[#FFE3E8] active:translate-y-[1px] cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <Link className="w-16 h-16 text-[#0D0D0D]" strokeWidth={1.5} />
              <span
                className="text-[18px] font-bold text-[#0D0D0D] text-center"
                style={{ fontFamily: "Area Inktrap, sans-serif" }}
              >
                Lien
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
