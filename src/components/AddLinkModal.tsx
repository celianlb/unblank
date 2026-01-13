"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { useCreateLink } from "@/hooks/useLinks";
import { useSubscription } from "@/hooks/useSubscription";
import { extractMetadata } from "@/utils/linkUtils";
import { motion } from "framer-motion";
import { Lock, Plus, WandSparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId?: string; // Dossier dans lequel ajouter le lien
}

export default function AddLinkModal({
  isOpen,
  onClose,
  folderId,
}: AddLinkModalProps) {
  const { session } = useAuthContext();
  const { subscription } = useSubscription();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metadataError, setMetadataError] = useState<boolean>(false);
  const [autoTaggingEnabled, setAutoTaggingEnabled] = useState(false);

  // Mutation React Query
  const createLink = useCreateLink(session?.user?.id || "", folderId);

  // Vérifier si l'utilisateur peut utiliser l'IA (pro avec statut actif)
  const canUseAI = subscription?.isActive() && subscription?.plan === "pro";

  // Réinitialiser le formulaire quand la modale s'ouvre/ferme
  useEffect(() => {
    if (!isOpen) {
      setUrl("");
      setTitle("");
      setDescription("");
      setTags([]);
      setTagInput("");
      setMetadata(null);
      setErrorMessage(null);
      setMetadataError(false);
      setAutoTaggingEnabled(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Gérer le changement d'URL - réinitialiser les métadonnées si l'URL change
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    // Si l'URL change et qu'on avait déjà des métadonnées, les réinitialiser
    if (metadata) {
      setMetadata(null);
      setTitle("");
      setDescription("");
      setMetadataError(false);
    }
  };

  // Extraction automatique des métadonnées quand l'URL change
  const handleUrlBlur = async () => {
    if (url && url.startsWith("http") && !metadata) {
      setIsLoadingMetadata(true);
      setMetadataError(false);
      const meta = await extractMetadata(url);
      setIsLoadingMetadata(false);

      if (meta) {
        setMetadata(meta);
        if (!title) setTitle(meta.title || "");
        if (!description) setDescription(meta.description || "");
      } else {
        // L'extraction a échoué, on affiche un warning mais on permet de continuer
        setMetadataError(true);
      }
    }
  };

  // Gérer le paste dans l'input URL - sortir de l'input et déclencher l'extraction
  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (pastedText && pastedText.startsWith("http")) {
      // On laisse le paste se faire, puis on blur pour déclencher l'extraction
      setTimeout(() => {
        (e.target as HTMLInputElement).blur();
      }, 0);
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
        autoTaggingEnabled,
      });

      // Fermer la modale
      onClose();
    } catch (error: any) {
      console.error("Error creating link:", error);

      // Gérer l'erreur de limite de liens
      if (error.code === "LINK_LIMIT_REACHED") {
        setErrorMessage(
          error.message ||
            "Limite mensuelle de liens atteinte. Passez à un plan Pro pour continuer."
        );
      } else {
        setErrorMessage("Erreur lors de l'ajout du lien. Veuillez réessayer.");
      }
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Vérifier si des données ont été saisies
  const hasUnsavedData =
    url.trim() !== "" ||
    title.trim() !== "" ||
    description.trim() !== "" ||
    tags.length > 0;

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
          className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] max-h-[90vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} className="flex flex-col p-6 sm:p-8 gap-4 sm:gap-6">
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
                Lien{" "}
                {isLoadingMetadata && (
                  <span className="text-sm text-gray-500">
                    (Extraction des métadonnées...)
                  </span>
                )}
              </label>
              <input
                type="url"
                placeholder="URL"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                onBlur={handleUrlBlur}
                onPaste={handleUrlPaste}
                className="w-full h-12 px-4 rounded-xl border-2 border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black text-base font-[Heebo] font-normal placeholder:font-[Heebo] placeholder:font-normal"
                required
                autoFocus
              />
            </div>

            {/* Warning métadonnées */}
            {metadataError && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border-2 border-amber-500 rounded-xl">
                <span className="text-sm font-medium text-amber-700 font-[Heebo]">
                  Impossible d'extraire les métadonnées. Vous pouvez continuer
                  en remplissant les champs manuellement.
                </span>
              </div>
            )}

            {/* Message d'erreur */}
            {errorMessage && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border-2 border-red-500 rounded-xl">
                <span className="text-sm font-medium text-red-700 font-[Heebo]">
                  {errorMessage}
                </span>
              </div>
            )}

            {/* Titre */}
            <div className="flex flex-col gap-2">
              <label className="text-base font-medium text-black font-[Heebo]">
                Titre
              </label>
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
              <label className="text-base font-medium text-black font-[Heebo]">
                Description
              </label>
              <textarea
                placeholder=""
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-20 sm:h-32 px-4 py-3 rounded-xl border-2 border-black bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black text-base resize-none font-[Heebo] font-normal placeholder:font-[Heebo] placeholder:font-normal"
              />
            </div>

            {/* Toggle Tagging Automatique */}
            <div className="flex flex-row items-center justify-between w-full p-4 bg-[#FFE3E8] border-2 border-black rounded-xl">
              <div className="flex items-center gap-3">
                <WandSparkles
                  size={24}
                  color={autoTaggingEnabled ? "#0D0D0D" : "#8B8B8B"}
                  strokeWidth={2}
                />
                <span
                  className="text-base font-medium font-[Heebo]"
                  style={{ color: autoTaggingEnabled ? "#0D0D0D" : "#8B8B8B" }}
                >
                  Activer le tagging automatique
                </span>
                {!canUseAI && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FF506F] rounded-md">
                    <Lock size={12} color="#FFFFFF" strokeWidth={2} />
                    <span className="text-xs font-bold text-white uppercase">
                      PRO
                    </span>
                  </div>
                )}
              </div>
              <motion.div
                onClick={() => {
                  if (!canUseAI) {
                    if (
                      confirm(
                        "Le tagging automatique est une fonctionnalité premium. Voulez-vous passer à un plan Pro ou Team ?"
                      )
                    ) {
                      window.open("https://unblank.app/pricing", "_blank");
                    }
                    return;
                  }
                  setAutoTaggingEnabled(!autoTaggingEnabled);
                }}
                animate={{
                  backgroundColor: autoTaggingEnabled ? "#FF506F" : "#FFE3E8",
                  borderColor: autoTaggingEnabled ? "#0D0D0D" : "#8B8B8B",
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="relative cursor-pointer rounded-full border-2 flex items-center"
                style={{
                  width: "52px",
                  height: "30px",
                  padding: "4px",
                  opacity: canUseAI ? 1 : 0.7,
                }}
              >
                <motion.div
                  animate={{
                    x: autoTaggingEnabled ? 18 : 0,
                    backgroundColor: autoTaggingEnabled ? "#0D0D0D" : "#8B8B8B",
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                  }}
                />
              </motion.div>
            </div>

            {/* Tag Input */}
            <div className="flex flex-col items-start p-0 gap-1.5 w-full min-h-[120px] sm:min-h-[165px]">
              <div className="flex flex-row items-center px-3 gap-4 w-full h-[45px] bg-white border border-dashed border-gray-300 rounded-xl">
                <input
                  type="text"
                  placeholder="Écrire un tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
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
                  <p className="text-sm text-gray-400 font-[Heebo] font-normal">
                    Aucun tag pour l'instant.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2.5 w-full">
                    {tags.map((tag, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFE3E8] border border-black rounded-lg font-[Heebo] font-medium text-sm text-black"
                      >
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                          {tag}
                        </span>
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
              disabled={
                createLink.isPending || isLoadingMetadata || !url.trim()
              }
              className="w-full h-14 rounded-xl bg-[#FF506F] transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-black font-bold text-base font-[Heebo] disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-[#FF6080] enabled:active:translate-y-[2px] enabled:active:shadow-none enabled:cursor-pointer"
            >
              {createLink.isPending
                ? "Ajout en cours..."
                : isLoadingMetadata
                ? "Extraction en cours..."
                : "Ajouter le lien"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
