'use client';

import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumb from '@/components/Breadcrumb';
import DetailedLinkCard from '@/components/DetailedLinkCard';

export default function FolderPage() {
  const params = useParams();
  const groupSlug = params.slug as string;
  const folderSlug = params.folder as string;

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
      <Header />

      <main className="w-full px-[64px] py-[40px] flex flex-col gap-16">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          groupName={displayGroupName}
          folderName={displayFolderName}
          groupSlug={groupSlug}
        />

        {/* Links Grid */}
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
      </main>
    </div>
  );
}
