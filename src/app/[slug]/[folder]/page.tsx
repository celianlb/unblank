"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Breadcrumb from "@/components/Breadcrumb";
import DetailedLinkCard from "@/components/DetailedLinkCard";
import ImageCard from "@/components/ImageCard";
import { getContentType } from "@/utils/linkUtils";
import { useFolderBySlug, useGroupBySlug } from "@/hooks/useFolders";
import {
  useFolderLinks,
  useDeleteLinks,
  useDeleteLink,
} from "@/hooks/useLinks";
import { formatDateAdded } from "@/utils/formatters";
import { useFolderShares } from "@/hooks/useShares";

export default function FolderPage() {
  const params = useParams();
  const router = useRouter();
  const { session, loading } = useAuthContext();
  const groupSlug = params.slug as string;
  const folderSlug = params.folder as string;
  const [selectedLinkIds, setSelectedLinkIds] = useState<Set<string>>(
    new Set()
  );

  // ✅ Utilisation de React Query
  const { data: group } = useGroupBySlug(session?.user?.id, groupSlug);
  const { data: folder, isLoading: loadingFolder } = useFolderBySlug(
    session?.user?.id,
    folderSlug
  );
  const { data: links = [], isLoading: loadingLinks } = useFolderLinks(
    folder?.id
  );

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

  const loadingData = loadingFolder || loadingLinks;
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

  // Séparer les liens en images et liens classiques
  const imageLinks = links.filter((link) => getContentType(link) === "image");
  const regularLinks = links.filter((link) => getContentType(link) === "link");

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-white">
        <Header
          selectedCount={selectedCount}
          onDeleteSelected={handleDeleteSelected}
          currentFolderId={folder?.id}
          currentGroupId={group?.id}
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
        currentGroupId={group?.id}
        isLoading={loadingData}
      />

      <main className="w-full px-[22px] py-[22px] flex flex-col gap-16">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          groupName={group?.name}
          folderName={folder?.name}
          groupSlug={groupSlug}
          isLoading={loadingData}
        />

        {!folder && !loadingData && (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-500">Dossier introuvable</p>
          </div>
        )}

        {folder && !loadingData && (
          <>
            {/* Section Images */}
            {imageLinks.length > 0 && (
              <section className="flex flex-col items-start gap-[21px] w-full">
                {/* Titre */}
                <h1
                  className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
                  style={{ fontFamily: "Area Inktrap, sans-serif" }}
                >
                  Images ({imageLinks.length})
                </h1>

                {/* Contenu des cartes images */}
                <div className="flex flex-row flex-wrap gap-8 w-full">
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
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Section Liens */}
            {regularLinks.length > 0 && (
              <section className="flex flex-col items-start gap-[21px] w-full">
                {/* Titre */}
                <h1
                  className="text-[32px] leading-[43px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
                  style={{ fontFamily: "Area Inktrap, sans-serif" }}
                >
                  Liens ({regularLinks.length})
                </h1>

                {/* Contenu des cartes liens */}
                <div className="flex flex-row flex-wrap gap-8 w-full">
                  {regularLinks.map((link) => {
                    // Extraire le nom du site depuis l'URL
                    const url = new URL(link.url);
                    const siteName =
                      link.title || url.hostname.replace("www.", "");
                    const siteUrl = url.hostname;

                    return (
                      <DetailedLinkCard
                        key={link.id}
                        linkId={link.id}
                        siteName={siteName}
                        siteUrl={siteUrl}
                        description={link.description || ""}
                        link={link.url}
                        tags={link.tags?.map((t) => t.name) || []}
                        isSelectionMode={isSelectionMode}
                        onCheckChange={handleCheckChange}
                        onDelete={handleDeleteSingle}
                        canDelete={canEdit}
                        canEdit={canEdit}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* Message si aucun lien */}
            {links.length === 0 && (
              <div className="flex items-center justify-center py-16">
                <p className="text-gray-500">Aucun lien dans ce dossier</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
