"use client";

import { X, Copy, ExternalLink, Check } from "lucide-react";
import { useState } from "react";

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  description?: string;
  linkId?: string;
  tags?: string[];
  canEdit?: boolean;
}

export default function VideoPreviewModal({
  isOpen,
  onClose,
  videoUrl,
  title,
  description = "",
  linkId,
  tags = [],
  canEdit = true,
}: VideoPreviewModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  // Extract video ID and create embed URL
  const getEmbedUrl = (url: string): string | null => {
    try {
      // YouTube
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const videoId = url.includes("youtu.be")
          ? url.split("youtu.be/")[1]?.split("?")[0]
          : new URL(url).searchParams.get("v");
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      // Vimeo
      if (url.includes("vimeo.com")) {
        const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
        return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
      }

      // Dailymotion
      if (url.includes("dailymotion.com")) {
        const videoId = url.split("/video/")[1]?.split("?")[0];
        return videoId ? `https://www.dailymotion.com/embed/video/${videoId}` : null;
      }

      return null;
    } catch (error) {
      console.error("Error parsing video URL:", error);
      return null;
    }
  };

  const embedUrl = getEmbedUrl(videoUrl);

  const handleCopy = () => {
    navigator.clipboard.writeText(videoUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenLink = () => {
    window.open(videoUrl, "_blank");
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#FEF8EE] border-4 border-black rounded-2xl shadow-[6px_6px_0px_#000000] w-full max-w-[900px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex justify-between items-start p-6 border-b-4 border-black">
          <div className="flex-1">
            <h2
              className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D] mb-2"
              style={{ fontFamily: "Area Inktrap, sans-serif" }}
            >
              {title}
            </h2>
            {description && (
              <p className="text-base leading-[110%] font-normal text-[#0D0D0D] font-[Heebo]">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 bg-black rounded-lg flex items-center justify-center hover:bg-[#1a1a1a] transition-colors"
          >
            <X className="w-6 h-6 text-[#FEF8EE]" strokeWidth={2} />
          </button>
        </div>

        {/* Video Player */}
        <div className="p-6">
          {embedUrl ? (
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border-3 border-black">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={title}
              />
            </div>
          ) : (
            <div className="w-full aspect-video bg-[#C4C4C4] rounded-lg flex items-center justify-center border-3 border-black">
              <p className="text-gray-600">Impossible de charger la vidéo</p>
            </div>
          )}
        </div>

        {/* Link bar */}
        <div className="px-6 pb-4">
          <div className="flex flex-row items-center gap-3 w-full h-[50px]">
            <div className="flex-1 h-full bg-white border-3 border-black rounded-lg flex flex-row items-center justify-center px-4 gap-3">
              <span className="flex-1 text-base leading-[21px] tracking-[-0.03em] font-normal text-[#0D0D0D] font-[Heebo] truncate">
                {videoUrl}
              </span>
              <button
                onClick={handleCopy}
                className="w-6 h-6 flex items-center justify-center shrink-0 cursor-pointer transition-all"
              >
                {isCopied ? (
                  <Check className="w-6 h-6 text-green-600" strokeWidth={2} />
                ) : (
                  <Copy
                    className="w-6 h-6 text-[#0D0D0D] hover:text-[#FF506F]"
                    strokeWidth={2}
                  />
                )}
              </button>
              <button
                onClick={handleOpenLink}
                className="w-6 h-6 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <ExternalLink className="w-6 h-6 text-black" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Tags section */}
        {tags.length > 0 && (
          <div className="px-6 pb-6">
            <h3 className="text-xl font-bold text-[#0D0D0D] font-[Heebo] mb-3">
              Tags
            </h3>
            <div className="flex flex-row flex-wrap gap-2">
              {tags.map((tag, index) => (
                <div
                  key={index}
                  className="flex flex-row justify-center items-center px-3 py-1.5 bg-white border-2 border-black rounded-lg"
                >
                  <span className="text-sm leading-[21px] tracking-[-0.03em] font-normal text-[#0D0D0D] font-[Heebo]">
                    #{tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
