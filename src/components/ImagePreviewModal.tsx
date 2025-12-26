'use client';

import { useState } from 'react';
import { X, Pencil, Copy, ExternalLink } from 'lucide-react';
import EditTagsModal from './EditTagsModal';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  link: string;
  fileType: string;
  dimensions: string;
  fileSize: string;
  dateAdded: string;
  folder: string;
  tags: string[];
}

export default function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  link,
  fileType,
  dimensions,
  fileSize,
  dateAdded,
  folder,
  tags
}: ImagePreviewModalProps) {
  const [isEditTagsOpen, setIsEditTagsOpen] = useState(false);
  const [currentTags, setCurrentTags] = useState(tags);

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
  };

  const handleOpenLink = () => {
    window.open(link, '_blank');
  };

  const handleSaveTags = (newTags: string[]) => {
    setCurrentTags(newTags);
    // TODO: Save to backend/database
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Modal Container - Fully responsive */}
      <div className="w-full max-w-[95vw] xl:max-w-[1267px] h-[95vh] max-h-[939px] bg-[#FEF8EE] border-3 sm:border-4 md:border-[6px] border-black rounded-2xl sm:rounded-3xl md:rounded-[48px] relative box-border overflow-hidden flex flex-col md:flex-row">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 hover:text-[#FF506F] transition-colors cursor-pointer z-10"
        >
          <X className="w-8 h-8" strokeWidth={2} />
        </button>

        {/* Image preview - Takes more space on larger screens */}
        <div className="w-full h-[35vh] sm:h-[40vh] md:h-full md:w-[55%] lg:w-[55%] xl:w-[644px] bg-[#FEF8EE] rounded-xl overflow-hidden shrink-0 p-3 sm:p-4 md:p-6 lg:p-10">
          <img
            src={imageUrl}
            alt="Preview"
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain rounded-lg"
          />
        </div>

        {/* Right side content - Scrollable */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 md:p-6 lg:p-10 pt-0 md:pt-6 lg:pt-10 overflow-y-auto gap-3 sm:gap-4 md:gap-6">

          {/* Edit tags button */}
          <button
            onClick={() => setIsEditTagsOpen(true)}
            className="w-full sm:w-auto sm:self-start h-9 sm:h-10 md:h-12 bg-[#FEF8EE] border-2 border-[#0D0D0D] shadow-[2px_2px_0px_#000000] sm:shadow-[3px_3px_0px_#000000] rounded-lg sm:rounded-xl flex flex-row justify-center items-center px-3 sm:px-4 md:px-6 py-2 md:py-3 gap-2 cursor-pointer hover:bg-[#FFEFD9] active:translate-y-[2px] active:shadow-none transition-all">
            <Pencil className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#0D0D0D]" strokeWidth={2} />
            <span className="text-xs sm:text-sm md:text-base leading-tight font-medium uppercase text-[#0D0D0D] font-[Heebo]">
              Éditer les tags
            </span>
          </button>

          {/* Spacer for desktop to push link bar down */}
          <div className="hidden md:block flex-1 min-h-[100px]" />

          {/* Link bar */}
          <div className="w-full h-auto min-h-[50px] sm:min-h-[60px] md:min-h-[70px] lg:min-h-[84px] bg-[#FEF8EE] border-2 sm:border-[3px] border-black rounded-lg sm:rounded-xl md:rounded-2xl flex flex-row justify-center items-center px-2.5 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 gap-2 sm:gap-3 md:gap-4 lg:gap-[21px] box-border">
            <span className="flex-1 text-sm sm:text-base md:text-xl lg:text-2xl xl:text-[29px] leading-tight tracking-[-0.03em] font-normal text-[#0D0D0D] font-[Heebo] truncate">
              {link.length > 25 ? link.substring(0, 25) + '...' : link}
            </span>
            <button onClick={handleCopy} className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 xl:w-[42px] xl:h-[42px] flex items-center justify-center cursor-pointer shrink-0">
              <Copy className="w-full h-full text-[#0D0D0D]" strokeWidth={2} />
            </button>
            <button onClick={handleOpenLink} className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 xl:w-[42px] xl:h-[42px] flex items-center justify-center cursor-pointer shrink-0">
              <ExternalLink className="w-full h-full text-black" strokeWidth={2} />
            </button>
          </div>

          {/* Info box */}
          <div className="w-full bg-[#FEF8EE] border-2 sm:border-[3px] border-[#0D0D0D] rounded-lg sm:rounded-xl md:rounded-2xl flex flex-col justify-end items-start px-2.5 sm:px-3 md:px-4 py-2.5 sm:py-3 md:py-[10px] gap-0.5 sm:gap-1 box-border">
            {/* Type de fichier */}
            <div className="flex flex-row justify-between items-center w-full min-h-[24px] sm:min-h-[28px] md:min-h-[32px] lg:min-h-[35px]">
              <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl leading-tight tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo] underline">
                Type de fichier :
              </span>
              <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl leading-tight tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo]">
                {fileType}
              </span>
            </div>

            {/* Dimensions */}
            <div className="flex flex-row justify-between items-center w-full min-h-[24px] sm:min-h-[28px] md:min-h-[32px] lg:min-h-[35px]">
              <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl leading-tight tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo] underline">
                Dimensions :
              </span>
              <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl leading-tight tracking-[-0.03em] font-medium text-black font-[Heebo]">
                {dimensions}
              </span>
            </div>

            {/* Poids du fichier */}
            <div className="flex flex-row justify-between items-center w-full min-h-[24px] sm:min-h-[28px] md:min-h-[32px] lg:min-h-[35px]">
              <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl leading-tight tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo] underline">
                Poids du fichier :
              </span>
              <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl leading-tight tracking-[-0.03em] font-medium text-black font-[Heebo]">
                {fileSize}
              </span>
            </div>

            {/* Date d'ajout */}
            <div className="flex flex-row justify-between items-center w-full min-h-[24px] sm:min-h-[28px] md:min-h-[32px] lg:min-h-[35px]">
              <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl leading-tight tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo] underline">
                Date d&apos;ajout :
              </span>
              <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl leading-tight tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo]">
                {dateAdded}
              </span>
            </div>

            {/* Dossier */}
            <div className="flex flex-row justify-between items-center w-full min-h-[24px] sm:min-h-[28px] md:min-h-[32px] lg:min-h-[35px]">
              <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl leading-tight tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo] underline">
                Dossier :
              </span>
              <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl leading-tight tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo]">
                {folder}
              </span>
            </div>

            {/* Tags associés */}
            <div className="flex flex-row justify-between items-center w-full min-h-[24px] sm:min-h-[28px] md:min-h-[32px] lg:min-h-[35px]">
              <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl leading-tight tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo] underline">
                Tags associés :
              </span>
              <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl leading-tight tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo] text-right max-w-[50%] truncate">
                {currentTags.map(tag => `#${tag}`).join(', ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Tags Modal */}
      <EditTagsModal
        isOpen={isEditTagsOpen}
        onClose={() => setIsEditTagsOpen(false)}
        initialTags={currentTags}
        onSave={handleSaveTags}
      />
    </div>
  );
}
