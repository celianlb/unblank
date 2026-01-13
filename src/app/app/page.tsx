"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import FolderCard from "@/components/FolderCard";
import LinkCard from "@/components/LinkCard";
import { useFolders } from "@/hooks/useFolders";
import {
  useDeleteLinks,
  useDeleteLink,
  useInfiniteUserLinks,
  useUserLinksCount,
} from "@/hooks/useLinks";
import { useSharedFolders } from "@/hooks/useSharedFolders";
import { useFolderShares } from "@/hooks/useShares";
import { formatLastUpdate, formatDateAdded } from "@/utils/formatters";
import {
  FolderCardSkeleton,
  LinkCardSkeleton,
} from "@/components/skeletons";

// Helper component to render FolderCard with permission checking
function SharedFolderCard({
  folder,
  currentUserEmail,
  currentUserId,
}: {
  folder: any;
  currentUserEmail: string | undefined;
  currentUserId: string | undefined;
}) {
  const { data: shares = [], isLoading: isLoadingShares } = useFolderShares(
    folder.id
  );

  const currentUserShare = shares.find(
    (share: any) => share.user?.email === currentUserEmail
  );

  const canDelete =
    !isLoadingShares &&
    (shares.length === 0 ||
      currentUserShare?.permission === "edit" ||
      currentUserShare?.permission === "owner");

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

export default function AppPage() {
  const router = useRouter();
  const { session, loading } = useAuthContext();
  const [selectedLinkIds, setSelectedLinkIds] = useState<Set<string>>(
    new Set()
  );
  const [loadMoreElement, setLoadMoreElement] = useState<HTMLDivElement | null>(
    null
  );

  // Utilisation de React Query
  const { data: folders = [], isLoading: loadingFolders } = useFolders(
    session?.user?.id
  );
  const { data: sharedData, isLoading: loadingSharedFolders } =
    useSharedFolders(session?.user?.id || null);

  const sharedFolders = sharedData?.folders || [];

  // Infinite scroll avec pagination
  const {
    data: linksData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: loadingLinks,
  } = useInfiniteUserLinks(session?.user?.id, 12);

  const { data: totalLinksCount = 0 } = useUserLinksCount(session?.user?.id);

  const deleteLinks = useDeleteLinks();
  const deleteLink = useDeleteLink(session?.user?.id);

  const userLinks = linksData?.pages.flatMap((page) => page.links) || [];
  const uniqueLinks = Array.from(
    new Map(userLinks.map((link) => [link.id, link])).values()
  );

  const isSelectionMode = selectedLinkIds.size > 0;

  // Trier les dossiers : dossiers système en premier
  const sortedFolders = [...folders].sort((a, b) => {
    if (a.is_system && !b.is_system) return -1;
    if (!a.is_system && b.is_system) return 1;
    return (a.position || 0) - (b.position || 0);
  });

  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [session, loading, router]);

  // Infinite scroll
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
        rootMargin: "100px",
      }
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.disconnect();
    };
  }, [
    loadMoreElement,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    uniqueLinks.length,
  ]);

  // Désélectionner en cliquant hors des cartes
  useEffect(() => {
    if (!isSelectionMode) return;

    const handleClickOutsideCards = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("header") ||
        target.closest('[role="dialog"]') ||
        target.closest(".fixed")
      ) {
        return;
      }
      if (!target.closest(".group\\/card")) {
        setSelectedLinkIds(new Set());
      }
    };

    document.addEventListener("click", handleClickOutsideCards);
    return () => {
      document.removeEventListener("click", handleClickOutsideCards);
    };
  }, [isSelectionMode]);

  const handleCheckChange = (id: string, checked: boolean) => {
    setSelectedLinkIds((prev) => {
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
      await deleteLinks.mutateAsync(Array.from(selectedLinkIds));
      setSelectedLinkIds(new Set());
    } catch (error) {
      console.error("Error deleting links:", error);
      alert("Erreur lors de la suppression des liens");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-white">
        <Header
          selectedCount={selectedLinkIds.size}
          onDeleteSelected={handleDeleteSelected}
          isLoading={true}
        />
        <main className="w-full px-[22px] py-[22px]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <Header
        selectedCount={selectedLinkIds.size}
        onDeleteSelected={handleDeleteSelected}
        isLoading={loadingFolders}
      />

      <main className="w-full px-[22px] py-[22px] flex flex-col gap-16">
        {/* Section Dossiers */}
        {loadingFolders ? (
          <section className="flex flex-col items-start gap-[21px] w-full">
            <div className="h-[43px] w-48 bg-[#E5E5E5] animate-pulse rounded-md" />
            <div className="flex flex-row flex-wrap gap-8 w-full">
              {[...Array(3)].map((_, i) => (
                <FolderCardSkeleton key={i} />
              ))}
            </div>
          </section>
        ) : sortedFolders.length > 0 ? (
          <section className="flex flex-col items-start gap-[21px] w-full">
            <h1
              className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: "Area Inktrap, sans-serif" }}
            >
              Dossiers ({sortedFolders.length})
            </h1>
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

        {/* Section Dossiers partagés */}
        {loadingSharedFolders ? (
          <section className="flex flex-col items-start gap-[21px] w-full">
            <div className="h-[43px] w-56 bg-[#E5E5E5] animate-pulse rounded-md" />
            <div className="flex flex-row flex-wrap gap-8 w-full">
              {[...Array(2)].map((_, i) => (
                <FolderCardSkeleton key={i} />
              ))}
            </div>
          </section>
        ) : sharedFolders.length > 0 ? (
          <section className="flex flex-col items-start gap-[21px] w-full">
            <h1
              className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: "Area Inktrap, sans-serif" }}
            >
              Dossiers partagés ({sharedFolders.length})
            </h1>
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
        {loadingLinks ? (
          <section className="flex flex-col items-start gap-[21px] w-full">
            <div className="h-[43px] w-48 bg-[#E5E5E5] animate-pulse rounded-md" />
            <div className="flex flex-row flex-wrap gap-8 w-full">
              {[...Array(6)].map((_, i) => (
                <LinkCardSkeleton key={i} />
              ))}
            </div>
          </section>
        ) : uniqueLinks.length > 0 ? (
          <section className="flex flex-col items-start gap-[21px] w-full">
            <h1
              className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: "Area Inktrap, sans-serif" }}
            >
              Liens récents ({totalLinksCount})
            </h1>
            <div className="flex flex-row flex-wrap gap-8 w-full">
              {uniqueLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  id={link.id}
                  imageUrl={
                    link.screenshot_url || link.original_image_url || undefined
                  }
                  link={link.url}
                  title={link.title || ""}
                  description={link.description || ""}
                  tags={link.tags?.map((t) => t.name) || []}
                  fileType={link.image_format || "JPG"}
                  dateAdded={formatDateAdded(link.created_at)}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedLinkIds.has(link.id)}
                  onCheckChange={handleCheckChange}
                  onDelete={(id) => deleteLink.mutate(id)}
                />
              ))}
            </div>
            {hasNextPage && (
              <div
                ref={setLoadMoreElement}
                className="w-full flex items-center justify-center py-8 min-h-[100px]"
              />
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
