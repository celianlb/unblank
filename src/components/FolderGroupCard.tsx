'use client';

import { Pencil, Share2, Settings, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import DeleteConfirmModal from './DeleteConfirmModal';
import FolderSettingsModal from './FolderSettingsModal';
import ShareLinkModal from './ShareLinkModal';
import RenameFolderModal from './RenameFolderModal';

interface FolderGroupCardProps {
  title: string;
  itemCount: number;
  lastUpdate: string;
  images: string[];
}

export default function FolderGroupCard({ title, itemCount, lastUpdate, images }: FolderGroupCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

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
    <div className="relative w-[272px] h-[359px] bg-[#FEF8EE] border-4 border-black rounded-[20px] shadow-[4px_4px_0px_#000000] flex-none cursor-pointer transition-shadow hover:shadow-[6px_6px_0px_#000000] box-border">
      {/* Frame 194 - Images Grid */}
      <div className="absolute w-[248px] h-[185px] left-3 top-3">
        {/* Frame 187 - Top row */}
        <div className="absolute flex flex-row justify-center items-center p-0 gap-1.5 w-[248px] h-[90px] left-0 top-0">
          {/* Frame 185 - Image 1 */}
          <div className="w-[120px] h-[90px] rounded-lg overflow-hidden flex-none order-0">
            {images[0] && (
              <div className="w-full h-full bg-gradient-to-br from-red-400 to-gray-700 rounded-full" />
            )}
          </div>
          {/* Frame 186 - Image 2 */}
          <div className="w-[122px] h-[90px] bg-orange-500 rounded-lg overflow-hidden flex items-center justify-center flex-none order-1 border-2 border-black">
            <span className="text-4xl">📁</span>
          </div>
        </div>

        {/* Frame 192 - Bottom row */}
        <div className="absolute flex flex-row justify-center items-center p-0 gap-1.5 w-[248px] h-[89px] left-0 top-24">
          {/* Frame 185 - Image 3 */}
          <div className="w-[120px] h-[89px] rounded-lg overflow-hidden flex-none order-0">
            {images[2] && (
              <div className="w-full h-full bg-gradient-to-br from-yellow-400 via-blue-500 to-green-500" />
            )}
          </div>
          {/* Frame 186 - Image 4 with badge */}
          <div className="relative w-[122px] h-[89px] bg-gray-200 rounded-lg overflow-hidden flex-none order-1">
            {/* Frame 193 - Badge +5 */}
            <div className="absolute flex flex-row justify-center items-center left-[86.88px] top-[32px] w-[27.56px] h-[24.56px] bg-[#FEF8EE] border-[0.72px] border-black rounded-[5.78px] box-border">
              <span className="w-4 h-[13px] text-[14.45px] leading-[90%] font-normal text-[#0D0D0D] font-[Heebo] flex-none order-0">+5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inspis graphique - Title */}
      <h3
        className="absolute w-[248px] h-[30px] left-3 top-[201px] text-2xl leading-[30px] font-extrabold text-[#0D0D0D]"
        style={{ fontFamily: 'Area Inktrap, sans-serif' }}
      >
        {title}
      </h3>

      {/* Frame 27 - Info */}
      <div className="absolute flex flex-col items-start p-0 gap-1 w-[192px] h-[26px] left-3 top-[269px]">
        <p className="w-[192px] h-[11px] text-xs leading-[90%] font-normal text-[#0D0D0D] font-[Heebo] flex-none order-0 self-stretch">
          {itemCount} éléments
        </p>
        <p className="w-[192px] h-[11px] text-xs leading-[90%] font-normal text-[#0D0D0D] font-[Heebo] flex-none order-1 self-stretch">
          {lastUpdate}
        </p>
      </div>

      {/* Frame 192 - Action Buttons */}
      <div className="absolute flex flex-row items-center justify-start p-0 gap-2 w-[164px] h-9 left-3 top-[311px]">
        {/* Shell Icon */}
        <div className="w-8 h-8 flex items-center justify-center flex-none">
          <Image src="/shell.svg" alt="Shell" width={32} height={32} />
        </div>

        {/* Frame 173 - Edit Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsRenameModalOpen(true);
          }}
          className="flex flex-row justify-center items-center p-2 gap-1.5 w-9 h-9 bg-[#0D0D0D] rounded-lg flex-none hover:bg-black transition-colors cursor-pointer"
        >
          <Pencil className="w-5 h-5 text-[#FEF8EE]" strokeWidth={2} />
        </button>

        {/* Frame 172 - Share Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsShareModalOpen(true);
          }}
          className="flex flex-row justify-center items-center p-2 gap-1.5 w-9 h-9 bg-[#0D0D0D] rounded-lg flex-none hover:bg-black transition-colors cursor-pointer"
        >
          <Share2 className="w-5 h-5 text-[#FEF8EE]" strokeWidth={2} />
        </button>

        {/* Frame 170 - Settings Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsSettingsModalOpen(true);
          }}
          className="flex flex-row justify-center items-center p-2 gap-1.5 w-9 h-9 bg-[#0D0D0D] rounded-lg flex-none hover:bg-black transition-colors cursor-pointer"
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
        className="absolute flex flex-row justify-center items-center p-2 gap-1 w-9 h-9 right-3 top-[311px] bg-[#C5C5C5] rounded-lg cursor-pointer group"
      >
        <Trash2 className="w-5 h-5 text-black group-hover:text-[#FF5070] transition-colors flex-none" strokeWidth={2} />
      </button>
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
