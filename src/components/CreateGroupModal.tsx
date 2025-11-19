'use client';

import { X, FolderOpen, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('Dossiers existants');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Logique de création du groupe
    console.log({ groupName, selectedFolder });
    onClose();
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
          className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} className="flex flex-col p-8 gap-2">
            {/* Header */}
            <div className="flex items-center justify-center w-full mb-4 relative">
              <h2 className="text-3xl font-bold text-black">Créer un groupe</h2>
              <button
                type="button"
                onClick={onClose}
                className="hover:text-[#FF506F] transition-colors cursor-pointer absolute right-0"
              >
                <X className="w-8 h-8" strokeWidth={2} />
              </button>
            </div>

            {/* Nom du dossier */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-base font-medium text-black font-[Heebo]">Nom du dossier</label>
              <input
                type="text"
                placeholder="Nom"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full h-14 px-4 rounded-xl border-2 border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black text-base font-[Heebo] font-normal placeholder:font-[Heebo] placeholder:font-normal"
                required
              />
            </div>

            {/* Ajouter des dossiers existant */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-base font-medium text-black font-[Heebo]">Ajouter des dossiers existant</label>
              <div className="relative w-full">
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full h-14 flex items-center justify-between px-4 bg-white border-2 border-black rounded-xl cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-black" strokeWidth={2} />
                    <span className="text-base text-black font-[Heebo] font-semibold">{selectedFolder}</span>
                  </div>
                  <ChevronDown className="w-5 h-5 text-black" strokeWidth={2} />
                </div>
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 max-h-[calc(3*43px)] overflow-y-auto">
                    <div
                      onClick={() => {
                        setSelectedFolder('Logos');
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 p-2.5 cursor-pointer transition-colors hover:bg-[#FFE3E8]"
                    >
                      <FolderOpen className="w-6 h-6 text-black" strokeWidth={2} />
                      <span className="text-base text-black font-[Heebo] font-semibold">Logos</span>
                    </div>
                    <div
                      onClick={() => {
                        setSelectedFolder('Affiches');
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 p-2.5 cursor-pointer transition-colors hover:bg-[#FFE3E8]"
                    >
                      <FolderOpen className="w-6 h-6 text-black" strokeWidth={2} />
                      <span className="text-base text-black font-[Heebo] font-semibold">Affiches</span>
                    </div>
                    <div
                      onClick={() => {
                        setSelectedFolder('Maquettes');
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 p-2.5 cursor-pointer transition-colors hover:bg-[#FFE3E8]"
                    >
                      <FolderOpen className="w-6 h-6 text-black" strokeWidth={2} />
                      <span className="text-base text-black font-[Heebo] font-semibold">Maquettes</span>
                    </div>
                    <div
                      onClick={() => {
                        setSelectedFolder('A ranger');
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 p-2.5 cursor-pointer transition-colors hover:bg-[#FFE3E8]"
                    >
                      <FolderOpen className="w-6 h-6 text-black" strokeWidth={2} />
                      <span className="text-base text-black font-[Heebo] font-semibold">A ranger</span>
                    </div>
                    <div
                      onClick={() => {
                        setSelectedFolder('Architecture');
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 p-2.5 cursor-pointer transition-colors hover:bg-[#FFE3E8]"
                    >
                      <FolderOpen className="w-6 h-6 text-black" strokeWidth={2} />
                      <span className="text-base text-black font-[Heebo] font-semibold">Architecture</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-14 rounded-xl bg-[#FF506F] hover:bg-[#FF6080] active:translate-y-[2px] active:shadow-none transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black font-bold text-base mt-4 cursor-pointer font-[Heebo]"
            >
              Créer le groupe
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
