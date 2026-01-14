"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Breadcrumb from "@/components/Breadcrumb";
import FolderCard from "@/components/FolderCard";
import DetailedLinkCard from "@/components/DetailedLinkCard";
import ImageCard from "@/components/ImageCard";
import VideoCard from "@/components/VideoCard";
import { getContentType, getVideoPlatformInfo } from "@/utils/linkUtils";
import { useFolderBySlug, useFolderAncestors, useSubFolders } from "@/hooks/useFolders";
import {
  useFolderLinks,
  useDeleteLinks,
  useDeleteLink,
} from "@/hooks/useLinks";
import { formatDateAdded, formatLastUpdate } from "@/utils/formatters";
import { useFolderShares } from "@/hooks/useShares";
import {
  FolderCardSkeleton,
  ImageCardSkeleton,
  VideoCardSkeleton,
  DetailedLinkCardSkeleton,
} from "@/components/skeletons";

export default function FolderPage() {
  const params = useParams();
  const router = useRouter();
  const { session, loading } = useAuthContext();
  const folderId = params.folderId as string;
  const [selectedLinkIds, setSelectedLinkIds] = useState<Set<string>>(
    new Set()
  );

  // ✅ Utilisation de React Query
  const { data: folder, isLoading: loadingFolder } = useFolderBySlug(
    session?.user?.id,
    folderId
  );

  // Récupérer la chaîne des dossiers ancêtres pour le breadcrumb
  const { data: ancestors = [] } = useFolderAncestors(folder?.id);

  const { data: subFolders = [], isLoading: loadingSubFolders } = useSubFolders(
    session?.user?.id,
    folder?.id
  );
  const { data: links = [], isLoading: loadingLinks } = useFolderLinks(
    folder?.id
  );

  // Construire le tableau des parents pour le breadcrumb (du plus éloigné au plus proche)
  const breadcrumbParents = ancestors.map((ancestor) => ({
    name: ancestor.name,
    slug: ancestor.slug,
  }));

  // Mutations pour la suppression
  const deleteLinks = useDeleteLinks(folder?.id);
  const deleteLink = useDeleteLink(session?.user?.id, folder?.id);

  // Récupérer les permissions du dossier actuel
  const { data: shares = [], isLoading: isLoadingShares } = useFolderShares(
    folder?.id || null
  );

  // Vérifier si l'utilisateur a la permission d'éditer (supprimer des liens)
  const currentUserShare = shares.find(
    (share: any) => share.user?.email === session?.user?.email
  );

  // Logique de permission :
  // - Si le dossier est en cours de chargement : ne pas autoriser (pour éviter le flash)
  // - Si dossier chargé mais pas de partages : l'utilisateur est propriétaire, peut éditer
  // - Si dossier partagé : vérifier la permission (edit ou owner)
  const canEdit =
    !loadingFolder &&
    !isLoadingShares &&
    !!folder?.id &&
    (shares.length === 0 ||
      currentUserShare?.permission === "edit" ||
      currentUserShare?.permission === "owner");

  const loadingData = loadingFolder || loadingSubFolders || loadingLinks;
  const selectedCount = selectedLinkIds.size;
  const isSelectionMode = selectedCount > 0;

  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [session, loading, router]);

  // ✅ Désélectionner en cliquant hors des cartes
  useEffect(() => {
    if (!isSelectionMode) return;

    const handleClickOutsideCards = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Ne pas désélectionner si on clique sur le header ou dans une modale
      if (
        target.closest("header") ||
        target.closest('[role="dialog"]') ||
        target.closest(".fixed")
      ) {
        return;
      }
      // Si on ne clique pas sur une carte, désélectionner
      if (
        !target.closest('[class*="border-[3px]"]') &&
        !target.closest('[class*="border-3"]')
      ) {
        setSelectedLinkIds(new Set());
      }
    };

    document.addEventListener("click", handleClickOutsideCards);
    return () => {
      document.removeEventListener("click", handleClickOutsideCards);
    };
  }, [isSelectionMode]);

  const handleCheckChange = (linkId: string, checked: boolean) => {
    setSelectedLinkIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(linkId);
      } else {
        newSet.delete(linkId);
      }
      return newSet;
    });
  };

  const handleDeleteSingle = async (linkId: string) => {
    try {
      await deleteLink.mutateAsync(linkId);
    } catch (error) {
      console.error("Error deleting link:", error);
      alert("Erreur lors de la suppression du lien");
    }
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

  // Séparer les liens en images, vidéos et liens classiques
  const imageLinks = links.filter((link) => getContentType(link) === "image");
  const videoLinks = links.filter((link) => getContentType(link) === "video");
  const regularLinks = links.filter((link) => getContentType(link) === "link");

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-white">
        <Header
          selectedCount={selectedCount}
          onDeleteSelected={handleDeleteSelected}
          currentFolderId={folder?.id}
          isLoading={true}
        />
        <main className="w-full px-[22px] py-[22px]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <Header
        selectedCount={selectedCount}
        onDeleteSelected={handleDeleteSelected}
        currentFolderId={folder?.id}
        isLoading={loadingData}
      />
      {/* Spacer pour compenser le header fixe (inclut BetaTrialBanner ~44px) */}
      <div className="h-[114px] sm:h-[120px] md:h-[128px] lg:h-[132px] xl:h-[146px]" />

      <main className="w-full px-[22px] py-[22px] flex flex-col gap-16">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          parents={breadcrumbParents}
          currentName={folder?.name}
          isLoading={loadingFolder}
        />

        {!folder && !loadingData && (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-500">Dossier introuvable</p>
          </div>
        )}

        {/* Loading state with skeletons */}
        {loadingData && (
          <>
            <section className="flex flex-col items-start gap-[21px] w-full">
              <div className="h-[43px] w-40 bg-[#E5E5E5] animate-pulse rounded-md" />
              <div className="flex flex-row flex-wrap gap-8 w-full">
                {[...Array(2)].map((_, i) => (
                  <FolderCardSkeleton key={i} />
                ))}
              </div>
            </section>
            <section className="flex flex-col items-start gap-[21px] w-full">
              <div className="h-[43px] w-32 bg-[#E5E5E5] animate-pulse rounded-md" />
              <div className="flex flex-row flex-wrap gap-8 w-full">
                {[...Array(4)].map((_, i) => (
                  <ImageCardSkeleton key={i} />
                ))}
              </div>
            </section>
            <section className="flex flex-col items-start gap-[21px] w-full">
              <div className="h-[43px] w-32 bg-[#E5E5E5] animate-pulse rounded-md" />
              <div className="flex flex-row flex-wrap gap-8 w-full">
                {[...Array(2)].map((_, i) => (
                  <VideoCardSkeleton key={i} />
                ))}
              </div>
            </section>
            <section className="flex flex-col items-start gap-[21px] w-full">
              <div className="h-[43px] w-24 bg-[#E5E5E5] animate-pulse rounded-md" />
              <div className="flex flex-row flex-wrap gap-8 w-full">
                {[...Array(3)].map((_, i) => (
                  <DetailedLinkCardSkeleton key={i} />
                ))}
              </div>
            </section>
          </>
        )}

        {folder && !loadingData && (
          <>
            {/* Section Sous-dossiers */}
            {subFolders.length > 0 && (
              <section className="flex flex-col items-start gap-[21px] w-full">
                <h1
                  className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
                  style={{ fontFamily: "Area Inktrap, sans-serif" }}
                >
                  Sous-dossiers ({subFolders.length})
                </h1>
                <div className="flex flex-row flex-wrap gap-8 w-full">
                  {subFolders.map((subFolder) => (
                    <FolderCard
                      key={subFolder.id}
                      id={subFolder.id}
                      title={subFolder.name}
                      slug={subFolder.slug}
                      itemCount={subFolder.link_count || 0}
                      lastUpdate={formatLastUpdate(subFolder.updated_at)}
                      isSystem={subFolder.is_system}
                      previewImages={subFolder.preview_images}
                      canDelete={canEdit}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Section Images */}
            {imageLinks.length > 0 && (
              <section className="flex flex-col items-start gap-[21px] w-full">
                <h1
                  className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
                  style={{ fontFamily: "Area Inktrap, sans-serif" }}
                >
                  Images ({imageLinks.length})
                </h1>
                <div className="flex flex-row flex-wrap gap-3 sm:gap-8 w-full">
                  {imageLinks.map((link) => (
                    <ImageCard
                      key={link.id}
                      linkId={link.id}
                      imageUrl={
                        link.original_image_url || link.screenshot_url || ""
                      }
                      link={link.url}
                      fileType={link.image_format?.toUpperCase() || "IMG"}
                      dimensions="N/A"
                      fileSize="N/A"
                      dateAdded={formatDateAdded(link.created_at)}
                      folder={folder.name}
                      tags={link.tags?.map((t) => t.name) || []}
                      isSelectionMode={isSelectionMode}
                      onCheckChange={handleCheckChange}
                      onDelete={handleDeleteSingle}
                      canDelete={canEdit}
                      canEdit={canEdit}
                      currentFolderId={folderId}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Section Vidéos */}
            {videoLinks.length > 0 && (
              <section className="flex flex-col items-start gap-[21px] w-full">
                <h1
                  className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
                  style={{ fontFamily: "Area Inktrap, sans-serif" }}
                >
                  Vidéos ({videoLinks.length})
                </h1>
                <div className="flex flex-row flex-wrap gap-8 w-full">
                  {videoLinks.map((link) => {
                    const platformInfo = getVideoPlatformInfo(link.url);
                    const thumbnailUrl =
                      link.screenshot_url || link.original_image_url || undefined;

                    return (
                      <VideoCard
                        key={link.id}
                        linkId={link.id}
                        platformName={platformInfo.platformName}
                        platformUrl={platformInfo.platformUrl}
                        videoUrl={link.url}
                        thumbnailUrl={thumbnailUrl}
                        title={link.title || "Vidéo sans titre"}
                        description={link.description || ""}
                        tags={link.tags?.map((t) => t.name) || []}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedLinkIds.has(link.id)}
                        onCheckChange={handleCheckChange}
                        onDelete={handleDeleteSingle}
                        canDelete={canEdit}
                        canEdit={canEdit}
                        currentFolderId={folderId}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* Section Liens */}
            {regularLinks.length > 0 && (
              <section className="flex flex-col items-start gap-[21px] w-full">
                <h1
                  className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
                  style={{ fontFamily: "Area Inktrap, sans-serif" }}
                >
                  Liens ({regularLinks.length})
                </h1>
                <div className="flex flex-row flex-wrap gap-8 w-full">
                  {regularLinks.map((link) => {
                    const url = new URL(link.url);
                    const siteName =
                      link.title || url.hostname.replace("www.", "");
                    const siteUrl = url.hostname;
                    // Utiliser screenshot_url ou fallback sur original_image_url pour les anciens liens
                    const thumbnailUrl = link.screenshot_url || link.original_image_url;

                    // DEBUG: Log pour voir les valeurs
                    console.log(`[DEBUG] Link: ${link.url}`, {
                      screenshot_url: link.screenshot_url,
                      original_image_url: link.original_image_url,
                      thumbnailUrl,
                    });

                    return (
                      <DetailedLinkCard
                        key={link.id}
                        linkId={link.id}
                        siteName={siteName}
                        siteUrl={siteUrl}
                        description={link.description || ""}
                        thumbnailUrl={thumbnailUrl}
                        link={link.url}
                        tags={link.tags?.map((t) => t.name) || []}
                        isSelectionMode={isSelectionMode}
                        onCheckChange={handleCheckChange}
                        onDelete={handleDeleteSingle}
                        canDelete={canEdit}
                        canEdit={canEdit}
                        currentFolderId={folderId}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* Message si aucun contenu */}
            {links.length === 0 && subFolders.length === 0 && (
              <div className="flex items-center justify-center py-16">
                <p className="text-gray-500">Ce dossier est vide</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
