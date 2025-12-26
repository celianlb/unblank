'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCreateFolder } from '@/hooks/useFolders';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateFolderModal({ isOpen, onClose }: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const { session } = useAuthContext();

  // ✅ Mutation React Query
  const createFolder = useCreateFolder(session?.user?.id || '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id || !folderName.trim()) return;

    try {
      // ✅ Créer le dossier avec React Query (invalide automatiquement le cache)
      await createFolder.mutateAsync({
        name: folderName.trim(),
        isGroup: false, // Dossier simple, pas un groupe
        parentFolderId: null,
      });

      // Fermer le modal et réinitialiser
      onClose();
      setFolderName('');
      // Plus besoin de router.refresh() !
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Erreur lors de la création du dossier');
    }
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
          className="bg-white border-4 border-black rounded-[20px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} className="flex flex-col p-8 gap-6">
            {/* Header */}
            <div className="flex items-center justify-center w-full mb-2 relative">
              <h2 className="text-3xl font-bold text-black">Créer un dossier</h2>
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
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="w-full h-14 px-4 rounded-xl border-2 border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black text-base font-[Heebo] font-normal placeholder:font-[Heebo] placeholder:font-normal"
                required
                autoFocus
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={createFolder.isPending || !folderName.trim()}
              className="w-full h-14 rounded-xl bg-[#FF506F] hover:bg-[#FF6080] active:translate-y-[2px] active:shadow-none transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black font-bold text-base cursor-pointer font-[Heebo] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createFolder.isPending ? 'Création...' : 'Créer le dossier'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
