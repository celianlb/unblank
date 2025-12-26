'use client';

import { Pencil, Share2, Settings, Trash } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import DeleteConfirmModal from './DeleteConfirmModal';
import FolderSettingsModal from './FolderSettingsModal';
import ShareLinkModal from './ShareLinkModal';
import RenameFolderModal from './RenameFolderModal';
import { useDeleteFolders, useRenameFolder } from '@/hooks/useFolders';
import { useAuthContext } from '@/contexts/AuthContext';

interface FolderGroupCardProps {
  id: string;
  title: string;
  itemCount: number;
  lastUpdate: string;
  images: string[];
  slug?: string;
}

export default function FolderGroupCard({ id, title, itemCount, lastUpdate, images, slug }: FolderGroupCardProps) {
  const router = useRouter();
  const { session } = useAuthContext();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  // ✅ Mutations React Query
  const deleteFolders = useDeleteFolders(session?.user?.id || '');
  const renameFolder = useRenameFolder(session?.user?.id || '');

  const handleDelete = async () => {
    try {
      // ✅ Utilise la mutation React Query qui invalide automatiquement le cache
      await deleteFolders.mutateAsync([id]);
      setIsDeleteModalOpen(false);
      // Plus besoin de router.refresh() !
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Erreur lors de la suppression du groupe');
    }
  };

  const handleRename = async (newName: string) => {
    try {
      await renameFolder.mutateAsync({ folderId: id, newName });
      setIsRenameModalOpen(false);
    } catch (error) {
      console.error('Error renaming group:', error);
      alert('Erreur lors du renommage du groupe');
    }
  };

  const handleCardClick = () => {
    // Utiliser l'ID du groupe si disponible, sinon générer un slug depuis le titre
    const groupSlug = slug || title.toLowerCase().replace(/\s+/g, '-');
    router.push(`/${groupSlug}`);
  };

  // Proxy external images to avoid CORS issues with reduced quality
  const getProxiedImageUrl = (url: string) => {
    // Only proxy external images (not localhost or relative URLs)
    if (url.startsWith('http') && !url.includes('localhost')) {
      const params = new URLSearchParams({ url });
      // Very small size and low quality for group previews
      params.set('w', '150'); // Max width 150px
      params.set('q', '60');  // Quality 60%
      return `/api/proxy-image?${params.toString()}`;
    }
    return url;
  };

  // Get up to 4 images (one from each child folder)
  const image1 = images[0] ? getProxiedImageUrl(images[0]) : null;
  const image2 = images[1] ? getProxiedImageUrl(images[1]) : null;
  const image3 = images[2] ? getProxiedImageUrl(images[2]) : null;
  const image4 = images[3] ? getProxiedImageUrl(images[3]) : null;

  return (
    <>
    <div
      onClick={handleCardClick}
      className="w-[272px] min-h-[359px] bg-[#FEF8EE] border-4 border-black rounded-[20px] shadow-[4px_4px_0px_#000000] flex-none cursor-pointer transition-shadow hover:shadow-[6px_6px_0px_#000000] box-border flex flex-col gap-4 p-3"
    >
      {/* Frame 194 - Images Grid */}
      <div className="flex flex-col gap-1.5 w-full">
        {/* Frame 187 - Top row */}
        <div className="flex flex-row gap-1.5 w-full h-[90px]">
          {/* Frame 185 - Image 1 */}
          <div className="flex-1 h-[90px] bg-[#C4C4C4] rounded-lg overflow-hidden">
            {image1 && (
              <img
                src={image1}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {/* Frame 186 - Image 2 */}
          <div className="flex-1 h-[90px] bg-[#C4C4C4] rounded-lg overflow-hidden">
            {image2 && (
              <img
                src={image2}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        {/* Frame 192 - Bottom row */}
        <div className="flex flex-row gap-1.5 w-full h-[89px]">
          {/* Frame 185 - Image 3 */}
          <div className="flex-1 h-[89px] bg-[#C4C4C4] rounded-lg overflow-hidden">
            {image3 && (
              <img
                src={image3}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {/* Frame 186 - Image 4 */}
          <div className="flex-1 h-[89px] bg-[#C4C4C4] rounded-lg overflow-hidden">
            {image4 && (
              <img
                src={image4}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <h3
        className="text-2xl leading-[30px] font-extrabold text-[#0D0D0D] break-words"
        style={{ fontFamily: 'Area Inktrap, sans-serif' }}
      >
        {title}
      </h3>

      {/* Frame 27 - Info */}
      <div className="flex flex-col gap-1">
        <p className="text-xs leading-[90%] font-normal text-[#0D0D0D] font-[Heebo]">
          {itemCount} éléments
        </p>
        <p className="text-xs leading-[90%] font-normal text-[#0D0D0D] font-[Heebo]">
          {lastUpdate}
        </p>
      </div>

      {/* Frame 192 - Action Buttons */}
      <div className="flex flex-row items-center justify-between w-full mt-auto">
        <div className="flex flex-row items-center gap-2">
          {/* Shell Icon */}
          <div className="w-8 h-8 flex items-center justify-center">
            <Image src="/shell.svg" alt="Shell" width={32} height={32} />
          </div>

          {/* Frame 173 - Edit Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRenameModalOpen(true);
            }}
            className="flex flex-row justify-center items-center p-2 w-9 h-9 bg-[#0D0D0D] rounded-lg hover:bg-black transition-colors cursor-pointer"
          >
            <Pencil className="w-5 h-5 text-[#FEF8EE]" strokeWidth={2} />
          </button>

          {/* Frame 172 - Share Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsShareModalOpen(true);
            }}
            className="flex flex-row justify-center items-center p-2 w-9 h-9 bg-[#0D0D0D] rounded-lg hover:bg-black transition-colors cursor-pointer"
          >
            <Share2 className="w-5 h-5 text-[#FEF8EE]" strokeWidth={2} />
          </button>

          {/* Frame 170 - Settings Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsSettingsModalOpen(true);
            }}
            className="flex flex-row justify-center items-center p-2 w-9 h-9 bg-[#0D0D0D] rounded-lg hover:bg-black transition-colors cursor-pointer"
          >
            <Settings className="w-5 h-5 text-[#FEF8EE]" strokeWidth={2} />
          </button>
        </div>

        {/* Frame 72 - Trash Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDeleteModalOpen(true);
          }}
          className="flex flex-row justify-center items-center p-2 w-9 h-9 bg-[#C5C5C5] rounded-lg cursor-pointer group"
        >
          <Trash className="w-5 h-5 text-black group-hover:text-[#FF5070] transition-colors" strokeWidth={2} />
        </button>
      </div>
    </div>

    <DeleteConfirmModal
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      onConfirm={handleDelete}
    />

    <FolderSettingsModal
      isOpen={isSettingsModalOpen}
      onClose={() => setIsSettingsModalOpen(false)}
      folderName={title}
    />

    <ShareLinkModal
      isOpen={isShareModalOpen}
      onClose={() => setIsShareModalOpen(false)}
    />

    <RenameFolderModal
      isOpen={isRenameModalOpen}
      onClose={() => setIsRenameModalOpen(false)}
      currentName={title}
      onRename={handleRename}
    />
    </>
  );
}
