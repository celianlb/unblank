'use client';

import { X, FolderOpen, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');

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
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} className="flex flex-col items-center p-8 gap-2">
            {/* Header */}
            <div className="flex items-center justify-between w-full mb-4">
              <h2 className="text-3xl font-bold text-black">Créer un groupe</h2>
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
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full h-14 px-4 rounded-xl border-2 border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black text-base"
                required
              />
            </div>

            {/* Ajouter des dossiers existant */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-base font-semibold text-black">Ajouter des dossiers existant</label>
              <div className="relative w-full">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                  <FolderOpen className="w-5 h-5 text-black" strokeWidth={2} />
                  <span className="text-base text-black">Dossiers existants</span>
                </div>
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="w-full h-14 pl-4 pr-12 rounded-xl border-2 border-black bg-white text-black focus:outline-none focus:border-black text-base appearance-none cursor-pointer"
                  style={{ paddingLeft: '160px' }}
                >
                  <option value=""></option>
                  {/* TODO: Ajouter les options de dossiers */}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black pointer-events-none" strokeWidth={2} />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-14 rounded-xl bg-[#FF5070] hover:bg-[#FF3D5F] active:translate-y-[2px] active:shadow-none transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black font-bold text-base mt-4"
            >
              Créer le groupe
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
