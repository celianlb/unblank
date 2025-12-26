"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import FolderGroupCard from '@/components/FolderGroupCard';
import FolderCard from '@/components/FolderCard';
import LinkCard from '@/components/LinkCard';
import { useFolders, useGroups } from '@/domain/folders/hooks/useFolders';
import { useDeleteLinks, useDeleteLink, useInfiniteUserLinks } from '@/domain/links/hooks/useLinks';
import { LinkService } from '@/domain/links/services/LinkService';
import { formatLastUpdate, formatDateAdded } from '@/utils/formatters';

export default function AppPage() {
  const router = useRouter();
  const { session, loading } = useAuthContext();
  const [selectedLinkIds, setSelectedLinkIds] = useState<Set<string>>(new Set());
  const [loadMoreElement, setLoadMoreElement] = useState<HTMLDivElement | null>(null);

  // ✅ Utilisation de React Query pour le cache et auto-refresh
  const { data: folders = [], isLoading: loadingFolders } = useFolders(session?.user?.id);
  const { data: groups = [], isLoading: loadingGroups } = useGroups(session?.user?.id);

  // ✅ Infinite scroll avec pagination (12 liens par page)
  const {
    data: linksData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingLinks,
  } = useInfiniteUserLinks(session?.user?.id, 12);

  const deleteLinks = useDeleteLinks();
  const deleteLink = useDeleteLink(session?.user?.id);

  // Flatten les pages en un seul array
  const userLinks = linksData?.pages.flatMap(page => page.links) || [];

  const loadingData = loadingFolders || loadingGroups;
  const isSelectionMode = selectedLinkIds.size > 0;

  // ✅ Trier les dossiers : dossiers système (Récents) en premier, puis les autres
  const sortedFolders = [...folders].sort((a, b) => {
    // Les dossiers système (is_system = true) viennent en premier
    if (a.is_system && !b.is_system) return -1;
    if (!a.is_system && b.is_system) return 1;
    // Pour les autres, garder l'ordre par position
    return (a.position || 0) - (b.position || 0);
  });

  useEffect(() => {
    if (!loading && !session) {
      // Pas de session, redirection vers login
      router.push("/login");
    }
  }, [session, loading, router]);

  // ✅ Infinite scroll: charger plus au scroll
  useEffect(() => {
    if (!loadMoreElement || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.disconnect();
    };
  }, [loadMoreElement, fetchNextPage, hasNextPage, isFetchingNextPage, userLinks.length]);

  // ✅ Désélectionner en cliquant hors des cartes
  useEffect(() => {
    if (!isSelectionMode) return;

    const handleClickOutsideCards = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Si on ne clique pas sur une carte (LinkCard), désélectionner
      if (!target.closest('.group\\/card')) {
        setSelectedLinkIds(new Set());
      }
    };

    document.addEventListener('click', handleClickOutsideCards);
    return () => {
      document.removeEventListener('click', handleClickOutsideCards);
    };
  }, [isSelectionMode]);

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

  const handleDeleteSelected = async () => {
    if (selectedLinkIds.size === 0) return;

    try {
      // ✅ Utilise la mutation React Query qui invalide automatiquement le cache
      await deleteLinks.mutateAsync(Array.from(selectedLinkIds));

      // Réinitialiser la sélection
      setSelectedLinkIds(new Set());
      // Plus besoin de router.refresh() - React Query invalide automatiquement le cache !
    } catch (error) {
      console.error('Error deleting links:', error);
      alert('Erreur lors de la suppression des liens');
    }
  };

  if (loading) {
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
        {loadingGroups ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-500">Chargement des groupes...</p>
          </div>
        ) : groups.length > 0 ? (
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
                  lastUpdate={formatLastUpdate(group.updated_at)}
                  images={['image1', 'image2', 'image3', 'image4']}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Section Dossiers */}
        {loadingFolders ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-500">Chargement des dossiers...</p>
          </div>
        ) : sortedFolders.length > 0 ? (
          <section className="flex flex-col items-start gap-[21px] w-full">
            {/* Titre */}
            <h1
              className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              Dossiers ({sortedFolders.length})
            </h1>

            {/* Contenu des cartes */}
            <div className="flex flex-row flex-wrap gap-8 w-full">
              {sortedFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  id={folder.id}
                  title={folder.name}
                  slug={folder.slug}
                  itemCount={folder.link_count || 0}
                  lastUpdate={formatLastUpdate(folder.updated_at)}
                  isSystem={folder.is_system}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Section Liens récents */}
        {loadingLinks ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-500">Chargement des liens...</p>
          </div>
        ) : userLinks.length > 0 ? (
          <section className="flex flex-col items-start gap-[21px] w-full">
            {/* Titre */}
            <h1
              className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              Liens récents ({userLinks.length})
            </h1>

            {/* Contenu des cartes */}
            <div className="flex flex-row flex-wrap gap-8 w-full">
              {userLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  id={link.id}
                  imageUrl={link.screenshot_url || link.original_image_url || undefined}
                  link={link.url}
                  title={link.title || ''}
                  description={link.description || ''}
                  tags={link.tags?.map(t => t.name) || []}
                  fileType={link.image_format || 'JPG'}
                  dateAdded={formatDateAdded(link.created_at)}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedLinkIds.has(link.id)}
                  onCheckChange={handleCheckChange}
                  onDelete={(id) => deleteLink.mutate(id)}
                />
              ))}
            </div>

            {/* Infinite scroll trigger */}
            {hasNextPage && (
              <div ref={setLoadMoreElement} className="w-full flex items-center justify-center py-8 min-h-[100px]">
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-3 border-[#FF506F] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Chargement...</p>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}

