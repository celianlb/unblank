'use client';

import { X, Search, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useFolderShares, useUpdateSharePermission, useRevokeShare } from '@/hooks/useShares';
import { useAuthContext } from '@/contexts/AuthContext';

interface FolderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderName?: string;
  folderId: string;
}

export default function FolderSettingsModal({
  isOpen,
  onClose,
  folderName = "Graphic tools",
  folderId
}: FolderSettingsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const { session } = useAuthContext();
  const { data: shares = [], isLoading } = useFolderShares(isOpen ? folderId : null);
  const updatePermission = useUpdateSharePermission();
  const revokeShare = useRevokeShare();

  // Vérifier si l'utilisateur courant est le propriétaire
  const isOwner = shares.find((share: any) => share.permission === 'owner')?.user?.email === session?.user?.email;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };

    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdownId]);

  if (!isOpen) return null;

  const handleChangePermission = async (shareId: string, newPermission: 'view' | 'edit') => {
    try {
      await updatePermission.mutateAsync({
        shareId,
        permission: newPermission,
      });
      setOpenDropdownId(null);
    } catch (error) {
      console.error('Error updating permission:', error);
      alert('Erreur lors de la modification de la permission');
    }
  };

  const handleRemoveAccess = async (shareId: string) => {
    try {
      await revokeShare.mutateAsync(shareId);
      setOpenDropdownId(null);
    } catch (error) {
      console.error('Error revoking access:', error);
      alert('Erreur lors de la révocation de l\'accès');
    }
  };

  const toggleDropdown = (userId: string) => {
    setOpenDropdownId(openDropdownId === userId ? null : userId);
  };

  const getPermissionLabel = (permission: 'view' | 'edit' | 'owner') => {
    if (permission === 'owner') return 'Propriétaire';
    return permission === 'view' ? 'Lecteur' : 'Éditeur';
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
          className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] pointer-events-auto flex flex-col p-8 gap-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-8 top-8 w-9 h-9 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-9 h-9 hover:text-[#FF5070] transition-colors" strokeWidth={2} />
          </button>

          {/* Frame 61 */}
          <div className="flex flex-col items-start gap-6 w-full">
            {/* Title */}
            <h2
              className="text-[32px] leading-[90%] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              Paramètre du dossier
            </h2>

            {/* Liste d'invité Title */}
            <h3 className="text-lg leading-[90%] font-bold text-[#0D0D0D] font-[Heebo]">
              Personnes ayant accès ({shares.length})
            </h3>

            {/* Search Input */}
            <div className="flex flex-row items-center justify-center px-2.5 gap-2.5 w-full h-[44px] bg-white border-2 border-black rounded-xl">
              <Search className="w-6 h-6 text-[#A8A8A8]" strokeWidth={2} />
              <input
                type="text"
                placeholder="Rechercher un invité"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-full bg-transparent border-none text-base leading-[23px] tracking-[-0.03em] font-normal text-[#0D0D0D] placeholder-[#A8A8A8] focus:outline-none font-[Heebo]"
              />
            </div>

            {/* Invited Users List */}
            <div className="flex flex-col items-start gap-3 w-full min-h-[320px] max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="w-full py-8 text-center">
                  <p className="text-[16px] text-[#A8A8A8] font-[Heebo]">
                    Chargement...
                  </p>
                </div>
              ) : (
                shares
                  .filter((share: any) =>
                    (share.user?.name || share.shared_with_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (share.shared_with_email || '').toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((share: any) => {
                    const displayName = share.user?.name || share.shared_with_email?.split('@')[0] || 'Utilisateur';
                    const displayEmail = share.shared_with_email || share.user?.email || '';
                    const isCurrentUser = displayEmail === session?.user?.email;

                    return (
                      <div
                        key={share.id}
                        className="flex flex-row justify-between items-center w-full min-h-[64px] p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {/* User Info */}
                        <div className="flex flex-col gap-1 flex-1">
                          <div className="flex flex-row items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-[3px] border-black bg-gray-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-xl font-bold text-gray-600">
                                {displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[18px] leading-[24px] font-medium text-[#0D0D0D] font-[Heebo]">
                                {displayName}{isCurrentUser && ' (moi)'}
                              </span>
                              <span className="text-[14px] leading-[20px] font-normal text-[#A8A8A8] font-[Heebo]">
                                {displayEmail}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Permission Dropdown */}
                        <div className="relative">
                          {share.permission === 'owner' ? (
                            // Pour le propriétaire, afficher seulement le label sans dropdown
                            <div className="px-3 py-2 border-2 border-black rounded-lg bg-gray-50">
                              <span className="text-[16px] leading-[24px] font-medium text-[#0D0D0D] font-[Heebo]">
                                Propriétaire
                              </span>
                            </div>
                          ) : isOwner ? (
                            // Si l'utilisateur courant est le propriétaire, afficher le dropdown
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDropdown(share.id);
                                }}
                                className="flex flex-row items-center gap-2 px-3 py-2 border-2 border-black rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                              >
                                <span className="text-[16px] leading-[24px] font-medium text-[#0D0D0D] font-[Heebo]">
                                  {getPermissionLabel(share.permission)}
                                </span>
                                <ChevronDown className="w-4 h-4 text-[#0D0D0D]" strokeWidth={2} />
                              </button>

                              {/* Dropdown Menu */}
                              {openDropdownId === share.id && (
                                <div className="absolute right-0 top-full mt-1 w-[200px] bg-white border-2 border-black rounded-lg shadow-lg z-10 overflow-hidden">
                                  <button
                                    onClick={() => handleChangePermission(share.id, 'view')}
                                    className={`w-full px-4 py-2.5 text-left text-[16px] font-medium font-[Heebo] hover:bg-gray-100 transition-colors cursor-pointer ${
                                      share.permission === 'view' ? 'bg-gray-50 text-[#0D0D0D]' : 'text-[#0D0D0D]'
                                    }`}
                                  >
                                    Lecteur
                                  </button>
                                  <button
                                    onClick={() => handleChangePermission(share.id, 'edit')}
                                    className={`w-full px-4 py-2.5 text-left text-[16px] font-medium font-[Heebo] hover:bg-gray-100 transition-colors cursor-pointer ${
                                      share.permission === 'edit' ? 'bg-gray-50 text-[#0D0D0D]' : 'text-[#0D0D0D]'
                                    }`}
                                  >
                                    Éditeur
                                  </button>
                                  <div className="border-t-2 border-black" />
                                  <button
                                    onClick={() => handleRemoveAccess(share.id)}
                                    className="w-full px-4 py-2.5 text-left text-[16px] font-medium text-[#FF2F2F] font-[Heebo] hover:bg-red-50 transition-colors cursor-pointer"
                                  >
                                    Retirer l&apos;accès
                                  </button>
                                </div>
                              )}
                            </>
                          ) : (
                            // Si l'utilisateur courant n'est pas le propriétaire, afficher seulement le label en lecture seule
                            <div className="px-3 py-2 border-2 border-black rounded-lg bg-gray-50">
                              <span className="text-[16px] leading-[24px] font-medium text-[#0D0D0D] font-[Heebo]">
                                {getPermissionLabel(share.permission)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}

              {!isLoading && shares.length === 0 && (
                <div className="w-full py-8 text-center">
                  <p className="text-[16px] text-[#A8A8A8] font-[Heebo]">
                    Aucune personne n&apos;a accès à ce dossier
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
