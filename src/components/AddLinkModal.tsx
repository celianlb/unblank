'use client';

import { X, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCreateLink } from '@/hooks/useLinks';
import { extractMetadata } from '@/utils/linkUtils';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId?: string; // Dossier dans lequel ajouter le lien
}

export default function AddLinkModal({ isOpen, onClose, folderId }: AddLinkModalProps) {
  const { session } = useAuthContext();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);

  // Mutation React Query
  const createLink = useCreateLink(session?.user?.id || '', folderId);

  // Réinitialiser le formulaire quand la modale s'ouvre/ferme
  useEffect(() => {
    if (!isOpen) {
      setUrl('');
      setTitle('');
      setDescription('');
      setTags([]);
      setTagInput('');
      setMetadata(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Extraction automatique des métadonnées quand l'URL change (avec debounce)
  const handleUrlBlur = async () => {
    if (url && url.startsWith('http') && !metadata) {
      setIsLoadingMetadata(true);
      const meta = await extractMetadata(url);
      setIsLoadingMetadata(false);

      if (meta) {
        setMetadata(meta);
        if (!title) setTitle(meta.title || '');
        if (!description) setDescription(meta.description || '');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id || !url.trim()) return;

    try {
      await createLink.mutateAsync({
        url: url.trim(),
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        folderId: folderId,
        originalImageUrl: metadata?.image || undefined,
        imageFormat: metadata?.imageFormat || undefined,
        contentType: metadata?.contentType || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });

      // Fermer la modale
      onClose();
    } catch (error) {
      console.error('Error creating link:', error);
      alert('Erreur lors de l\'ajout du lien');
    }
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

  // Vérifier si des données ont été saisies
  const hasUnsavedData = url.trim() !== '' || title.trim() !== '' || description.trim() !== '' || tags.length > 0;

  // Gérer le clic sur l'overlay
  const handleOverlayClick = () => {
    // Ne fermer que si aucune donnée n'a été saisie
    if (!hasUnsavedData) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/70"
        onClick={handleOverlayClick}
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
              <label className="text-base font-medium text-black font-[Heebo]">
                Lien {isLoadingMetadata && <span className="text-sm text-gray-500">(Extraction des métadonnées...)</span>}
              </label>
              <input
                type="url"
                placeholder="URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                className="w-full h-12 px-4 rounded-xl border-2 border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black text-base font-[Heebo] font-normal placeholder:font-[Heebo] placeholder:font-normal"
                required
                autoFocus
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
              disabled={createLink.isPending || !url.trim()}
              className="w-full h-14 rounded-xl bg-[#FF506F] transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black font-bold text-base font-[Heebo] disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-[#FF6080] enabled:active:translate-y-[2px] enabled:active:shadow-none enabled:cursor-pointer"
            >
              {createLink.isPending ? 'Ajout en cours...' : 'Ajouter le lien'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
