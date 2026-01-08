'use client';

import { Link } from '@/domain/links/models/Link';
import { Link as LinkIcon } from 'lucide-react';

interface SearchResultItemProps {
  link: Link;
  folderName?: string;
}

export default function SearchResultItem({ link, folderName }: SearchResultItemProps) {

  const handleClick = () => {
    // Open the link URL in a new tab
    if (link.url) {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Truncate description
  const truncateText = (text: string | null, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-4 p-4 border-2 border-black rounded-xl hover:bg-[#FFE3E8] transition-colors cursor-pointer shadow-[2px_2px_0px_#000000] bg-white"
    >
      {/* Thumbnail/Screenshot */}
      <div className="w-20 h-20 rounded-lg border-2 border-black overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
        {link.original_image_url || link.screenshot_url ? (
          <img
            src={link.original_image_url || link.screenshot_url || ''}
            alt={link.title || 'Link preview'}
            className="w-full h-full object-cover"
          />
        ) : (
          <LinkIcon className="w-8 h-8 text-gray-400" strokeWidth={2} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <h3 className="text-base font-bold text-black truncate mb-1 font-[Heebo]">
          {link.title || link.url}
        </h3>

        {/* Description */}
        {link.description && (
          <p className="text-sm text-[#636363] mb-2 font-[Heebo] line-clamp-2">
            {truncateText(link.description, 120)}
          </p>
        )}

        {/* Footer: Folder name + Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Folder name */}
          {folderName && (
            <span className="text-xs text-[#636363] font-medium font-[Heebo] bg-gray-100 px-2 py-1 rounded-md">
              {folderName}
            </span>
          )}

          {/* Tags */}
          {link.tags && link.tags.length > 0 && (
            <div className="flex items-center gap-1.5">
              {link.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs text-black font-medium font-[Heebo] bg-[#FFE3E8] px-2 py-1 rounded-md"
                >
                  {tag.name}
                </span>
              ))}
              {link.tags.length > 3 && (
                <span className="text-xs text-[#636363] font-medium font-[Heebo]">
                  +{link.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
