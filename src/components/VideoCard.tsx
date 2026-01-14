"use client";

import { Trash, Copy, ExternalLink, Check, FolderInput } from "lucide-react";
import { useState } from "react";
import DeleteConfirmModal from "./DeleteConfirmModal";
import VideoPreviewModal from "./VideoPreviewModal";
import MoveToFolderModal from "./MoveToFolderModal";
import Tooltip from "./Tooltip";

interface VideoCardProps {
  linkId: string;
  platformName: string; // "YouTube", "Vimeo", etc.
  platformUrl: string; // "youtube.com"
  videoUrl: string; // URL complète de la vidéo
  thumbnailUrl?: string; // Thumbnail de la vidéo
  title: string;
  description?: string;
  tags?: string[];
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onCheckChange?: (linkId: string, checked: boolean) => void;
  onDelete?: (linkId: string) => void;
  canDelete?: boolean;
  canEdit?: boolean;
  currentFolderId?: string | null;
}

export default function VideoCard({
  linkId,
  platformName,
  platformUrl,
  videoUrl,
  thumbnailUrl,
  title,
  description = "",
  tags = [],
  isSelectionMode = false,
  isSelected = false,
  onCheckChange,
  onDelete,
  canDelete = true,
  canEdit = true,
  currentFolderId,
}: VideoCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Extraire l'ID de la vidéo YouTube depuis l'URL
  const getYouTubeVideoId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      // Format: youtube.com/watch?v=VIDEO_ID
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v');
      }
      // Format: youtu.be/VIDEO_ID
      if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.slice(1);
      }
    } catch {
      return null;
    }
    return null;
  };

  // Générer la thumbnail YouTube si pas fournie
  const getYouTubeThumbnail = (url: string): string | null => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      // Utiliser maxresdefault pour la meilleure qualité, avec fallback sur hqdefault
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return null;
  };

  // Proxy external images to avoid CORS issues
  const getProxiedImageUrl = (url?: string, size?: "thumbnail" | "full") => {
    if (!url) return undefined;
    // Only proxy external images (not localhost or relative URLs)
    if (url.startsWith("http") && !url.includes("localhost")) {
      const params = new URLSearchParams({ url });

      // Add size params for thumbnails (save bandwidth)
      if (size === "thumbnail") {
        params.set("w", "400"); // Max width 400px for cards
        params.set("q", "75"); // Quality 75% for thumbnails
      }

      return `/api/proxy-image?${params.toString()}`;
    }
    return url;
  };

  // Utiliser la thumbnail fournie, ou générer celle de YouTube si c'est une vidéo YouTube
  const effectiveThumbnailUrl = thumbnailUrl ||
    (platformName.toLowerCase().includes('youtube') ? getYouTubeThumbnail(videoUrl) : null);

  const proxiedThumbnail = getProxiedImageUrl(effectiveThumbnailUrl || undefined, "thumbnail");

  const handleCheckChange = () => {
    const newValue = !isSelected;
    onCheckChange?.(linkId, newValue);
  };

  // Show hover elements if in selection mode or hovering
  const showHoverElements = isSelectionMode || isSelected;

  const handleDelete = async () => {
    try {
      setIsDeleteModalOpen(false);

      // Si un callback onDelete est fourni, l'utiliser (React Query)
      if (onDelete) {
        onDelete(linkId);
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("Erreur lors de la suppression de la vidéo");
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(videoUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(videoUrl, "_blank");
  };

  // Truncate link for display
  const displayLink = videoUrl.length > 25 ? videoUrl.substring(0, 25) + "..." : videoUrl;

  const handleCardClick = () => {
    if (isSelectionMode) {
      // En mode sélection, cliquer sur la carte toggle la checkbox
      handleCheckChange();
    } else {
      // Sinon, ouvrir la preview
      setIsPreviewModalOpen(true);
    }
  };

  // Détecter le logo de la plateforme
  const getPlatformLogo = () => {
    if (platformName.toLowerCase().includes("youtube")) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-white">
          <svg className="w-12 h-12" viewBox="0 0 159 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M154 17.5c-1.82-6.73-7.07-12-13.8-13.8C128.2 0 79.5 0 79.5 0S30.8 0 18.8 3.7C12.07 5.5 6.82 10.77 5 17.5 1.5 29.5 1.5 55 1.5 55s0 25.5 3.5 37.5c1.82 6.73 7.07 12 13.8 13.8 12 3.7 60.7 3.7 60.7 3.7s48.7 0 60.7-3.7c6.73-1.8 11.98-7.07 13.8-13.8 3.5-12 3.5-37.5 3.5-37.5s0-25.5-3.5-37.5z" fill="#FF0000"/>
            <path d="M64 78.77V31.23L104.5 55 64 78.77z" fill="#FFFFFF"/>
          </svg>
        </div>
      );
    } else if (platformName.toLowerCase().includes("vimeo")) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#1ab7ea]">
          <svg className="w-10 h-10" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M255.8 84.8c-1.1 24.2-18 57.4-50.6 99.4C172 229 146.4 250 126.4 250c-13.4 0-24.8-12.4-34-37.2-6.2-22.8-12.4-45.6-18.6-68.4-6.9-24.8-14.3-37.2-22.2-37.2-1.7 0-7.7 3.6-18 10.8L24 105.2c11.5-10.1 22.8-20.2 33.9-30.3 15.1-13.1 26.5-20 34.1-20.6 17.9-1.7 28.9 10.5 33 36.6 4.4 28.2 7.5 45.7 9.2 52.6 5.1 23.2 10.7 34.8 16.9 34.8 4.8 0 12-7.6 21.6-22.8 9.6-15.2 14.8-26.8 15.5-34.8 1.4-13.2-3.8-19.8-15.7-19.8-5.6 0-11.4 1.3-17.3 3.8 11.5-37.7 33.5-56 65.9-54.8 24 .9 35.3 16.3 33.9 46.1z" fill="white"/>
          </svg>
        </div>
      );
    }
    // Fallback: afficher l'initiale de la plateforme
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <span className="text-3xl font-extrabold text-white" style={{ fontFamily: "Area Inktrap, sans-serif" }}>
          {platformName.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group/card w-full sm:w-[450px] bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0px_#000000] flex flex-col items-start box-border cursor-pointer relative overflow-hidden"
      >
        {/* Checkbox - shown when in selection mode */}
        {showHoverElements && (
          <div className="absolute left-3 top-3 z-20">
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleCheckChange();
              }}
              className={`relative w-7 h-7 ${
                isSelected ? "bg-[#FEF8EE]" : "bg-[#FEF8EE] hover:bg-[#FFE3E8]"
              } border-[3px] border-[#0D0D0D] rounded-lg flex items-center justify-center cursor-pointer transition-colors`}
            >
              {isSelected && (
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

        {/* Action buttons */}
        <div
          className={`absolute right-3 top-3 ${
            showHoverElements ? "flex" : "hidden group-hover/card:flex"
          } gap-1.5 z-20`}
        >
          {/* Move button */}
          <Tooltip content="Déplacer" position="bottom">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMoveModalOpen(true);
              }}
              className="flex-row justify-center items-center p-2 w-9 h-9 bg-[#FEF8EE] border border-black rounded-lg cursor-pointer flex hover:bg-[#FFE3E8] transition-colors"
            >
              <FolderInput
                className="w-5 h-5 text-black"
                strokeWidth={2}
              />
            </button>
          </Tooltip>

          {/* Delete button */}
          {canDelete && (
            <Tooltip content="Supprimer" position="bottom">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteModalOpen(true);
                }}
                className="flex-row justify-center items-center p-2 w-9 h-9 bg-[#C5C5C5] rounded-lg cursor-pointer flex"
              >
                <Trash
                  className="w-5 h-5 text-black hover:text-[#FF5070] transition-colors"
                  strokeWidth={2}
                />
              </button>
            </Tooltip>
          )}
        </div>

        {/* Header with platform logo and info */}
        <div className="flex flex-row items-center p-3 gap-[10px] w-full bg-white z-10">
          {/* Platform Logo */}
          <div className="w-[70px] h-[70px] min-w-[70px] min-h-[70px] rounded-full border-2 border-black flex items-center justify-center shrink-0 overflow-hidden bg-white">
            {getPlatformLogo()}
          </div>

          {/* Platform name and URL */}
          <div className="flex flex-col items-start gap-1">
            <h3
              className="text-[28px] leading-[30px] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: "Area Inktrap, sans-serif" }}
            >
              {platformName}
            </h3>
            <span className="text-xs leading-[90%] font-medium text-[#0D0D0D] font-[Heebo]">
              {platformUrl}
            </span>
          </div>
        </div>

        {/* Video Thumbnail - Full width, no border, reduced height */}
        <div className="w-full h-[200px] bg-[#C4C4C4] overflow-hidden relative">
          {proxiedThumbnail ? (
            <img
              src={proxiedThumbnail}
              alt={title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Error loading thumbnail:', thumbnailUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-sm text-gray-500">Pas de miniature</span>
            </div>
          )}
        </div>

        {/* Bottom content with padding */}
        <div className="flex flex-col gap-3 p-3 w-full">
          {/* Title */}
          <h4 className="text-lg leading-[120%] font-bold text-[#0D0D0D] font-[Heebo] line-clamp-2">
            {title}
          </h4>

          {/* Link bar with actions */}
          <div className="flex flex-row items-center gap-2 w-full h-[41px]">
            {/* Link input */}
            <div className="flex-1 h-[41px] bg-[#FEF8EE] border-2 border-black rounded-lg flex flex-row items-center justify-center px-3 gap-2">
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
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-row items-start gap-1.5 flex-wrap">
              {tags.map((tag, index) => (
                <div
                  key={index}
                  className="flex flex-row justify-center items-center px-2 py-1 h-[29px] bg-[#FEF8EE] border-2 border-black rounded-lg"
                >
                  <span className="text-sm leading-[21px] tracking-[-0.03em] font-normal text-[#0D0D0D] font-[Heebo]">
                    #{tag}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />

      <VideoPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        videoUrl={videoUrl}
        title={title}
        description={description}
        linkId={linkId}
        tags={tags}
        canEdit={canEdit}
      />

      <MoveToFolderModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        itemId={linkId}
        itemType="link"
        itemName={title || displayLink}
        currentFolderId={currentFolderId}
      />
    </>
  );
}
