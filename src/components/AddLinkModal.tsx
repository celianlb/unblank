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
  const [tag, setTag] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Logique d'ajout du lien
    console.log({ url, title, description, tag });
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] max-h-[90vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} className="flex flex-col p-8 gap-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-black">Nouveau lien</h2>
              <button
                type="button"
                onClick={onClose}
                className="hover:opacity-70 transition-opacity"
              >
                <X className="w-8 h-8 text-black" strokeWidth={2} />
              </button>
            </div>

            {/* Lien (URL) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-black">Lien</label>
              <input
                type="url"
                placeholder="URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border-2 border-[#7C3AED] bg-white text-black placeholder-gray-400 focus:outline-none focus:border-[#7C3AED] text-base"
                required
              />
            </div>

            {/* Titre */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-black">Titre</label>
              <input
                type="text"
                placeholder="Titre"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border-2 border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black text-base"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-black">Description</label>
              <textarea
                placeholder=""
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-32 px-4 py-3 rounded-xl border-2 border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black text-base resize-none"
              />
            </div>

            {/* Tag Input */}
            <div className="flex flex-col items-start p-0 gap-1.5 w-full h-[165px]">
              <div className="flex items-center gap-2 w-full h-12">
                <input
                  type="text"
                  placeholder="Écrire un tag..."
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="flex-1 h-full px-4 rounded-xl border-2 border-dashed border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:border-gray-400 text-base"
                />
                <button
                  type="button"
                  className="w-12 h-12 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors shrink-0"
                >
                  <Plus className="w-5 h-5 text-gray-400" strokeWidth={2} />
                </button>
              </div>

              <div className="flex-1 w-full border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
                <p className="text-sm text-gray-400">Aucun tag ajouter</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-14 rounded-xl bg-[#FF5070] hover:bg-[#FF3D5F] transition-colors border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black font-bold text-base"
            >
              Ajouter le lien
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
