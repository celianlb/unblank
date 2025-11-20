'use client';

import { Trash2, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import DeleteConfirmModal from './DeleteConfirmModal';

interface LinkCardProps {
  imageUrl?: string;
  link: string;
  tags?: string[];
}

export default function LinkCard({ imageUrl, link, tags = [] }: LinkCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
      <div className="group w-[272px] h-[359px] bg-[#FEF8EE] border-4 border-black rounded-[20px] shadow-[4px_4px_0px_#000000] flex-none cursor-pointer box-border relative overflow-hidden">
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

        {/* Checkbox - hidden by default, shown on hover */}
        <div className="absolute left-3 top-3 w-7 h-7 bg-[#FEF8EE] border-[3px] border-[#0D0D0D] rounded-lg hidden group-hover:flex items-center justify-center">
        </div>

        {/* Delete button - hidden by default, shown on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDeleteModalOpen(true);
          }}
          className="absolute right-3 top-3 hidden group-hover:flex flex-row justify-center items-center p-2 w-9 h-9 bg-[#C5C5C5] rounded-lg cursor-pointer"
        >
          <Trash2 className="w-5 h-5 text-black hover:text-[#FF5070] transition-colors" strokeWidth={2} />
        </button>

        {/* Tags - hidden by default, shown on hover */}
        {tags.length > 0 && (
          <div className="absolute left-3 bottom-[61px] hidden group-hover:flex flex-row gap-1">
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
        <div className="absolute left-3 right-3 bottom-3 hidden group-hover:flex flex-row justify-center items-center p-2.5 gap-2.5 bg-[#FEF8EE] border-2 border-black rounded-lg">
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
