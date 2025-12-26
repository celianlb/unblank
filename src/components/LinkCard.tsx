'use client';

import { Trash, Copy, ExternalLink, Check } from 'lucide-react';
import { useState } from 'react';
import DeleteConfirmModal from './DeleteConfirmModal';
import ImagePreviewModal from './ImagePreviewModal';

interface LinkCardProps {
  id?: string;
  imageUrl?: string;
  link: string;
  title?: string;
  description?: string;
  tags?: string[];
  fileType?: string;
  dimensions?: string;
  fileSize?: string;
  dateAdded?: string;
  folder?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onCheckChange?: (id: string, checked: boolean) => void;
  onDelete?: (id: string) => void;
}

export default function LinkCard({
  id,
  imageUrl,
  link,
  title = '',
  description = '',
  tags = [],
  fileType = 'JPG',
  dimensions = '615×856 px',
  fileSize = '2,3 Mo',
  dateAdded = new Date().toLocaleDateString('fr-FR'),
  folder = 'Affiche horreur',
  isSelectionMode = false,
  isSelected = false,
  onCheckChange,
  onDelete
}: LinkCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Proxy external images to avoid CORS issues
  const getProxiedImageUrl = (url?: string, size?: 'thumbnail' | 'full') => {
    if (!url) return undefined;
    // Only proxy external images (not localhost or relative URLs)
    if (url.startsWith('http') && !url.includes('localhost')) {
      const params = new URLSearchParams({ url });

      // Add size params for thumbnails (save bandwidth)
      if (size === 'thumbnail') {
        params.set('w', '400'); // Max width 400px for cards
        params.set('q', '75');  // Quality 75% for thumbnails
      }

      return `/api/proxy-image?${params.toString()}`;
    }
    return url;
  };

  const thumbnailUrl = getProxiedImageUrl(imageUrl, 'thumbnail');
  const fullSizeUrl = getProxiedImageUrl(imageUrl, 'full');

  const handleCheckChange = () => {
    const newValue = !isSelected;
    if (id) {
      onCheckChange?.(id, newValue);
    }
  };

  // Show hover elements if in selection mode or hovering
  const showHoverElements = isSelectionMode || isSelected;

  const handleDelete = async () => {
    if (!id) return;

    try {
      setIsDeleteModalOpen(false);

      // Si un callback onDelete est fourni, l'utiliser (React Query)
      if (onDelete) {
        onDelete(id);
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('Erreur lors de la suppression du lien');
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(link);
  };

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(link, '_blank');
  };

  // Truncate link for display
  const displayLink = link.length > 25 ? link.substring(0, 25) + '...' : link;

  const handleCardClick = () => {
    if (isSelectionMode) {
      // En mode sélection, cliquer sur la carte toggle la checkbox
      handleCheckChange();
    } else {
      // Sinon, ouvrir la preview
      setIsPreviewModalOpen(true);
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group/card w-full sm:w-[200px] md:w-[230px] lg:w-[250px] xl:w-[272px] h-[280px] sm:h-[300px] md:h-[330px] lg:h-[345px] xl:h-[359px] bg-[#FEF8EE] border-3 sm:border-4 border-black rounded-2xl sm:rounded-[20px] shadow-[3px_3px_0px_#000000] sm:shadow-[4px_4px_0px_#000000] flex-none cursor-pointer box-border relative"
      >
        {/* Image placeholder */}
        <div className="absolute inset-0 bg-[#C4C4C4] rounded-xl sm:rounded-[16px]">
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl sm:rounded-[16px]"
            />
          )}
        </div>

        {/* Checkbox container - Frame 134: 36x30px to allow checkmark overflow */}
        <div className={`absolute left-2 sm:left-3 top-2 sm:top-3 w-[30px] sm:w-[36px] h-[26px] sm:h-[30px] ${showHoverElements ? 'flex' : 'hidden group-hover/card:flex'} flex-row items-center`}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleCheckChange();
            }}
            className={`relative w-6 h-6 sm:w-7 sm:h-7 ${isSelected ? 'bg-[#FEF8EE]' : 'bg-[#FEF8EE] hover:bg-[#FFE3E8]'} border-2 sm:border-[3px] border-[#0D0D0D] rounded-md sm:rounded-lg flex items-center justify-center cursor-pointer transition-colors isolate`}
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

        {/* Delete button - hidden by default, shown on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDeleteModalOpen(true);
          }}
          className={`absolute right-3 top-3 ${showHoverElements ? 'flex' : 'hidden group-hover/card:flex'} flex-row justify-center items-center p-2 w-9 h-9 bg-[#C5C5C5] rounded-lg cursor-pointer`}
        >
          <Trash className="w-5 h-5 text-black hover:text-[#FF5070] transition-colors" strokeWidth={2} />
        </button>

        {/* Tags - hidden by default, shown on hover */}
        {tags.length > 0 && (
          <div className={`absolute left-3 bottom-[61px] ${showHoverElements ? 'flex' : 'hidden group-hover/card:flex'} flex-row gap-1`}>
            {tags.map((tag, index) => (
              <div
                key={index}
                className="flex flex-row justify-center items-center px-2 py-1 bg-[#FEF8EE] border-2 border-black rounded-lg"
              >
                <span className="text-sm leading-[21px] tracking-[-0.03em] text-[#0D0D0D] font-[Heebo]">
                  #{tag}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Link bar - hidden by default, shown on hover */}
        <div className={`absolute left-3 right-3 bottom-3 ${showHoverElements ? 'flex' : 'hidden group-hover/card:flex'} flex-row justify-center items-center p-2.5 gap-2.5 bg-[#FEF8EE] border-2 border-black rounded-lg`}>
          <span className="flex-1 text-sm leading-[21px] tracking-[-0.03em] text-[#0D0D0D] font-[Heebo] truncate">
            {displayLink}
          </span>
          <button onClick={handleCopy} className="w-5 h-5 flex items-center justify-center">
            <Copy className="w-5 h-5 text-[#0D0D0D]" strokeWidth={2} />
          </button>
          <button onClick={handleOpenLink} className="w-5 h-5 flex items-center justify-center">
            <ExternalLink className="w-5 h-5 text-[#0D0D0D]" strokeWidth={2} />
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
        imageUrl={fullSizeUrl || 'https://via.placeholder.com/600'}
        link={link}
        fileType={fileType}
        dimensions={dimensions}
        fileSize={fileSize}
        dateAdded={dateAdded}
        folder={folder}
        tags={tags}
      />
    </>
  );
}
