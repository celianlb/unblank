'use client';

import { UnifiedSearchResultItem as SearchResult } from '@/domain/search/models/SearchResult';
import { Link as LinkIcon, Folder, FolderTree, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UnifiedSearchResultItemProps {
  result: SearchResult;
}

export default function UnifiedSearchResultItem({ result }: UnifiedSearchResultItemProps) {
  const router = useRouter();

  const handleClick = () => {
    if (result.result_type === 'link' && result.url) {
      // Open link in new tab
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } else if (result.result_type === 'folder') {
      // Navigate to folder page
      const folderSlug = result.slug || result.name.toLowerCase().replace(/\s+/g, '-');
      if (result.parent_slug) {
        // Dossier dans un groupe : /{groupSlug}/{folderSlug}
        router.push(`/${result.parent_slug}/${folderSlug}`);
      } else {
        // Dossier standalone : /app/{folderSlug}
        router.push(`/app/${folderSlug}`);
      }
    } else if (result.result_type === 'group') {
      // Navigate to group page : /{groupSlug}
      const groupSlug = result.slug || result.name.toLowerCase().replace(/\s+/g, '-');
      router.push(`/${groupSlug}`);
    }
  };

  // Truncate description
  const truncateText = (text: string | null | undefined, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Get icon based on result type
  const getIcon = () => {
    if (result.result_type === 'group') {
      return <FolderTree className="w-8 h-8 text-gray-400" strokeWidth={2} />;
    }
    if (result.result_type === 'folder') {
      return <Folder className="w-8 h-8 text-gray-400" strokeWidth={2} />;
    }
    return <LinkIcon className="w-8 h-8 text-gray-400" strokeWidth={2} />;
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-4 p-4 border-2 border-black rounded-xl hover:bg-[#FFE3E8] transition-colors cursor-pointer shadow-[2px_2px_0px_#000000] bg-white"
    >
      {/* Thumbnail/Screenshot/Icon */}
      <div className="w-20 h-20 rounded-lg border-2 border-black overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
        {result.result_type === 'link' && (result.screenshot_url) ? (
          <img
            src={result.screenshot_url}
            alt={result.name || 'Preview'}
            className="w-full h-full object-cover"
          />
        ) : (
          getIcon()
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title/Name */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-base font-bold text-black truncate font-[Heebo]">
            {result.name}
          </h3>
          {/* Badge pour le type */}
          {result.result_type !== 'link' && (
            <>
              <span className="text-xs px-2 py-0.5 rounded-md bg-black text-white font-medium font-[Heebo]">
                {result.result_type === 'group' ? 'Groupe' : 'Dossier'}
              </span>
              {/* Icône de partage si le dossier/groupe est partagé */}
              {result.is_shared && (
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FF6B6B] border-2 border-black shadow-[1px_1px_0px_#000000]">
                  <Share2 className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
                </span>
              )}
            </>
          )}
        </div>

        {/* Description (for links only) */}
        {result.result_type === 'link' && result.description && (
          <p className="text-sm text-[#636363] mb-2 font-[Heebo] line-clamp-2">
            {truncateText(result.description, 120)}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Folder name for links */}
          {result.result_type === 'link' && result.folder_name && (
            <span className="text-xs text-[#636363] font-medium font-[Heebo] bg-gray-100 px-2 py-1 rounded-md">
              {result.folder_name}
            </span>
          )}

          {/* Link count for folders/groups */}
          {(result.result_type === 'folder' || result.result_type === 'group') && (
            <span className="text-xs text-[#636363] font-medium font-[Heebo] bg-gray-100 px-2 py-1 rounded-md">
              {result.link_count} {result.link_count > 1 ? 'liens' : 'lien'}
            </span>
          )}

          {/* Tags (for links) */}
          {result.result_type === 'link' && result.tags && result.tags.length > 0 && (
            <div className="flex items-center gap-1.5">
              {result.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs text-black font-medium font-[Heebo] bg-[#FFE3E8] px-2 py-1 rounded-md"
                >
                  {tag.name}
                </span>
              ))}
              {result.tags.length > 3 && (
                <span className="text-xs text-[#636363] font-medium font-[Heebo]">
                  +{result.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
