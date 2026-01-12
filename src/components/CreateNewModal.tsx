"use client";

import { X, Folder, Link } from "lucide-react";

interface CreateNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: () => void;
  onCreateGroup: () => void;
  onAddLink: () => void;
  canCreateFolder?: boolean;
  canCreateGroup?: boolean;
  canAddLink?: boolean;
}

// Icône de groupe personnalisée
const GroupIcon = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 3h6v6H3z" />
    <path d="M14 4h6" />
    <path d="M14 9h6" />
    <path d="M3 14h6v6H3z" />
    <path d="M14 15h6" />
    <path d="M14 20h6" />
  </svg>
);

export default function CreateNewModal({
  isOpen,
  onClose,
  onCreateFolder,
  onCreateGroup,
  onAddLink,
  canCreateFolder = true,
  canCreateGroup = true,
  canAddLink = true,
}: CreateNewModalProps) {
  if (!isOpen) return null;

  const handleCreateFolder = () => {
    if (canCreateFolder) {
      onClose();
      onCreateFolder();
    }
  };

  const handleCreateGroup = () => {
    if (canCreateGroup) {
      onClose();
      onCreateGroup();
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
          className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[520px] pointer-events-auto flex flex-col p-8 gap-8 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X
              className="w-8 h-8 hover:text-[#FF5070] transition-colors"
              strokeWidth={2}
            />
          </button>

          {/* Title */}
          <h2
            className="text-[32px] leading-[90%] font-extrabold text-[#0D0D0D] text-center"
            style={{ fontFamily: "Area Inktrap, sans-serif" }}
          >
            Créer un nouveau :
          </h2>

          {/* Options Grid */}
          <div className="grid grid-cols-3 gap-4">
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

            {/* Groupe de dossier */}
            <button
              onClick={handleCreateGroup}
              disabled={!canCreateGroup}
              className={`flex flex-col items-center justify-center gap-4 p-6 rounded-xl border-3 border-black bg-[#FEF8EE] transition-all ${
                canCreateGroup
                  ? "hover:bg-[#FFE3E8] active:translate-y-[1px] cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="w-16 h-16 text-[#0D0D0D]">
                <GroupIcon />
              </div>
              <span
                className="text-[18px] font-bold text-[#0D0D0D] text-center leading-tight"
                style={{ fontFamily: "Area Inktrap, sans-serif" }}
              >
                Groupe de dossier
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
