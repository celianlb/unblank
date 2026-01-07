"use client";

import { Copy, ExternalLink, Trash, Check } from "lucide-react";
import { useState } from "react";
import DeleteConfirmModal from "./DeleteConfirmModal";
import ImagePreviewModal from "./ImagePreviewModal";

interface ImageCardProps {
  linkId: string;
  imageUrl: string;
  link: string;
  fileType: string;
  dimensions: string;
  fileSize: string;
  dateAdded: string;
  folder: string;
  tags?: string[];
  isSelectionMode?: boolean;
  onCheckChange?: (linkId: string, checked: boolean) => void;
  onDelete?: (linkId: string) => void;
  canDelete?: boolean;
  canEdit?: boolean;
}

export default function ImageCard({
  linkId,
  imageUrl,
  link,
  fileType,
  dimensions,
  fileSize,
  dateAdded,
  folder,
  tags = [],
  isSelectionMode = false,
  onCheckChange,
  onDelete,
  canDelete = true,
  canEdit = true,
}: ImageCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Proxy external images to avoid CORS issues
  const getProxiedImageUrl = (url: string, size?: "thumbnail" | "full") => {
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

  const thumbnailUrl = getProxiedImageUrl(imageUrl, "thumbnail");
  const fullSizeUrl = getProxiedImageUrl(imageUrl, "full");

  const handleCheckChange = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    onCheckChange?.(linkId, newValue);
  };

  // Show hover elements if in selection mode or checked
  const showHoverElements = isSelectionMode || isChecked;

  const handleDelete = () => {
    onDelete?.(linkId);
    setIsDeleteModalOpen(false);
  };

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

  const handleCardClick = () => {
    setIsPreviewModalOpen(true);
  };

  // Truncate link for display
  const displayLink = link.length > 20 ? link.substring(0, 20) + "..." : link;

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group/card w-full sm:w-[200px] md:w-[230px] lg:w-[250px] xl:w-[272px] h-[280px] sm:h-[300px] md:h-[330px] lg:h-[345px] xl:h-[359px] bg-[#FEF8EE] border-3 sm:border-4 border-black rounded-2xl sm:rounded-[20px] relative cursor-pointer transition-shadow hover:shadow-[4px_4px_0px_#000000] box-border overflow-hidden"
      >
        {/* Image - full bleed with overflow */}
        <div className="absolute left-0 top-[-18px] sm:top-[-20px] md:top-[-22px] w-[calc(100%-8px)] sm:w-[192px] md:w-[222px] lg:w-[242px] xl:w-[264px] h-[290px] sm:h-[310px] md:h-[344px] lg:h-[360px] xl:h-[374px] overflow-hidden rounded-xl sm:rounded-[16px] ml-1">
          <img
            src={thumbnailUrl}
            alt="Preview"
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Checkbox container - hidden by default, shown on hover */}
        <div
          className={`absolute left-2 sm:left-3 top-2 sm:top-3 w-[30px] sm:w-[36px] h-[26px] sm:h-[30px] ${
            showHoverElements ? "flex" : "hidden group-hover/card:flex"
          } flex-row items-center`}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleCheckChange();
            }}
            className={`relative w-6 h-6 sm:w-7 sm:h-7 ${
              isChecked ? "bg-[#FEF8EE]" : "bg-[#FEF8EE] hover:bg-[#FFE3E8]"
            } border-2 sm:border-[3px] border-[#0D0D0D] rounded-md sm:rounded-lg flex items-center justify-center cursor-pointer transition-colors isolate`}
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

        {/* Delete button - hidden by default, shown on hover */}
        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDeleteModalOpen(true);
            }}
            className={`absolute right-2 sm:right-3 top-2 sm:top-3 ${
              showHoverElements ? "flex" : "hidden group-hover/card:flex"
            } flex-row justify-center items-center p-1.5 sm:p-2 w-7 h-7 sm:w-9 sm:h-9 bg-[#C5C5C5] rounded-md sm:rounded-lg cursor-pointer`}
          >
            <Trash
              className="w-4 h-4 sm:w-5 sm:h-5 text-black hover:text-[#FF5070] transition-colors"
              strokeWidth={2}
            />
          </button>
        )}

        {/* Tags - hidden by default, shown on hover */}
        {tags.length > 0 && (
          <div
            className={`absolute left-2 sm:left-3 bottom-[50px] sm:bottom-[61px] ${
              showHoverElements ? "flex" : "hidden group-hover/card:flex"
            } flex-row gap-1`}
          >
            {tags.map((tag, index) => (
              <div
                key={index}
                className="flex flex-row justify-center items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#FEF8EE] border sm:border-2 border-black rounded-md sm:rounded-lg"
              >
                <span className="text-xs sm:text-sm leading-tight sm:leading-[21px] tracking-[-0.03em] text-[#0D0D0D] font-[Heebo]">
                  #{tag}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Link bar - hidden by default, shown on hover */}
        <div
          className={`absolute left-2 sm:left-3 right-2 sm:right-3 bottom-2 sm:bottom-3 ${
            showHoverElements ? "flex" : "hidden group-hover/card:flex"
          } flex-row justify-center items-center p-2 sm:p-2.5 gap-2 sm:gap-2.5 bg-[#FEF8EE] border sm:border-2 border-black rounded-md sm:rounded-lg`}
        >
          <span className="flex-1 text-xs sm:text-sm leading-tight sm:leading-[21px] tracking-[-0.03em] text-[#0D0D0D] font-[Heebo] truncate">
            {displayLink}
          </span>
          <button
            onClick={handleCopy}
            className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center cursor-pointer transition-all"
          >
            {isCopied ? (
              <Check
                className="w-4 h-4 sm:w-5 sm:h-5 text-green-600"
                strokeWidth={2}
              />
            ) : (
              <Copy
                className="w-4 h-4 sm:w-5 sm:h-5 text-[#0D0D0D] hover:text-[#FF506F]"
                strokeWidth={2}
              />
            )}
          </button>
          <button
            onClick={handleOpenLink}
            className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center cursor-pointer"
          >
            <ExternalLink
              className="w-4 h-4 sm:w-5 sm:h-5 text-[#0D0D0D]"
              strokeWidth={2}
            />
          </button>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />

      <ImagePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        imageUrl={fullSizeUrl}
        link={link}
        linkId={linkId}
        fileType={fileType}
        dimensions={dimensions}
        fileSize={fileSize}
        dateAdded={dateAdded}
        folder={folder}
        tags={tags}
        canEdit={canEdit}
      />
    </>
  );
}
