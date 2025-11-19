'use client';

import Header from '@/components/Header';
import FolderGroupCard from '@/components/FolderGroupCard';

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-white">
      <Header />

      <main className="w-full px-[22px] py-[22px]">
        {/* lineContent - Première section */}
        <section className="flex flex-col items-start gap-[21px] w-full">
          {/* Frame 172 - Titre */}
          <h1
            className="w-[320px] h-[43px] text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
            style={{ fontFamily: 'Area Inktrap, sans-serif' }}
          >
            Groupe de dossier (1)
          </h1>

          {/* Frame 184 - Contenu des cartes */}
          <div className="flex flex-row items-center gap-1.5 w-full overflow-x-auto pb-2">
            <FolderGroupCard
              title="Graphic tools"
              itemCount={6}
              lastUpdate="Mise à jour il y a 1min"
              images={['image1', 'image2', 'image3', 'image4']}
            />
            {/* Ajouter d'autres cartes ici */}
          </div>
        </section>
      </main>
    </div>
  );
}
