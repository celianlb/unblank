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
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[479px] bg-white border-4 border-black shadow-[4px_4px_0px_#000000] rounded-xl p-8 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-8 top-8 w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-gray-100 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-[21px] h-[21px]" strokeWidth={2} />
        </button>

        {/* Title */}
        <div className="flex flex-col items-center gap-8">
          <h2
            className="text-[32px] leading-[90%] font-extrabold text-center uppercase text-[#0D0D0D]"
            style={{ fontFamily: 'Area Inktrap, sans-serif' }}
          >
            Éditer les tags
          </h2>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5">
          {/* Input Section */}
          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center px-2 h-14 bg-white border border-dashed border-[#8B8B8B] rounded-xl">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder=""
                className="flex-1 h-10 text-lg text-[#8B8B8B] bg-transparent outline-none font-normal"
                style={{ fontFamily: 'Heebo, sans-serif' }}
              />
              <button
                onClick={handleAddTag}
                className="flex items-center justify-center gap-2.5 px-[18px] h-10 bg-[#FF506F] border-2 border-[#0D0D0D] rounded-lg hover:bg-[#FF2F5A] transition-colors"
              >
                <Plus className="w-6 h-6" strokeWidth={2} />
                <span
                  className="text-base font-bold leading-[23px] tracking-[-0.03em] text-[#0D0D0D]"
                  style={{ fontFamily: 'Heebo, sans-serif' }}
                >
                  Ajouter
                </span>
              </button>
            </div>
          </div>

          {/* Tags Display Section */}
          <div className="min-h-[134px] p-2.5 bg-white border border-dashed border-[#8B8B8B] rounded-xl flex flex-wrap gap-2.5">
            {tags.map((tag, index) => (
              <div
                key={index}
                className="flex items-center justify-center gap-2.5 px-2 h-8 bg-[#FFE3E8] rounded"
              >
                <span
                  className="text-sm leading-[21px] tracking-[-0.03em] text-[#0D0D0D]"
                  style={{ fontFamily: 'Heebo, sans-serif' }}
                >
                  #{tag}
                </span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="w-6 h-6 flex items-center justify-center rounded-2xl hover:bg-[#FFD0D8] transition-colors"
                  aria-label={`Supprimer ${tag}`}
                >
                  <X className="w-3.5 h-3.5 text-[#FF2F2F]" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
