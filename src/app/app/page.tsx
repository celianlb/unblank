"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import FolderGroupCard from '@/components/FolderGroupCard';
import FolderCard from '@/components/FolderCard';
import LinkCard from '@/components/LinkCard';

export default function AppPage() {
  const router = useRouter();
  const { session, loading } = useAuthContext();
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    if (!loading && !session) {
      // Pas de session, redirection vers login
      router.push("/login");
    }
  }, [session, loading, router]);

  const handleCheckChange = (checked: boolean) => {
    setSelectedCount(prev => checked ? prev + 1 : prev - 1);
  };

  const isSelectionMode = selectedCount > 0;

  const handleDeleteSelected = () => {
    // TODO: Implement delete logic
    console.log('Deleting', selectedCount, 'items');
    setSelectedCount(0);
  };

  if (loading || !session) {
    return null; // Chargement ou redirection en cours
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <Header selectedCount={selectedCount} onDeleteSelected={handleDeleteSelected} />

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
              slug="recents"
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

        {/* Section Liens */}
        <section className="flex flex-col items-start gap-[21px] w-full">
          {/* Titre */}
          <h1
            className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
            style={{ fontFamily: 'Area Inktrap, sans-serif' }}
          >
            Liens (9)
          </h1>

          {/* Contenu des cartes */}
          <div className="flex flex-row flex-wrap gap-8 w-full">
            <LinkCard
              link="https://fr.pinterest.com/pin/123456789/"
              tags={['mascotte', 'cartoon', 'vert']}
              isSelectionMode={isSelectionMode}
              onCheckChange={handleCheckChange}
            />
            <LinkCard
              link="https://fr.pinterest.com/pin/234567890/"
              tags={['poster', 'minimal']}
              isSelectionMode={isSelectionMode}
              onCheckChange={handleCheckChange}
            />
            <LinkCard
              link="https://fr.pinterest.com/pin/345678901/"
              tags={['design', 'swiss']}
              isSelectionMode={isSelectionMode}
              onCheckChange={handleCheckChange}
            />
            <LinkCard
              link="https://fr.pinterest.com/pin/456789012/"
              tags={['street', 'nyc']}
              isSelectionMode={isSelectionMode}
              onCheckChange={handleCheckChange}
            />
            <LinkCard
              link="https://fr.pinterest.com/pin/567890123/"
              tags={['signage', 'wayfinding']}
              isSelectionMode={isSelectionMode}
              onCheckChange={handleCheckChange}
            />
            <LinkCard
              link="https://fr.pinterest.com/pin/678901234/"
              tags={['branding', 'identity']}
              isSelectionMode={isSelectionMode}
              onCheckChange={handleCheckChange}
            />
            <LinkCard
              link="https://fr.pinterest.com/pin/789012345/"
              tags={['color', 'palette']}
              isSelectionMode={isSelectionMode}
              onCheckChange={handleCheckChange}
            />
            <LinkCard
              link="https://fr.pinterest.com/pin/890123456/"
              tags={['interior', 'decor']}
              isSelectionMode={isSelectionMode}
              onCheckChange={handleCheckChange}
            />
            <LinkCard
              link="https://fr.pinterest.com/pin/901234567/"
              tags={['movie', 'poster']}
              isSelectionMode={isSelectionMode}
              onCheckChange={handleCheckChange}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

