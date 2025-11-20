'use client';

import { X, Copy } from 'lucide-react';
import { useState } from 'react';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl?: string;
}

export default function ShareLinkModal({
  isOpen,
  onClose,
  shareUrl = "https://www.googlefont.com/"
}: ShareLinkModalProps) {
  const [selectedPermission, setSelectedPermission] = useState<'read' | 'edit'>('read');

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
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
          className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] h-[273px] pointer-events-auto flex flex-col p-8 gap-6 relative"
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
          <div className="flex flex-col items-center gap-8 w-full">
            {/* Title */}
            <h2
              className="text-[32px] leading-[90%] font-extrabold text-[#0D0D0D] text-center w-full"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              Lien de partage
            </h2>

            {/* Radio Buttons */}
            <div className="flex flex-col items-start gap-2 w-full">
              {/* Lecture seul */}
              <div className="flex flex-row items-center gap-2 w-full">
                <div
                  onClick={() => setSelectedPermission('read')}
                  className="flex items-center justify-center w-[31px] h-[31px] cursor-pointer"
                >
                  <div className="relative w-[24px] h-[24px] bg-[#FEF8EE] border-2 border-black rounded-full flex items-center justify-center">
                    {selectedPermission === 'read' && (
                      <div className="w-[16px] h-[16px] bg-[#0D0D0D] rounded-full" />
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
                  <div className="relative w-[24px] h-[24px] bg-[#FEF8EE] border-2 border-black rounded-full flex items-center justify-center">
                    {selectedPermission === 'edit' && (
                      <div className="w-[16px] h-[16px] bg-[#0D0D0D] rounded-full" />
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
              <span className="flex-1 text-lg leading-[26px] tracking-[-0.03em] font-normal text-[#A8A8A8] font-[Heebo] truncate">
                {shareUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="flex-shrink-0 cursor-pointer hover:opacity-70 transition-opacity"
              >
                <Copy className="w-6 h-6 text-[#A8A8A8]" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
