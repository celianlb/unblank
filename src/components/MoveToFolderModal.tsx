'use client';

import { X, Folder, ChevronRight, Home } from 'lucide-react';
import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFolders } from '@/hooks/useFolders';
import { useMoveLinkToFolder } from '@/hooks/useLinks';
import { useMoveFolderToParent } from '@/hooks/useFolders';

interface MoveToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemType: 'link' | 'folder';
  itemName: string;
  currentFolderId?: string | null;
}

export default function MoveToFolderModal({
  isOpen,
  onClose,
  itemId,
  itemType,
  itemName,
  currentFolderId,
}: MoveToFolderModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const { session } = useAuthContext();

  const { data: folders = [], isLoading } = useFolders(session?.user?.id);
  const moveLinkToFolder = useMoveLinkToFolder();
  const moveFolderToParent = useMoveFolderToParent(session?.user?.id || '');

  if (!isOpen) return null;

  // Filtrer les dossiers disponibles :
  // - Exclure le dossier actuel (on ne peut pas déplacer vers le même endroit)
  // - Exclure les groupes (is_group = true) car on ne peut pas mettre des liens/dossiers directement dans un groupe
  // - Si c'est un dossier qu'on déplace, exclure ce dossier lui-même et ses enfants
  const availableFolders = folders.filter((folder) => {
    // Exclure les groupes
    if (folder.is_group) return false;
    // Exclure le dossier actuel
    if (folder.id === currentFolderId) return false;
    // Si on déplace un dossier, exclure le dossier lui-même
    if (itemType === 'folder' && folder.id === itemId) return false;
    // Exclure les sous-dossiers du dossier qu'on déplace (pour éviter les cycles)
    if (itemType === 'folder' && folder.parent_folder_id === itemId) return false;
    return true;
  });

  const handleMove = async () => {
    if (isMoving) return;

    setIsMoving(true);
    try {
      if (itemType === 'link') {
        await moveLinkToFolder.mutateAsync({
          linkId: itemId,
          targetFolderId: selectedFolderId,
        });
      } else {
        await moveFolderToParent.mutateAsync({
          folderId: itemId,
          parentFolderId: selectedFolderId,
        });
      }
      onClose();
    } catch (error) {
      console.error('Error moving item:', error);
      alert(`Erreur lors du déplacement`);
    } finally {
      setIsMoving(false);
    }
  };

  const isCurrentlyAtRoot = !currentFolderId;
  const isSelectedRoot = selectedFolderId === null;

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
          className="bg-white border-4 border-black rounded-[20px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] max-h-[80vh] pointer-events-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-center w-full p-6 pb-4 relative border-b-2 border-black">
            <h2 className="text-2xl font-bold text-black">Déplacer vers...</h2>
            <button
              type="button"
              onClick={onClose}
              className="hover:text-[#FF506F] transition-colors cursor-pointer absolute right-6"
            >
              <X className="w-7 h-7" strokeWidth={2} />
            </button>
          </div>

          {/* Item being moved */}
          <div className="px-6 py-3 bg-[#FEF8EE] border-b-2 border-black">
            <p className="text-sm text-gray-600">
              {itemType === 'link' ? 'Lien' : 'Dossier'} : <span className="font-medium text-black">{itemName}</span>
            </p>
          </div>

          {/* Folder list */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Option: Accueil (racine) */}
                <button
                  onClick={() => setSelectedFolderId(null)}
                  disabled={isCurrentlyAtRoot}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    isSelectedRoot
                      ? 'border-black bg-[#FFE3E8]'
                      : isCurrentlyAtRoot
                      ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-black hover:bg-[#FEF8EE] cursor-pointer'
                  }`}
                >
                  <Home className="w-5 h-5 text-black" />
                  <span className="font-medium text-black">Accueil</span>
                  {isCurrentlyAtRoot && (
                    <span className="ml-auto text-xs text-gray-500">(actuel)</span>
                  )}
                </button>

                {/* Liste des dossiers */}
                {availableFolders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      selectedFolderId === folder.id
                        ? 'border-black bg-[#FFE3E8]'
                        : 'border-gray-200 hover:border-black hover:bg-[#FEF8EE] cursor-pointer'
                    }`}
                  >
                    <Folder className="w-5 h-5 text-black" />
                    <span className="font-medium text-black truncate">{folder.name}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                  </button>
                ))}

                {availableFolders.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Aucun dossier disponible
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 pt-4 border-t-2 border-black flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 px-6 rounded-xl border-2 border-black bg-white hover:bg-gray-100 transition-all font-bold text-black cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleMove}
              disabled={isMoving || (isSelectedRoot && isCurrentlyAtRoot)}
              className={`flex-1 h-12 px-6 rounded-xl border-2 border-black transition-all font-bold ${
                isMoving || (isSelectedRoot && isCurrentlyAtRoot)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#FF506F] hover:bg-[#FF6080] text-black cursor-pointer shadow-[3px_3px_0px_#000000] active:translate-y-0.5 active:shadow-none'
              }`}
            >
              {isMoving ? 'Déplacement...' : 'Déplacer'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
