'use client';

import { Trash, Copy, ExternalLink, Check } from 'lucide-react';
import { useState } from 'react';
import DeleteConfirmModal from './DeleteConfirmModal';

interface LinkCardProps {
  imageUrl?: string;
  link: string;
  tags?: string[];
  isSelectionMode?: boolean;
  onCheckChange?: (checked: boolean) => void;
}

export default function LinkCard({ imageUrl, link, tags = [], isSelectionMode = false, onCheckChange }: LinkCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckChange = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    onCheckChange?.(newValue);
  };

  // Show hover elements if in selection mode or hovering
  const showHoverElements = isSelectionMode || isChecked;

  const handleDelete = () => {
    // TODO: Logique de suppression
    console.log('Suppression confirmée');
    setIsDeleteModalOpen(false);
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

  return (
    <>
      <div className="group/card w-[272px] h-[359px] bg-[#FEF8EE] border-4 border-black rounded-[20px] shadow-[4px_4px_0px_#000000] flex-none cursor-pointer box-border relative">
        {/* Image placeholder */}
        <div className="absolute inset-0 bg-[#C4C4C4] rounded-[16px]">
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover rounded-[16px]"
            />
          )}
        </div>

        {/* Checkbox container - Frame 134: 36x30px to allow checkmark overflow */}
        <div className={`absolute left-3 top-3 w-[36px] h-[30px] ${showHoverElements ? 'flex' : 'hidden group-hover/card:flex'} flex-row items-center`}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleCheckChange();
            }}
            className={`relative w-7 h-7 ${isChecked ? 'bg-[#FEF8EE]' : 'bg-[#FEF8EE] hover:bg-[#FFE3E8]'} border-[3px] border-[#0D0D0D] rounded-lg flex items-center justify-center cursor-pointer transition-colors isolate`}
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
    </>
  );
}
