'use client';

import { X, FolderOpen, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFolders, useCreateFolder, useMoveFolderToGroup } from '@/hooks/useFolders';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const justClosedDropdownRef = useRef(false);
  const { session } = useAuthContext();

  // ✅ Utilisation de React Query pour charger les dossiers
  const { data: allFolders = [] } = useFolders(session?.user?.id);
  const availableFolders = allFolders.filter(folder => !folder.is_system);

  // ✅ Mutations React Query
  const createFolder = useCreateFolder(session?.user?.id || '');
  const moveFolderToGroup = useMoveFolderToGroup(session?.user?.id || '');

  // Réinitialiser les champs quand la modale se ferme
  useEffect(() => {
    if (!isOpen) {
      setGroupName('');
      setSelectedFolderIds([]);
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Vérifier si le clic est sur l'overlay
        const target = event.target as HTMLElement;
        const isOverlay = target.hasAttribute('data-overlay') || target.closest('[data-overlay="true"]');
        
        if (isOverlay) {
          // Si c'est l'overlay, on ferme juste le dropdown, pas la modale
          justClosedDropdownRef.current = true;
          setIsDropdownOpen(false);
          // Réinitialiser le flag après un court délai pour permettre un nouveau clic
          setTimeout(() => {
            justClosedDropdownRef.current = false;
          }, 200);
        } else {
          // Sinon, on ferme le dropdown normalement
          setIsDropdownOpen(false);
        }
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  if (!isOpen) return null;

  const toggleFolder = (folderId: string) => {
    setSelectedFolderIds(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id || !groupName.trim()) return;

    try {
      // ✅ 1. Créer le groupe avec React Query (invalide automatiquement le cache)
      const group = await createFolder.mutateAsync({
        name: groupName.trim(),
        isGroup: true,
        parentFolderId: null,
      });

      if (!group) {
        alert('Erreur lors de la création du groupe');
        return;
      }

      // ✅ 2. Déplacer les dossiers sélectionnés dans le groupe
      if (selectedFolderIds.length > 0) {
        await Promise.all(
          selectedFolderIds.map(folderId =>
            moveFolderToGroup.mutateAsync({ folderId, groupId: group.id })
          )
        );
      }

      // ✅ 3. Fermer le modal (le cache est déjà invalidé automatiquement !)
      onClose();
      setGroupName('');
      setSelectedFolderIds([]);
      // Plus besoin de router.refresh() !
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Erreur lors de la création du groupe');
    }
  };

  // Vérifier si des données ont été saisies
  const hasUnsavedData = groupName.trim() !== '' || selectedFolderIds.length > 0;

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Si le dropdown est ouvert, on ne ferme pas la modale
    // Le useEffect va fermer le dropdown, et il faudra cliquer à nouveau pour fermer la modale
    if (isDropdownOpen || justClosedDropdownRef.current) {
      return;
    }

    // Ne fermer que si aucune donnée n'a été saisie
    if (!hasUnsavedData) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/70"
        onClick={handleOverlayClick}
        data-overlay="true"
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
                autoFocus
              />
            </div>

            {/* Ajouter des dossiers existant */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-base font-medium text-black font-[Heebo]">Ajouter des dossiers existant</label>
              <div className="relative w-full" ref={dropdownRef}>
                {/* Bouton dropdown fermé avec hover rose */}
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full h-14 flex items-center justify-between px-4 bg-white border-2 border-black rounded-xl cursor-pointer hover:bg-[#FFE3E8] transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <FolderOpen className="w-6 h-6 text-[#636363] shrink-0" strokeWidth={2} />
                    <span className="text-base text-[#636363] font-[Heebo] font-medium truncate">
                      {selectedFolderIds.length > 0
                        ? availableFolders
                            .filter(f => selectedFolderIds.includes(f.id))
                            .map(f => f.name)
                            .join(', ')
                        : 'Dossiers existants'}
                    </span>
                  </div>
                  {isDropdownOpen ? (
                    <ChevronUp className="w-6 h-6 text-black shrink-0" strokeWidth={2} />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-black shrink-0" strokeWidth={2} />
                  )}
                </div>

                {/* Dropdown ouvert avec boutons Ajouter */}
                {isDropdownOpen && (
                  <div
                    className="absolute top-full left-0 right-0 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_#000000] z-50 p-4 max-h-[220px] overflow-y-auto"
                    style={{ marginTop: '6px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Liste des dossiers */}
                    <div className="flex flex-col gap-3">
                      {availableFolders.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-2">Aucun dossier disponible</p>
                      ) : (
                        availableFolders.map((folder) => (
                          <div
                            key={folder.id}
                            className={`flex items-center justify-between cursor-pointer transition-colors rounded-lg p-2 -mx-2 select-none ${
                              selectedFolderIds.includes(folder.id)
                                ? 'hover:bg-[#FF6080]/10'
                                : 'hover:bg-[#FFE3E8]'
                            }`}
                            onClick={() => toggleFolder(folder.id)}
                          >
                            <span className="text-base text-[#0D0D0D] font-[Heebo] font-medium">{folder.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFolder(folder.id);
                              }}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors w-[107px] cursor-pointer ${
                                selectedFolderIds.includes(folder.id)
                                  ? 'bg-[#FF506F]'
                                  : 'bg-transparent'
                              }`}
                            >
                              {selectedFolderIds.includes(folder.id) ? (
                                <X className="w-6 h-6 text-[#0D0D0D]" strokeWidth={2} />
                              ) : (
                                <Plus className="w-6 h-6 text-[#0D0D0D]" strokeWidth={2} />
                              )}
                              <span className="text-base text-[#0D0D0D] font-[Heebo] font-medium">
                                {selectedFolderIds.includes(folder.id) ? 'Ajouté' : 'Ajouter'}
                              </span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={createFolder.isPending || !groupName.trim()}
              className="w-full h-14 rounded-xl bg-[#FF506F] hover:bg-[#FF6080] active:translate-y-[2px] active:shadow-none transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black font-bold text-base cursor-pointer font-[Heebo] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createFolder.isPending ? 'Création...' : 'Créer le groupe'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
