"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import FolderGroupCard from '@/components/FolderGroupCard';
import FolderCard from '@/components/FolderCard';
import LinkCard from '@/components/LinkCard';
import { useFolders, useGroups } from '@/hooks/useFolders';
import { useDeleteLinks, useDeleteLink, useInfiniteUserLinks } from '@/hooks/useLinks';
import { useSharedFolders } from '@/hooks/useSharedFolders';
import { useFolderShares } from '@/hooks/useShares';
import { LinkService } from '@/domain/links/services/LinkService';
import { formatLastUpdate, formatDateAdded } from '@/utils/formatters';

// Helper component to render FolderCard with permission checking
function SharedFolderCard({ folder, currentUserEmail, currentUserId }: { folder: any; currentUserEmail: string | undefined; currentUserId: string | undefined }) {
  const { data: shares = [], isLoading: isLoadingShares } = useFolderShares(folder.id);

  const currentUserShare = shares.find((share: any) =>
    share.user?.email === currentUserEmail
  );

  const canDelete = !isLoadingShares && (shares.length === 0 || currentUserShare?.permission === 'edit' || currentUserShare?.permission === 'owner');

  // Le dossier appartient à l'utilisateur actuel si son user_id correspond
  const isOwned = folder.user_id === currentUserId;

  return (
    <FolderCard
      key={folder.id}
      id={folder.id}
      title={folder.name}
      slug={folder.slug}
      itemCount={folder.link_count || 0}
      lastUpdate={formatLastUpdate(folder.updated_at)}
      isSystem={false}
      previewImages={folder.preview_images}
      canDelete={canDelete}
      isShared={true}
      isOwned={isOwned}
    />
  );
}

// Helper component to render FolderGroupCard with permission checking
function SharedGroupCard({ group, currentUserEmail }: { group: any; currentUserEmail: string | undefined }) {
  const { data: shares = [], isLoading: isLoadingShares } = useFolderShares(group.id);

  const currentUserShare = shares.find((share: any) =>
    share.user?.email === currentUserEmail
  );

  const canDelete = !isLoadingShares && (shares.length === 0 || currentUserShare?.permission === 'edit' || currentUserShare?.permission === 'owner');

  return (
    <FolderGroupCard
      key={group.id}
      id={group.id}
      title={group.name}
      slug={group.slug}
      itemCount={group.link_count || 0}
      lastUpdate={formatLastUpdate(group.updated_at)}
      images={group.preview_images || []}
      canDelete={canDelete}
      isShared={true}
    />
  );
}

export default function AppPage() {
  const router = useRouter();
  const { session, loading } = useAuthContext();
  const [selectedLinkIds, setSelectedLinkIds] = useState<Set<string>>(new Set());
  const [loadMoreElement, setLoadMoreElement] = useState<HTMLDivElement | null>(null);

  // ✅ Utilisation de React Query pour le cache et auto-refresh
  const { data: folders = [], isLoading: loadingFolders } = useFolders(session?.user?.id);
  const { data: groups = [], isLoading: loadingGroups } = useGroups(session?.user?.id);
  const { data: sharedData, isLoading: loadingSharedFolders } = useSharedFolders(session?.user?.id || null);

  // Extraire les groupes et dossiers partagés
  const sharedFolders = sharedData?.folders || [];
  const sharedGroups = sharedData?.groups || [];

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

  // Flatten les pages en un seul array et dédupliquer par ID
  const userLinks = linksData?.pages.flatMap(page => page.links) || [];
  const uniqueLinks = Array.from(
    new Map(userLinks.map(link => [link.id, link])).values()
  );

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
  }, [loadMoreElement, fetchNextPage, hasNextPage, isFetchingNextPage, uniqueLinks.length]);

  // ✅ Désélectionner en cliquant hors des cartes
  useEffect(() => {
    if (!isSelectionMode) return;

    const handleClickOutsideCards = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Ne pas désélectionner si on clique sur le header ou dans une modale
      if (target.closest('header') || target.closest('[role="dialog"]') || target.closest('.fixed')) {
        return;
      }
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
        <Header selectedCount={selectedLinkIds.size} onDeleteSelected={handleDeleteSelected} isLoading={true} />
        <main className="w-full px-[22px] py-[22px]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <Header selectedCount={selectedLinkIds.size} onDeleteSelected={handleDeleteSelected} isLoading={loadingData} />

      <main className="w-full px-[22px] py-[22px] flex flex-col gap-16">
        {/* Section Groupe de dossier */}
        {loadingGroups ? null : groups.length > 0 ? (
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
                  images={group.preview_images || []}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Section Dossiers */}
        {loadingFolders ? null : sortedFolders.length > 0 ? (
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
                  previewImages={folder.preview_images}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Section Groupes partagés */}
        {loadingSharedFolders ? null : sharedGroups.length > 0 ? (
          <section className="flex flex-col items-start gap-[21px] w-full">
            {/* Titre */}
            <h1
              className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              Groupes partagés ({sharedGroups.length})
            </h1>

            {/* Contenu des cartes */}
            <div className="flex flex-row flex-wrap gap-8 w-full">
              {sharedGroups.map((group) => (
                <SharedGroupCard
                  key={group.id}
                  group={group}
                  currentUserEmail={session?.user?.email}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Section Dossiers partagés */}
        {loadingSharedFolders ? null : sharedFolders.length > 0 ? (
          <section className="flex flex-col items-start gap-[21px] w-full">
            {/* Titre */}
            <h1
              className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              Dossiers partagés ({sharedFolders.length})
            </h1>

            {/* Contenu des cartes */}
            <div className="flex flex-row flex-wrap gap-8 w-full">
              {sharedFolders.map((folder) => (
                <SharedFolderCard
                  key={folder.id}
                  folder={folder}
                  currentUserEmail={session?.user?.email}
                  currentUserId={session?.user?.id}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Section Liens récents */}
        {loadingLinks ? null : uniqueLinks.length > 0 ? (
          <section className="flex flex-col items-start gap-[21px] w-full">
            {/* Titre */}
            <h1
              className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: 'Area Inktrap, sans-serif' }}
            >
              Liens récents ({uniqueLinks.length})
            </h1>

            {/* Contenu des cartes */}
            <div className="flex flex-row flex-wrap gap-8 w-full">
              {uniqueLinks.map((link) => (
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
              <div ref={setLoadMoreElement} className="w-full flex items-center justify-center py-8 min-h-[100px]" />
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}

