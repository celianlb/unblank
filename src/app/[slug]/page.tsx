'use client';

import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumb from '@/components/Breadcrumb';
import FolderCard from '@/components/FolderCard';

export default function GroupPage() {
  const params = useParams();
  const slug = params.slug as string;

  // Decode the slug to get the group name
  const groupName = decodeURIComponent(slug).replace(/-/g, ' ');

  // Format the display name (capitalize first letter of each word)
  const displayName = groupName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="min-h-screen w-full bg-white">
      <Header />

      <main className="w-full px-[64px] py-[40px] flex flex-col gap-16">
        {/* Breadcrumb Navigation */}
        <Breadcrumb groupName={displayName} />

        {/* Section Dossiers */}
        <section className="flex flex-col items-start gap-[21px] w-full">
          {/* Titre */}
          <h1
            className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
            style={{ fontFamily: 'Area Inktrap, sans-serif' }}
          >
            Dossiers (2)
          </h1>

          {/* Contenu des cartes */}
          <div className="flex flex-row flex-wrap gap-8 w-full">
            <FolderCard
              title="Fonderies"
              itemCount={6}
              lastUpdate="Mise à jour il y a 1min"
            />
            <FolderCard
              title="Icons"
              itemCount={6}
              lastUpdate="Mise à jour il y a 1min"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
