'use client';

import Header from '@/components/Header';
import FolderGroupCard from '@/components/FolderGroupCard';
import FolderCard from '@/components/FolderCard';

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-white">
      <Header />

      <main className="w-full px-[22px] py-[22px] flex flex-col gap-16">
        {/* Section Groupe de dossier */}
        <section className="flex flex-col items-start gap-[21px] w-full">
          {/* Titre */}
          <h1
            className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
            style={{ fontFamily: 'Area Inktrap, sans-serif' }}
          >
            Groupe de dossier (1)
          </h1>

          {/* Contenu des cartes */}
          <div className="flex flex-row flex-wrap gap-8 w-full">
            <FolderGroupCard
              title="Graphic tools"
              itemCount={6}
              lastUpdate="Mise à jour il y a 1min"
              images={['image1', 'image2', 'image3', 'image4']}
            />
          </div>
        </section>

        {/* Section Dossiers */}
        <section className="flex flex-col items-start gap-[21px] w-full">
          {/* Titre */}
          <h1
            className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
            style={{ fontFamily: 'Area Inktrap, sans-serif' }}
          >
            Dossiers (3)
          </h1>

          {/* Contenu des cartes */}
          <div className="flex flex-row flex-wrap gap-8 w-full">
            <FolderCard
              title="Récents"
              itemCount={6}
              lastUpdate="Mise à jour il y a 1min"
            />
            <FolderCard
              title="Inspis graphique"
              itemCount={8}
              lastUpdate="Mise à jour il y a 1min"
            />
            <FolderCard
              title="Grid"
              itemCount={6}
              lastUpdate="Mise à jour il y a 1min"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
