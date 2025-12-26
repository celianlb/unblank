'use client';

import { X, Search, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

interface InvitedUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  permission: 'view' | 'edit';
}

interface FolderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderName?: string;
}

export default function FolderSettingsModal({
  isOpen,
  onClose,
  folderName = "Graphic tools"
}: FolderSettingsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([
    { id: '1', name: 'Lise', email: 'lise@example.com', avatar: '/avatars/lise.jpg', permission: 'view' },
    { id: '2', name: 'Théo', email: 'theo@example.com', avatar: '/avatars/theo.jpg', permission: 'edit' }
  ]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

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

  const handleChangePermission = (userId: string, newPermission: 'view' | 'edit') => {
    // TODO: API call to update permission
    setInvitedUsers(invitedUsers.map(user =>
      user.id === userId ? { ...user, permission: newPermission } : user
    ));
    setOpenDropdownId(null);
  };

  const handleRemoveAccess = (userId: string) => {
    // TODO: API call to revoke access
    setInvitedUsers(invitedUsers.filter(user => user.id !== userId));
    setOpenDropdownId(null);
  };

  const toggleDropdown = (userId: string) => {
    setOpenDropdownId(openDropdownId === userId ? null : userId);
  };

  const getPermissionLabel = (permission: 'view' | 'edit') => {
    return permission === 'view' ? 'Lecture seule' : 'Lecture et édition';
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
              Personnes ayant accès ({invitedUsers.length})
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
              {invitedUsers
                .filter(user =>
                  user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-row justify-between items-center w-full min-h-[64px] p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* User Info */}
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex flex-row items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-[3px] border-black bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl font-bold text-gray-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[18px] leading-[24px] font-medium text-[#0D0D0D] font-[Heebo]">
                            {user.name}
                          </span>
                          <span className="text-[14px] leading-[20px] font-normal text-[#A8A8A8] font-[Heebo]">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Permission Dropdown */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown(user.id);
                        }}
                        className="flex flex-row items-center gap-2 px-3 py-2 border-2 border-black rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-[16px] leading-[24px] font-medium text-[#0D0D0D] font-[Heebo]">
                          {getPermissionLabel(user.permission)}
                        </span>
                        <ChevronDown className="w-4 h-4 text-[#0D0D0D]" strokeWidth={2} />
                      </button>

                      {/* Dropdown Menu */}
                      {openDropdownId === user.id && (
                        <div className="absolute right-0 top-full mt-1 w-[200px] bg-white border-2 border-black rounded-lg shadow-lg z-10 overflow-hidden">
                          <button
                            onClick={() => handleChangePermission(user.id, 'view')}
                            className={`w-full px-4 py-2.5 text-left text-[16px] font-medium font-[Heebo] hover:bg-gray-100 transition-colors ${
                              user.permission === 'view' ? 'bg-gray-50 text-[#0D0D0D]' : 'text-[#0D0D0D]'
                            }`}
                          >
                            Lecture seule
                          </button>
                          <button
                            onClick={() => handleChangePermission(user.id, 'edit')}
                            className={`w-full px-4 py-2.5 text-left text-[16px] font-medium font-[Heebo] hover:bg-gray-100 transition-colors ${
                              user.permission === 'edit' ? 'bg-gray-50 text-[#0D0D0D]' : 'text-[#0D0D0D]'
                            }`}
                          >
                            Lecture et édition
                          </button>
                          <div className="border-t-2 border-black" />
                          <button
                            onClick={() => handleRemoveAccess(user.id)}
                            className="w-full px-4 py-2.5 text-left text-[16px] font-medium text-[#FF2F2F] font-[Heebo] hover:bg-red-50 transition-colors"
                          >
                            Retirer l&apos;accès
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

              {invitedUsers.length === 0 && (
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
