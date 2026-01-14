"use client";

import { Copy, ExternalLink, Pencil, Trash, Check, FolderInput } from "lucide-react";
import { useState } from "react";
import DeleteConfirmModal from "./DeleteConfirmModal";
import EditLinkModal from "./EditLinkModal";
import MoveToFolderModal from "./MoveToFolderModal";
import Tooltip from "./Tooltip";

interface DetailedLinkCardProps {
  linkId: string;
  siteName: string;
  siteUrl: string;
  description: string;
  faviconUrl?: string;
  thumbnailUrl?: string | null; // Image OG du site web
  link: string;
  tags?: string[];
  isSelectionMode?: boolean;
  onCheckChange?: (linkId: string, checked: boolean) => void;
  onDelete?: (linkId: string) => void;
  canDelete?: boolean;
  canEdit?: boolean;
  currentFolderId?: string | null;
}

export default function DetailedLinkCard({
  linkId,
  siteName,
  siteUrl,
  description,
  faviconUrl,
  thumbnailUrl,
  link,
  tags = [],
  isSelectionMode = false,
  onCheckChange,
  onDelete,
  canDelete = true,
  canEdit = true,
  currentFolderId,
}: DetailedLinkCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Détecter si on a une thumbnail
  const hasThumbnail = !!thumbnailUrl;

  // Générer l'URL du favicon automatiquement depuis le domaine
  const getAutoFaviconUrl = (url: string): string => {
    try {
      // Utiliser Google Favicon Service pour récupérer le favicon
      const domain = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
      return '';
    }
  };

  // Utiliser le favicon fourni ou le générer automatiquement
  const effectiveFaviconUrl = faviconUrl || getAutoFaviconUrl(siteUrl || link);

  // Proxy external images to avoid CORS issues
  const getProxiedImageUrl = (url: string, size?: "thumbnail" | "full") => {
    if (url.startsWith("http") && !url.includes("localhost")) {
      const params = new URLSearchParams({ url });
      if (size === "thumbnail") {
        params.set("w", "400");
        params.set("q", "75");
      }
      return `/api/proxy-image?${params.toString()}`;
    }
    return url;
  };

  const proxiedThumbnail = thumbnailUrl
    ? getProxiedImageUrl(thumbnailUrl, "thumbnail")
    : null;

  const handleDelete = () => {
    onDelete?.(linkId);
    setIsDeleteModalOpen(false);
  };

  const handleCheckChange = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    onCheckChange?.(linkId, newValue);
  };

  // Show checkbox if in selection mode or checked
  const showCheckbox = isSelectionMode || isChecked;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(link, "_blank");
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (
    newTitle: string,
    newUrl: string,
    newDescription: string,
    newTags: string[]
  ) => {
    // TODO: Logique de sauvegarde
    console.log("Saved:", { newTitle, newUrl, newDescription, newTags });
  };

  // Truncate link for display
  const displayLink = link.length > 20 ? link.substring(0, 20) + "..." : link;

  return (
    <>
      <div className={`w-[350px] ${hasThumbnail ? 'h-auto bg-white' : 'h-auto bg-[#FEF8EE]'} border-[3px] border-black rounded-xl flex flex-col items-start p-3 gap-[10px] box-border relative`}>
        {/* Checkbox - shown when in selection mode */}
        {showCheckbox && (
          <div className="absolute left-3 top-3 z-10">
            <div
              onClick={handleCheckChange}
              className={`relative w-7 h-7 ${
                isChecked ? "bg-[#FEF8EE]" : "bg-[#FEF8EE] hover:bg-[#FFE3E8]"
              } border-[3px] border-[#0D0D0D] rounded-lg flex items-center justify-center cursor-pointer transition-colors`}
            >
              {isChecked && (
                <svg
                  className="absolute w-[28px] h-[22px] left-[2px] top-px z-0"
                  viewBox="0 0 25 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 10L9 17L23 3"
                    stroke="#FEF8EE"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 10L9 17L23 3"
                    stroke="#0D0D0D"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Header with favicon and site info - Frame 130 */}
        <div className="flex flex-row items-center p-[2px] gap-[10px] w-full">
          {/* Favicon */}
          <div className="w-[70px] h-[70px] min-w-[70px] min-h-[70px] rounded-full border-2 border-black flex items-center justify-center bg-white shrink-0 overflow-hidden">
            {effectiveFaviconUrl ? (
              <img
                src={effectiveFaviconUrl}
                alt={siteName}
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  // Fallback: afficher l'initiale du site si le favicon ne charge pas
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className={`text-2xl font-bold text-black ${effectiveFaviconUrl ? 'hidden' : ''}`}>
              {siteName.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Site name and URL - Frame 129 */}
          <div className="flex flex-col items-start gap-[10px] flex-1 min-w-0">
            <h3
              className="text-[28px] leading-[30px] font-extrabold text-[#0D0D0D] line-clamp-2"
              style={{ fontFamily: "Area Inktrap, sans-serif" }}
            >
              {siteName}
            </h3>
            {/* Frame 27 */}
            <div className="flex flex-col items-start gap-1">
              <span className="text-xs leading-[90%] font-medium text-[#0D0D0D] font-[Heebo]">
                {siteUrl}
              </span>
            </div>
          </div>
        </div>

        {/* Thumbnail - affiché uniquement si présent */}
        {hasThumbnail && proxiedThumbnail && (
          <div className="w-full h-[150px] overflow-hidden rounded-lg border-2 border-black bg-[#C4C4C4]">
            <img
              src={proxiedThumbnail}
              alt={siteName}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Cacher l'image si erreur de chargement
                e.currentTarget.parentElement!.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Description - Frame 28 */}
        <div className="flex flex-col items-start gap-1 w-full">
          <p className="text-xs leading-[110%] font-normal text-[#0D0D0D] font-[Heebo] line-clamp-3">
            {description}
          </p>
        </div>

        {/* Link bar with actions */}
        <div className="flex flex-row items-center gap-2.5 w-full h-[41px]">
          {/* Link input - fond blanc si pas de thumbnail (car le fond de la card est beige) */}
          <div className={`flex-1 h-[41px] ${hasThumbnail ? 'bg-[#FEF8EE]' : 'bg-white'} border-2 border-black rounded-lg flex flex-row items-center justify-center px-2.5 gap-2.5`}>
            <span className="flex-1 text-sm leading-[21px] tracking-[-0.03em] font-normal text-[#0D0D0D] font-[Heebo] truncate">
              {displayLink}
            </span>
            <Tooltip content={isCopied ? "Copié !" : "Copier le lien"}>
              <button
                onClick={handleCopy}
                className="w-5 h-5 flex items-center justify-center shrink-0 cursor-pointer transition-all"
              >
                {isCopied ? (
                  <Check className="w-5 h-5 text-green-600" strokeWidth={2} />
                ) : (
                  <Copy
                    className="w-5 h-5 text-[#0D0D0D] hover:text-[#FF506F]"
                    strokeWidth={2}
                  />
                )}
              </button>
            </Tooltip>
            <Tooltip content="Ouvrir dans un nouvel onglet">
              <button
                onClick={handleOpenLink}
                className="w-5 h-5 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <ExternalLink className="w-5 h-5 text-black" strokeWidth={2} />
              </button>
            </Tooltip>
          </div>

          {/* Move button */}
          <Tooltip content="Déplacer vers un dossier">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMoveModalOpen(true);
              }}
              className="w-[41px] h-[41px] bg-[#FEF8EE] border-2 border-black rounded-lg flex items-center justify-center p-2 shrink-0 cursor-pointer hover:bg-[#FFE3E8] transition-all"
            >
              <FolderInput className="w-5 h-5 text-black" strokeWidth={2} />
            </button>
          </Tooltip>

          {/* Edit button */}
          <Tooltip
            content={canEdit ? "Modifier" : "Vous n'avez pas la permission de modifier ce lien dans ce dossier partagé"}
          >
            <div className="relative inline-block">
              <button
                onClick={canEdit ? handleEdit : undefined}
                disabled={!canEdit}
                className={`w-[41px] h-[41px] bg-[#0D0D0D] rounded-lg flex items-center justify-center p-2 gap-1.5 shrink-0 transition-all ${
                  !canEdit
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:bg-[#1a1a1a]"
                }`}
              >
                <Pencil className="w-5 h-5 text-[#FEF8EE]" strokeWidth={2} />
              </button>
              {!canEdit && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF506F] rounded-full border-2 border-black flex items-center justify-center">
                  <span className="text-xs font-black text-black">!</span>
                </div>
              )}
            </div>
          </Tooltip>

          {/* Delete button */}
          {canDelete && (
            <Tooltip content="Supprimer">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteModalOpen(true);
                }}
                className="w-[41px] h-[41px] bg-[#C5C5C5] rounded-lg flex items-center justify-center p-2 gap-1 shrink-0 group cursor-pointer"
              >
                <Trash
                  className="w-5 h-5 text-black group-hover:text-[#FF5070] transition-colors"
                  strokeWidth={2}
                />
              </button>
            </Tooltip>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-row items-start gap-1.5 w-full overflow-hidden">
            {tags.map((tag, index) => (
              <div
                key={index}
                className={`flex flex-row justify-center items-center px-2 py-1 h-[29px] ${hasThumbnail ? 'bg-[#FEF8EE]' : 'bg-white'} border-2 border-black rounded-lg shrink-0`}
              >
                <span className="text-sm leading-[21px] tracking-[-0.03em] font-normal text-[#0D0D0D] font-[Heebo] whitespace-nowrap">
                  #{tag}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />

      <EditLinkModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentTitle={siteName}
        currentUrl={link}
        currentDescription={description}
        currentTags={tags}
        onSave={handleSaveEdit}
      />

      <MoveToFolderModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        itemId={linkId}
        itemType="link"
        itemName={siteName}
        currentFolderId={currentFolderId}
      />
    </>
  );
}
