"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import FolderGroupCard from '@/components/FolderGroupCard';
import FolderCard from '@/components/FolderCard';
import LinkCard from '@/components/LinkCard';
import { FolderService, type Folder } from '@/domain/folders/services/FolderService';
import { LinkService } from '@/domain/links/services/LinkService';

export default function AppPage() {
  const router = useRouter();
  const { session, loading } = useAuthContext();
  const [selectedLinkIds, setSelectedLinkIds] = useState<Set<string>>(new Set());
  const [folders, setFolders] = useState<Folder[]>([]);
  const [groups, setGroups] = useState<Folder[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !session) {
      // Pas de session, redirection vers login
      router.push("/login");
    }
  }, [session, loading, router]);

  useEffect(() => {
    if (session?.user?.id) {
      loadFoldersData();
    }
  }, [session?.user?.id]);

  const loadFoldersData = async () => {
    if (!session?.user?.id) return;

    setLoadingData(true);
    try {
      const [foldersData, groupsData] = await Promise.all([
        FolderService.getUserFolders(session.user.id),
        FolderService.getUserGroups(session.user.id),
      ]);

      setFolders(foldersData);
      setGroups(groupsData);
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCheckChange = (id: string, checked: boolean) => {
    setSelectedLinkIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const isSelectionMode = selectedLinkIds.size > 0;

  const handleDeleteSelected = async () => {
    if (selectedLinkIds.size === 0) return;

    try {
      const success = await LinkService.deleteLinks(Array.from(selectedLinkIds));

      if (success) {
        // Réinitialiser la sélection
        setSelectedLinkIds(new Set());
        // Rafraîchir la page pour voir les changements
        router.refresh();
      } else {
        alert('Erreur lors de la suppression des liens');
      }
    } catch (error) {
      console.error('Error deleting links:', error);
      alert('Erreur lors de la suppression des liens');
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen w-full bg-white">
        <Header selectedCount={selectedLinkIds.size} onDeleteSelected={handleDeleteSelected} />
        <main className="w-full px-[22px] py-[22px] flex items-center justify-center">
          <p className="text-gray-500">Chargement...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <Header selectedCount={selectedLinkIds.size} onDeleteSelected={handleDeleteSelected} />

      <main className="w-full px-[22px] py-[22px] flex flex-col gap-16">
        {/* Section Groupe de dossier */}
        {groups.length > 0 && (
          <section className="flex flex-col items-start gap-[21px] w-full">
            {/* Titre */}
            <h1
              className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              Groupe de dossier ({groups.length})
            </h1>

            {/* Contenu des cartes */}
            <div className="flex flex-row flex-wrap gap-8 w-full">
              {groups.map((group) => (
                <FolderGroupCard
                  key={group.id}
                  id={group.id}
                  title={group.name}
                  slug={group.slug}
                  itemCount={group.link_count || 0}
                  lastUpdate={FolderService.formatLastUpdate(group.updated_at)}
                  images={['image1', 'image2', 'image3', 'image4']}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section Dossiers */}
        {folders.length > 0 && (
          <section className="flex flex-col items-start gap-[21px] w-full">
            {/* Titre */}
            <h1
              className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              Dossiers ({folders.length})
            </h1>

            {/* Contenu des cartes */}
            <div className="flex flex-row flex-wrap gap-8 w-full">
              {folders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  id={folder.id}
                  title={folder.name}
                  slug={folder.slug}
                  itemCount={folder.link_count || 0}
                  lastUpdate={FolderService.formatLastUpdate(folder.updated_at)}
                />
              ))}
            </div>
          </section>
        )}

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
              id="mock-1"
              link="https://fr.pinterest.com/pin/123456789/"
              tags={['mascotte', 'cartoon', 'vert']}
              isSelectionMode={isSelectionMode}
              onCheckChange={handleCheckChange}
            />
            <LinkCard
              id="mock-2"
              link="https://fr.pinterest.com/pin/234567890/"
              tags={['poster', 'minimal']}
              isSelectionMode={isSelectionMode}
              onCheckChange={handleCheckChange}
            />
            <LinkCard
              id="mock-3"
              link="https://fr.pinterest.com/pin/345678901/"
              tags={['design', 'swiss']}
              isSelectionMode={isSelectionMode}
              onCheckChange={handleCheckChange}
            />
            <LinkCard
              id="mock-4"
              link="https://fr.pinterest.com/pin/456789012/"
              tags={['street', 'nyc']}
              isSelectionMode={isSelectionMode}
              onCheckChange={handleCheckChange}
            />
            <LinkCard
              id="mock-5"
              link="https://fr.pinterest.com/pin/567890123/"
              tags={['signage', 'wayfinding']}
              isSelectionMode={isSelectionMode}
              onCheckChange={handleCheckChange}
            />
            <LinkCard
              id="mock-6"
              link="https://fr.pinterest.com/pin/678901234/"
              tags={['branding', 'identity']}
              isSelectionMode={isSelectionMode}
              onCheckChange={handleCheckChange}
            />
            <LinkCard
              id="mock-7"
              link="https://fr.pinterest.com/pin/789012345/"
              tags={['color', 'palette']}
              isSelectionMode={isSelectionMode}
              onCheckChange={handleCheckChange}
            />
            <LinkCard
              id="mock-8"
              link="https://fr.pinterest.com/pin/890123456/"
              tags={['interior', 'decor']}
              isSelectionMode={isSelectionMode}
              onCheckChange={handleCheckChange}
            />
            <LinkCard
              id="mock-9"
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

