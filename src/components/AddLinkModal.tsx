'use client';

import { X, Plus } from 'lucide-react';
import { useState } from 'react';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddLinkModal({ isOpen, onClose }: AddLinkModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Logique d'ajout du lien
    console.log({ url, title, description, tags });
    onClose();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
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
          <form onSubmit={handleSubmit} className="flex flex-col p-8 gap-6">
            {/* Header */}
            <div className="flex items-center justify-center mb-2 relative w-full">
              <h2 className="text-2xl font-bold text-black">Nouveau lien</h2>
              <button
                type="button"
                onClick={onClose}
                className="hover:text-[#FF506F] transition-colors cursor-pointer absolute right-0"
              >
                <X className="w-8 h-8" strokeWidth={2} />
              </button>
            </div>

            {/* Lien (URL) */}
            <div className="flex flex-col gap-2">
              <label className="text-base font-medium text-black font-[Heebo]">Lien</label>
              <input
                type="url"
                placeholder="URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border-2 border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black text-base font-[Heebo] font-normal placeholder:font-[Heebo] placeholder:font-normal"
                required
              />
            </div>

            {/* Titre */}
            <div className="flex flex-col gap-2">
              <label className="text-base font-medium text-black font-[Heebo]">Titre</label>
              <input
                type="text"
                placeholder="Titre"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border-2 border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black text-base font-[Heebo] font-normal placeholder:font-[Heebo] placeholder:font-normal"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-base font-medium text-black font-[Heebo]">Description</label>
              <textarea
                placeholder=""
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-32 px-4 py-3 rounded-xl border-2 border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black text-base resize-none font-[Heebo] font-normal placeholder:font-[Heebo] placeholder:font-normal"
              />
            </div>

            {/* Tag Input */}
            <div className="flex flex-col items-start p-0 gap-1.5 w-full h-[165px]">
              <div className="flex flex-row items-center px-3 gap-4 w-full h-[45px] bg-white border border-dashed border-gray-300 rounded-xl">
                <input
                  type="text"
                  placeholder="Écrire un tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 h-full bg-transparent border-none text-black placeholder-gray-400 focus:outline-none text-sm font-[Heebo] font-normal placeholder:font-[Heebo] placeholder:font-normal"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="flex items-center justify-center flex-shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-gray-400" strokeWidth={2} />
                </button>
              </div>

              <div className="flex-1 w-full border border-dashed border-gray-300 rounded-xl flex items-center justify-center p-2.5 overflow-y-auto">
                {tags.length === 0 ? (
                  <p className="text-sm text-gray-400 font-[Heebo] font-normal">Aucun tag pour l'instant.</p>
                ) : (
                  <div className="flex flex-wrap gap-2.5 w-full">
                    {tags.map((tag, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFE3E8] border border-black rounded-lg font-[Heebo] font-medium text-sm text-black"
                      >
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="flex items-center flex-shrink-0 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-14 rounded-xl bg-[#FF506F] hover:bg-[#FF6080] active:translate-y-[2px] active:shadow-none transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black font-bold text-base cursor-pointer font-[Heebo]"
            >
              Ajouter le lien
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
