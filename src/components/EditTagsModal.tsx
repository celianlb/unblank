'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface EditTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTags: string[];
  onSave: (tags: string[]) => void;
}

export default function EditTagsModal({ isOpen, onClose, initialTags, onSave }: EditTagsModalProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      setTags([...tags, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    onSave(tags);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
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
          className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col p-8 gap-6">
            {/* Header */}
            <div className="flex items-center justify-center w-full mb-2 relative">
              <h2 className="text-3xl font-bold text-black">Éditer les tags</h2>
              <button
                type="button"
                onClick={onClose}
                className="hover:text-[#FF506F] transition-colors cursor-pointer absolute right-0"
              >
                <X className="w-8 h-8" strokeWidth={2} />
              </button>
            </div>

            {/* Input Section */}
            <div className="flex flex-col items-start p-0 gap-1.5 w-full">
              <div className="flex flex-row items-center px-3 gap-4 w-full h-14 bg-white border border-dashed border-[#8B8B8B] rounded-xl">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder=""
                  className="flex-1 h-full bg-transparent border-none text-[#8B8B8B] placeholder-gray-400 focus:outline-none text-lg font-[Heebo] font-normal"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="flex items-center justify-center gap-2.5 px-[18px] h-10 bg-[#FF506F] border-2 border-[#0D0D0D] rounded-lg hover:bg-[#FF6080] transition-colors cursor-pointer"
                >
                  <Plus className="w-6 h-6 text-[#0D0D0D]" strokeWidth={2} />
                  <span className="text-base font-bold leading-[23px] tracking-[-0.03em] text-[#0D0D0D] font-[Heebo]">
                    Ajouter
                  </span>
                </button>
              </div>

              {/* Tags Display Section */}
              <div className="min-h-[134px] w-full p-2.5 bg-white border border-dashed border-[#8B8B8B] rounded-xl flex flex-wrap gap-2.5">
                {tags.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center gap-2.5 px-2 h-8 bg-[#FFE3E8] rounded"
                  >
                    <span className="text-sm leading-[21px] tracking-[-0.03em] text-[#0D0D0D] font-[Heebo]">
                      #{tag}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="w-6 h-6 flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 text-[#FF2F2F]" strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full h-14 rounded-xl bg-[#FF506F] hover:bg-[#FF6080] active:translate-y-[2px] active:shadow-none transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black font-bold text-base cursor-pointer font-[Heebo]"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
