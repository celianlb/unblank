'use client';

import { Pencil, Share2, Settings, Trash } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DeleteConfirmModal from './DeleteConfirmModal';
import FolderSettingsModal from './FolderSettingsModal';
import ShareLinkModal from './ShareLinkModal';
import RenameFolderModal from './RenameFolderModal';

interface FolderCardProps {
  title: string;
  itemCount: number;
  lastUpdate: string;
  groupSlug: string;
}

export default function FolderCard({ title, itemCount, lastUpdate, groupSlug }: FolderCardProps) {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  const handleCardClick = () => {
    const folderSlug = title.toLowerCase().replace(/\s+/g, '-');
    router.push(`/${encodeURIComponent(groupSlug)}/${encodeURIComponent(folderSlug)}`);
  };

  const handleDelete = () => {
    // TODO: Logique de suppression
    console.log('Suppression confirmée');
    setIsDeleteModalOpen(false);
  };

  const handleRename = (newName: string) => {
    // TODO: Logique de renommage
    console.log('Nouveau nom:', newName);
  };

  return (
    <>
    <div
      onClick={handleCardClick}
      className="w-[272px] h-[359px] bg-[#FEF8EE] border-4 border-black rounded-[20px] flex-none cursor-pointer transition-shadow hover:shadow-[4px_4px_0px_#000000] box-border flex flex-col gap-4 p-3"
    >
      {/* Frame 187 - Images Grid (2 images side by side) */}
      <div className="flex flex-row gap-2 w-full h-[185px]">
        {/* Frame 185 - Image 1 */}
        <div className="flex-1 h-[185px] bg-[#C4C4C4] rounded-lg">
        </div>
        {/* Frame 186 - Image 2 */}
        <div className="flex-1 h-[185px] bg-[#C4C4C4] rounded-lg">
        </div>
      </div>

      {/* Title */}
      <h3
        className="text-2xl leading-[30px] font-extrabold text-[#0D0D0D]"
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

      {/* Action Buttons */}
      <div className="flex flex-row items-center justify-between w-full mt-auto">
        <div className="flex flex-row items-center gap-2">
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
