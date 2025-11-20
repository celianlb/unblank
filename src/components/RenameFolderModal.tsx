'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

interface RenameFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName?: string;
  onRename?: (newName: string) => void;
}

export default function RenameFolderModal({
  isOpen,
  onClose,
  currentName = "Graphic tools",
  onRename
}: RenameFolderModalProps) {
  const [newName, setNewName] = useState(currentName);

  if (!isOpen) return null;

  const handleRename = () => {
    if (onRename && newName.trim()) {
      onRename(newName.trim());
    }
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
          className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] h-[272px] pointer-events-auto flex flex-col items-center p-8 gap-2.5 relative"
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
          <div className="flex flex-col items-start gap-4 w-full max-w-[415px]">
            {/* Frame 56 */}
            <div className="flex flex-col items-center gap-8 w-full">
              {/* Title */}
              <div className="flex flex-row justify-center items-center w-auto">
                <h2
                  className="text-[32px] leading-[90%] font-extrabold text-[#0D0D0D]"
                  style={{ fontFamily: 'Area Inktrap, sans-serif' }}
                >
                  Renomer
                </h2>
              </div>

              {/* Frame 57 */}
              <div className="flex flex-col justify-end items-start gap-1.5 w-full">
                {/* Label */}
                <label className="text-base leading-[23px] font-medium text-[#0D0D0D] font-[Heebo]">
                  Renomer le dossier
                </label>

                {/* Input */}
                <div className="w-full h-[54px] bg-white border-2 border-black shadow-[2px_2px_0px_#000000] rounded-xl flex items-center px-4">
                  <input
                    type="text"
                    placeholder="Nouveau nom"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full h-full bg-transparent border-none text-base leading-[23px] font-normal text-[#0D0D0D] placeholder-[#636363] focus:outline-none font-[Heebo]"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            {/* Rename Button */}
            <button
              onClick={handleRename}
              className="w-full h-[54px] bg-[#FF506F] hover:bg-[#FF6080] transition-colors border-2 border-[#0D0D0D] shadow-[3px_3px_0px_#000000] rounded-xl flex items-center justify-center cursor-pointer"
            >
              <span className="text-base leading-[23px] font-bold text-[#0D0D0D] font-[Heebo]">
                Renomer
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
