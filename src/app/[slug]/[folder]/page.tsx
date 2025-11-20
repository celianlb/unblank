'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumb from '@/components/Breadcrumb';
import DetailedLinkCard from '@/components/DetailedLinkCard';
import ImageCard from '@/components/ImageCard';

export default function FolderPage() {
  const params = useParams();
  const groupSlug = params.slug as string;
  const folderSlug = params.folder as string;
  const [selectedCount, setSelectedCount] = useState(0);

  const handleCheckChange = (checked: boolean) => {
    setSelectedCount(prev => checked ? prev + 1 : prev - 1);
  };

  const isSelectionMode = selectedCount > 0;

  const handleDeleteSelected = () => {
    // TODO: Implement delete logic
    console.log('Deleting', selectedCount, 'items');
    setSelectedCount(0);
  };

  // Decode slugs to get names
  const groupName = decodeURIComponent(groupSlug).replace(/-/g, ' ');
  const folderName = decodeURIComponent(folderSlug).replace(/-/g, ' ');

  // Format display names
  const formatName = (name: string) => name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const displayGroupName = formatName(groupName);
  const displayFolderName = formatName(folderName);

  return (
    <div className="min-h-screen w-full bg-white">
      <Header selectedCount={selectedCount} onDeleteSelected={handleDeleteSelected} />

      <main className="w-full px-[64px] py-[40px] flex flex-col gap-16">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          groupName={displayGroupName}
          folderName={displayFolderName}
          groupSlug={groupSlug}
        />

        {/* Section Images - for icons folder */}
        {(folderSlug === 'icons') && (
          <section className="flex flex-col items-start gap-[21px] w-full">
            {/* Titre */}
            <h1
              className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              Images (2)
            </h1>

            {/* Contenu des cartes images */}
            <div className="flex flex-row flex-wrap gap-8 w-full">
              <ImageCard
                imageUrl="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop"
                link="https://unsplash.com/photos/abstract-1"
                fileType="PNG"
                dimensions="1920 x 1080"
                fileSize="2.4 MB"
                dateAdded="20/11/2024"
                folder={displayFolderName}
                tags={['icon', 'abstract']}
                isSelectionMode={isSelectionMode}
                onCheckChange={handleCheckChange}
              />
              <ImageCard
                imageUrl="https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=400&fit=crop"
                link="https://unsplash.com/photos/gradient-2"
                fileType="JPG"
                dimensions="3840 x 2160"
                fileSize="4.1 MB"
                dateAdded="19/11/2024"
                folder={displayFolderName}
                tags={['icon', 'gradient']}
                isSelectionMode={isSelectionMode}
                onCheckChange={handleCheckChange}
              />
            </div>
          </section>
        )}

        {/* Section Liens - only for fonderies folder */}
        {folderSlug === 'fonderies' && (
          <section className="flex flex-col items-start gap-[21px] w-full">
            {/* Titre */}
            <h1
              className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              Liens (2)
            </h1>

            {/* Contenu des cartes liens */}
            <div className="flex flex-row flex-wrap gap-8 w-full">
              <DetailedLinkCard
                siteName="Google font"
                siteUrl="fonts.google.com"
                description="Premium image generation and editing tool. Store and share your own styles, create, fine-tune, upscale, and perfect your visuals."
                link="https://www.fonts.google.com/"
                tags={['font', 'gratuite', 'web']}
              />
              <DetailedLinkCard
                siteName="Pousse ta fonte"
                siteUrl="poussetafonte.com"
                description="Premium image generation and editing tool. Store and share your own styles, create, fine-tune, upscale, and perfect your visuals."
                link="https://www.fonts.google.com/"
                tags={['font', 'gratuite', 'web']}
              />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
