'use client';

import { X, Search, Copy } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

interface FolderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderName?: string;
  shareUrl?: string;
}

export default function FolderSettingsModal({
  isOpen,
  onClose,
  folderName = "Graphic tools",
  shareUrl = "https://www.googlefont.com/"
}: FolderSettingsModalProps) {
  const [selectedPermission, setSelectedPermission] = useState<'read' | 'edit'>('read');
  const [searchQuery, setSearchQuery] = useState('');
  const [invitedUsers] = useState([
    { name: 'Lise', avatar: '/avatars/lise.jpg' },
    { name: 'Théo', avatar: '/avatars/theo.jpg' }
  ]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  const handleRemoveAccess = (userName: string) => {
    // TODO: Logique pour retirer l'accès
    console.log(`Retirer l'accès pour ${userName}`);
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
          <div className="flex flex-col items-start gap-8 w-full">
            {/* Title */}
            <h2
              className="text-[32px] leading-[90%] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              Paramètre du dossier
            </h2>

            {/* Radio Buttons */}
            <div className="flex flex-col items-start gap-2 w-full">
              {/* Lecture seul */}
              <div className="flex flex-row items-center gap-2 w-full">
                <div
                  onClick={() => setSelectedPermission('read')}
                  className="flex items-center justify-center w-[31px] h-[31px] cursor-pointer"
                >
                  <div className="relative w-[25px] h-[25px] bg-[#FEF8EE] border-2 border-black rounded-full flex items-center justify-center">
                    {selectedPermission === 'read' && (
                      <div className="w-[17px] h-[17px] bg-[#0D0D0D] rounded-full" />
                    )}
                  </div>
                </div>
                <span className="text-[21px] leading-[31px] tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo]">
                  Lecture seul
                </span>
              </div>

              {/* Lecture et édition */}
              <div className="flex flex-row items-center gap-2 w-full">
                <div
                  onClick={() => setSelectedPermission('edit')}
                  className="flex items-center justify-center w-[31px] h-[31px] cursor-pointer"
                >
                  <div className="relative w-[25px] h-[25px] bg-[#FEF8EE] border-2 border-black rounded-full flex items-center justify-center">
                    {selectedPermission === 'edit' && (
                      <div className="w-[17px] h-[17px] bg-[#0D0D0D] rounded-full" />
                    )}
                  </div>
                </div>
                <span className="text-[21px] leading-[31px] tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo]">
                  Lecture et édition
                </span>
              </div>
            </div>

            {/* Share Link */}
            <div className="flex flex-row items-center justify-center px-2.5 gap-2.5 w-full h-[46px] bg-[#FEF8EE] border-2 border-black rounded-xl">
              <span className="flex-1 text-lg leading-[26px] tracking-[-0.03em] font-normal text-[#0D0D0D] font-[Heebo] truncate">
                {shareUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="flex-shrink-0 cursor-pointer hover:opacity-70 transition-opacity"
              >
                <Copy className="w-6 h-6 text-[#0D0D0D]" strokeWidth={2} />
              </button>
            </div>

            {/* Liste d'invité Title */}
            <h3 className="text-2xl leading-[90%] font-bold text-[#0D0D0D] font-[Heebo]">
              Liste d&apos;invité
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
            <div className="flex flex-col items-start gap-2 w-full">
              {invitedUsers.map((user, index) => (
                <div
                  key={index}
                  className="flex flex-row justify-between items-center w-full h-16"
                >
                  {/* User Info */}
                  <div className="flex flex-row items-center gap-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-[3px] border-black bg-gray-200 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-600">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <span className="text-[21px] leading-[31px] font-medium text-[#0D0D0D] font-[Heebo]">
                      {user.name}
                    </span>
                  </div>

                  {/* Remove Access Button */}
                  <button
                    onClick={() => handleRemoveAccess(user.name)}
                    className="flex flex-row items-center px-3 py-1.5 rounded-lg cursor-pointer hover:bg-red-50 transition-colors"
                  >
                    <span className="text-[21px] leading-[31px] font-medium text-[#FF2F2F] font-[Heebo]">
                      Désactiver l&apos;accès
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
