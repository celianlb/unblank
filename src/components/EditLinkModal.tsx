'use client';

import { X, Plus } from 'lucide-react';
import { useState } from 'react';

interface EditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTitle: string;
  currentUrl: string;
  currentDescription: string;
  currentTags: string[];
  onSave: (title: string, url: string, description: string, tags: string[]) => void;
}

export default function EditLinkModal({
  isOpen,
  onClose,
  currentTitle,
  currentUrl,
  currentDescription,
  currentTags,
  onSave
}: EditLinkModalProps) {
  const [title, setTitle] = useState(currentTitle);
  const [url, setUrl] = useState(currentUrl);
  const [description, setDescription] = useState(currentDescription);
  const [tags, setTags] = useState<string[]>(currentTags);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    onSave(title, url, description, tags);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="w-[479px] bg-white border-4 border-black shadow-[4px_4px_0px_#000000] rounded-3xl p-8 flex flex-col gap-[10px] relative box-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 w-9 h-9 flex items-center justify-center rounded-2xl cursor-pointer"
        >
          <X className="w-9 h-9 text-black hover:text-[#FF5070] transition-colors cursor-pointer" strokeWidth={2} />
        </button>

        {/* Content */}
        <div className="flex flex-col items-start gap-4 w-full">
          {/* Title */}
          <div className="flex flex-row justify-center items-center w-full">
            <h2
              className="text-[32px] leading-[90%] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              Modifier
            </h2>
          </div>

          {/* Modifier le titre */}
          <div className="flex flex-col justify-end items-start gap-1.5 w-full">
            <label className="text-base leading-[23px] font-medium text-[#0D0D0D] font-[Heebo]">
              Modifier le titre
            </label>
            <div className="w-full h-[54px] rounded-xl">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-[54px] px-4 py-2.5 bg-white border-2 border-black rounded-xl text-base leading-[23px] font-bold text-[#0D0D0D] font-[Heebo] outline-none"
                placeholder="Titre"
              />
            </div>
          </div>

          {/* Modifier le lien */}
          <div className="flex flex-col justify-end items-start gap-1.5 w-full">
            <label className="text-base leading-[23px] font-medium text-[#0D0D0D] font-[Heebo]">
              Modifier le lien
            </label>
            <div className="w-full h-[54px] rounded-xl">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full h-[54px] px-4 py-2.5 bg-white border-2 border-black rounded-xl text-base leading-[23px] font-normal text-[#0D0D0D] font-[Heebo] outline-none placeholder:text-[#636363]"
                placeholder="URL"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col justify-end items-start gap-1.5 w-full">
            <label className="text-base leading-[23px] font-medium text-[#0D0D0D] font-[Heebo]">
              Description
            </label>
            <div className="w-full">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-[175px] px-4 py-2.5 bg-white border-2 border-black rounded-xl text-base leading-[23px] font-normal text-[#0D0D0D] font-[Heebo] outline-none resize-none"
                placeholder="Description"
              />
            </div>
          </div>

          {/* Tags section */}
          <div className="flex flex-col items-start gap-1.5 w-full">
            {/* Tag input */}
            <div className="w-full h-[56px] bg-white border border-dashed border-[#8B8B8B] rounded-xl p-2 flex flex-row items-center">
              <div className="flex flex-row justify-between items-center gap-[10px] flex-1">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 text-lg leading-[26px] font-normal text-[#8B8B8B] font-[Heebo] outline-none bg-transparent"
                  placeholder=""
                />
                <button
                  onClick={handleAddTag}
                  className="h-10 px-[18px] py-3 bg-[#FF506F] border-2 border-[#0D0D0D] rounded-lg flex flex-row justify-center items-center gap-[10px] cursor-pointer hover:bg-[#FF3D5F] transition-colors"
                >
                  <Plus className="w-6 h-6 text-[#0D0D0D]" strokeWidth={2} />
                  <span className="text-base leading-[23px] tracking-[-0.03em] font-bold text-[#0D0D0D] font-[Heebo]">
                    Ajouter
                  </span>
                </button>
              </div>
            </div>

            {/* Tags display */}
            <div className="w-full min-h-[134px] bg-white border border-dashed border-[#8B8B8B] rounded-xl p-[10px] flex flex-row flex-wrap gap-[10px]">
              {tags.map((tag, index) => (
                <div
                  key={index}
                  className="flex flex-row justify-center items-center px-2 py-1 h-8 bg-[#FFE3E8] rounded gap-[10px]"
                >
                  <span className="text-sm leading-[21px] tracking-[-0.03em] font-normal text-[#0D0D0D] font-[Heebo]">
                    #{tag}
                  </span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="w-6 h-6 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-[#FF2F2F]" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            className="w-full h-[54px] bg-[#FF506F] border-2 border-[#0D0D0D] shadow-[3px_3px_0px_#000000] rounded-xl flex flex-row justify-center items-center px-[27px] py-[10px] gap-[10px] cursor-pointer hover:bg-[#FF3D5F] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <span className="text-base leading-[23px] font-bold text-[#0D0D0D] font-[Heebo]">
              Modifier
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
