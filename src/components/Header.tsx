"use client";

import { Search, Plus, ChevronDown, Trash } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import AddLinkModal from "./AddLinkModal";
import CreateFolderModal from "./CreateFolderModal";
import CreateGroupModal from "./CreateGroupModal";
import ProfileMenu from "./ProfileMenu";
import DeleteConfirmModal from "./DeleteConfirmModal";
import SearchModal from "./search/SearchModal";
import Tooltip from "./Tooltip";
import { useFolderShares } from "@/hooks/useShares";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionService } from "@/domain/subscription/services/SubscriptionService";
import { Subscription } from "@/domain/subscription/models/Subscription";

interface HeaderProps {
  selectedCount?: number;
  onDeleteSelected?: () => void;
  currentFolderId?: string;
  currentGroupId?: string;
  isInGroup?: boolean; // Pour savoir si on est dans un groupe (pas un dossier)
  isLoading?: boolean; // Pour désactiver les boutons pendant le chargement
  minimal?: boolean; // Pour afficher seulement le menu profil (sans recherche et actions)
}

export default function Header({
  selectedCount = 0,
  onDeleteSelected,
  currentFolderId,
  currentGroupId,
  isInGroup = false,
  isLoading = false,
  minimal = false,
}: HeaderProps) {
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    if (onDeleteSelected) {
      try {
        await onDeleteSelected();
      } catch (error) {
        console.error("Error calling onDeleteSelected:", error);
      }
    }
    setIsDeleteModalOpen(false);
  };

  // Utiliser le context au lieu de fetcher à chaque fois
  const { session } = useAuthContext();
  const currentUser = session?.user || null;

  // Récupérer les permissions du dossier actuel
  const { data: shares = [], isLoading: isLoadingShares } = useFolderShares(
    currentFolderId || null
  );

  // Récupérer l'abonnement pour vérifier les limites
  const { subscription } = useSubscription();

  // Récupérer les permissions du groupe actuel (pour le bouton "Créer un dossier")
  const { data: groupShares = [], isLoading: isLoadingGroupShares } =
    useFolderShares(currentGroupId || null);

  // Vérifier si l'utilisateur a la permission d'éditer dans le dossier (pour "Ajouter un lien")
  const currentUserShare = shares.find(
    (share: any) => share.user?.email === currentUser?.email
  );

  // Vérifier si l'utilisateur a la permission d'éditer dans le groupe (pour "Créer un dossier")
  const currentUserGroupShare = groupShares.find(
    (share: any) => share.user?.email === currentUser?.email
  );

  // Logique de permission pour "Ajouter un lien" :
  // - Si pas de dossier (currentFolderId null/undefined) : peut éditer
  // - Si dossier existe mais les shares sont en cours de chargement : on attend (canEdit = false pour éviter le flash)
  // - Si dossier existe mais pas de partages : l'utilisateur est propriétaire, peut éditer
  // - Si dossier partagé : vérifier la permission (edit ou owner)
  const canEdit =
    !currentFolderId ||
    (!isLoadingShares &&
      (shares.length === 0 ||
        currentUserShare?.permission === "edit" ||
        currentUserShare?.permission === "owner"));

  // Vérifier si l'utilisateur peut ajouter un lien (logique métier)
  const subscriptionService = new SubscriptionService();
  const canAddLinkResult = subscription
    ? subscriptionService.canAddLink(subscription)
    : { allowed: true, reason: undefined }; // Nouvel utilisateur, pas encore de limite

  const canAddLink = canEdit && canAddLinkResult.allowed;
  const linkLimitReason = canAddLinkResult.reason;

  // Logique de permission pour "Créer un dossier" (dans un groupe) :
  // - Si pas de groupe (currentGroupId null/undefined) : peut créer
  // - Si groupe existe mais les shares sont en cours de chargement : on attend
  // - Si groupe existe mais pas de partages : l'utilisateur est propriétaire, peut créer
  // - Si groupe partagé : vérifier la permission (edit ou owner)
  const canCreateFolder =
    !currentGroupId ||
    (!isLoadingGroupShares &&
      (groupShares.length === 0 ||
        currentUserGroupShare?.permission === "edit" ||
        currentUserGroupShare?.permission === "owner"));

  // Logique de permission pour "Supprimer" :
  // - Si dans un dossier : utiliser canEdit (pour supprimer des liens)
  // - Si dans un groupe : utiliser canCreateFolder (pour supprimer des dossiers)
  // - Sinon (home/récents) : toujours autorisé
  const canDelete = currentFolderId
    ? canEdit
    : currentGroupId
    ? canCreateFolder
    : true;
  const isLoadingDeletePermissions = currentFolderId
    ? isLoadingShares
    : currentGroupId
    ? isLoadingGroupShares
    : false;

  // Global keyboard listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K on Mac, Ctrl+K on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <AddLinkModal
        isOpen={isAddLinkModalOpen}
        onClose={() => setIsAddLinkModalOpen(false)}
        folderId={currentFolderId}
      />
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        parentFolderId={currentGroupId}
      />
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
      />
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
      <header
        className={`w-full bg-white border-b-[3px] border-black ${
          minimal
            ? "h-auto"
            : "h-auto sm:h-auto md:h-auto lg:h-auto xl:h-[232px]"
        }`}
      >
        <div
          className={`w-full h-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 ${
            minimal ? "py-4" : "py-4 sm:py-5 md:py-6 lg:py-7 xl:py-8"
          }`}
        >
          <div
            className={`flex flex-row items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-8 mb-3 md:mb-4 lg:mb-6 xl:mb-8 ${
              minimal ? "justify-end" : "justify-between"
            }`}
          >
            {!minimal && (
              <div className="flex-1 md:flex-1 lg:max-w-[700px] xl:max-w-[903px] relative">
                <div className="absolute left-3 sm:left-4 md:left-5 lg:left-6 xl:left-8 top-1/2 -translate-y-1/2 text-[#636363] w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 pointer-events-none">
                  <Search className="w-full h-full" strokeWidth={2} />
                </div>
                {/* Keyboard shortcut badge */}
                <div className="hidden lg:flex absolute left-12 sm:left-14 md:left-16 lg:left-[72px] xl:left-[88px] top-1/2 -translate-y-1/2 items-center gap-1 px-2 py-1 lg:px-2.5 lg:py-1.5 rounded-md border border-[#636363] bg-white pointer-events-none">
                  <span className="text-xs lg:text-sm text-[#636363] font-medium font-[Heebo]">
                    {typeof navigator !== "undefined" &&
                    navigator.platform.toLowerCase().includes("mac")
                      ? "⌘"
                      : "Ctrl"}
                  </span>
                  <span className="text-xs lg:text-sm text-[#636363] font-medium font-[Heebo]">
                    K
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Rechercher un dossier, une image, un lien"
                  onClick={() => setIsSearchModalOpen(true)}
                  onFocus={(e) => e.target.blur()}
                  readOnly
                  className="w-full h-11 sm:h-11 md:h-12 lg:h-16 xl:h-20 pl-10 sm:pl-11 md:pl-12 lg:pl-[140px] xl:pl-[156px] pr-3 sm:pr-4 md:pr-5 lg:pr-6 xl:pr-8 rounded-xl md:rounded-[16px] lg:rounded-[18px] xl:rounded-[20px] border-2 border-black bg-white text-[#636363] placeholder-[#636363] focus:outline-none text-sm sm:text-sm md:text-base lg:text-base xl:text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] xl:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-ellipsis cursor-text"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-6 shrink-0 ml-auto">
              {/* Bouton Extension - Visible uniquement sur desktop (md et plus) */}
              {!minimal && (
                <button className="hidden md:flex h-11 lg:h-12 xl:h-[54px] px-4 lg:px-5 xl:px-[27px] rounded-xl border-2 border-black bg-[#FEF8EE] hover:bg-[#FFE3E8] active:translate-y-[2px] active:shadow-none transition-all font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-sm lg:text-sm xl:text-base whitespace-nowrap cursor-pointer items-center justify-center">
                  Installer l&apos;extension
                </button>
              )}
              {minimal && (
                <button
                  onClick={() => (window.location.href = "/app")}
                  className="hidden md:flex h-11 lg:h-12 xl:h-[54px] px-4 lg:px-5 xl:px-[27px] rounded-xl border-2 border-black bg-[#FEF8EE] hover:bg-[#FFE3E8] active:translate-y-[2px] active:shadow-none transition-all font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-sm lg:text-sm xl:text-base whitespace-nowrap cursor-pointer items-center justify-center"
                >
                  Retour
                </button>
              )}

              <div className="relative shrink-0">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-1 sm:gap-1 md:gap-1.5 xl:gap-1.5 cursor-pointer"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 xl:w-[62px] xl:h-[62px] rounded-full border-2 md:border-[3px] border-black overflow-hidden bg-gray-200 shrink-0">
                    {currentUser?.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.username || currentUser.email}
                        className="w-full h-full object-cover"
                      />
                    ) : currentUser ? (
                      <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">
                        {currentUser.username?.charAt(0).toUpperCase() ||
                          currentUser.email?.charAt(0).toUpperCase()}
                      </div>
                    ) : null}
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 text-black transition-transform ${
                      isProfileMenuOpen ? "rotate-180" : ""
                    }`}
                    strokeWidth={2}
                  />
                </button>

                {isProfileMenuOpen && (
                  <ProfileMenu
                    isOpen={isProfileMenuOpen}
                    onClose={() => setIsProfileMenuOpen(false)}
                  />
                )}
              </div>
            </div>
          </div>

          {!minimal && (
            <div className="flex items-center justify-between pt-3 sm:pt-3 md:pt-4 lg:pt-6 xl:pt-8">
              <div className="flex items-center gap-3 sm:gap-3 md:gap-3 lg:gap-3 xl:gap-4">
                <Tooltip
                  content="Vous n'avez pas la permission de créer des dossiers dans ce groupe partagé"
                  disabled={canCreateFolder || isLoading || !!currentFolderId}
                >
                  <div className="relative inline-block">
                    <button
                      onClick={() =>
                        !isLoading &&
                        !currentFolderId &&
                        canCreateFolder &&
                        setIsCreateFolderModalOpen(true)
                      }
                      disabled={
                        isLoading || !!currentFolderId || !canCreateFolder
                      }
                      className={`h-9 sm:h-10 md:h-11 lg:h-11 xl:h-12 px-3 sm:px-4 md:px-5 lg:px-6 xl:px-6 rounded-lg md:rounded-xl transition-all border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 xl:gap-2.5 whitespace-nowrap ${
                        isLoading || currentFolderId || !canCreateFolder
                          ? "bg-[#FF506F] opacity-50 cursor-not-allowed"
                          : "bg-[#FF506F] hover:bg-[#FF6080] active:translate-y-[2px] active:shadow-none cursor-pointer"
                      }`}
                    >
                      <Plus
                        className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-black shrink-0"
                        strokeWidth={2}
                      />
                      <span className="text-black font-bold text-xs sm:text-sm md:text-sm lg:text-sm xl:text-base">
                        Créer un dossier
                      </span>
                    </button>
                    {!canCreateFolder &&
                      !isLoading &&
                      !isLoadingGroupShares &&
                      !currentFolderId && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 bg-[#FF506F] rounded-full border-2 border-black flex items-center justify-center">
                          <span className="text-[10px] sm:text-xs md:text-xs lg:text-xs xl:text-sm font-black text-black">
                            !
                          </span>
                        </div>
                      )}
                  </div>
                </Tooltip>

                <button
                  onClick={() =>
                    !isLoading &&
                    !isInGroup &&
                    !currentFolderId &&
                    setIsCreateGroupModalOpen(true)
                  }
                  disabled={isLoading || isInGroup || !!currentFolderId}
                  className={`h-9 sm:h-10 md:h-11 lg:h-11 xl:h-12 px-3 sm:px-4 md:px-5 lg:px-6 xl:px-6 rounded-lg md:rounded-xl bg-[#FEF8EE] transition-all border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 xl:gap-2.5 whitespace-nowrap ${
                    isLoading || isInGroup || currentFolderId
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#FFE3E8] active:translate-y-[2px] active:shadow-none cursor-pointer"
                  }`}
                >
                  <Plus
                    className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-black shrink-0"
                    strokeWidth={2}
                  />
                  <span className="text-black font-bold text-xs sm:text-sm md:text-sm lg:text-sm xl:text-base">
                    Créer un groupe
                  </span>
                </button>

                <Tooltip
                  content={
                    linkLimitReason
                      ? linkLimitReason
                      : "Vous n'avez pas la permission d'ajouter des liens dans ce dossier partagé"
                  }
                  disabled={canAddLink || isInGroup || isLoading}
                >
                  <div className="relative inline-block">
                    <button
                      onClick={() =>
                        !isLoading &&
                        !isInGroup &&
                        canAddLink &&
                        setIsAddLinkModalOpen(true)
                      }
                      disabled={isLoading || isInGroup || !canAddLink}
                      className={`h-9 sm:h-10 md:h-11 lg:h-11 xl:h-12 px-3 sm:px-4 md:px-5 lg:px-6 xl:px-6 rounded-lg md:rounded-xl bg-[#FEF8EE] transition-all border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 xl:gap-2.5 whitespace-nowrap ${
                        isLoading || isInGroup || !canAddLink
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-[#FFE3E8] active:translate-y-[2px] active:shadow-none cursor-pointer"
                      }`}
                    >
                      <Plus
                        className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-black shrink-0"
                        strokeWidth={2}
                      />
                      <span className="text-black font-bold text-xs sm:text-sm md:text-sm lg:text-sm xl:text-base">
                        Ajouter un lien
                      </span>
                    </button>
                    {!canAddLink &&
                      !isInGroup &&
                      !isLoading &&
                      !isLoadingShares && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-6 xl:h-6 bg-[#FF506F] rounded-full border-2 border-black flex items-center justify-center">
                          <span className="text-[10px] sm:text-xs md:text-xs lg:text-xs xl:text-sm font-black text-black">
                            !
                          </span>
                        </div>
                      )}
                  </div>
                </Tooltip>
              </div>

              {/* Delete button - appears when items are selected */}
              {selectedCount > 0 && (
                <Tooltip
                  content={
                    currentFolderId
                      ? "Vous n'avez pas la permission de supprimer des liens dans ce dossier partagé"
                      : "Vous n'avez pas la permission de supprimer des dossiers dans ce groupe partagé"
                  }
                  disabled={canDelete || isLoading}
                >
                  <div className="relative inline-block">
                    <button
                      onClick={() => canDelete && setIsDeleteModalOpen(true)}
                      disabled={!canDelete || isLoading}
                      className={`h-12 px-6 rounded-xl transition-all border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2.5 whitespace-nowrap ${
                        !canDelete || isLoading
                          ? "bg-[#FEF8EE] opacity-50 cursor-not-allowed"
                          : "bg-[#FEF8EE] hover:bg-[#FFE3E8] active:translate-y-[2px] active:shadow-none cursor-pointer"
                      }`}
                    >
                      <Trash
                        className="w-6 h-6 text-black shrink-0"
                        strokeWidth={2}
                      />
                      <span className="text-black font-bold text-base">
                        Supprimer
                      </span>
                    </button>
                    {!canDelete &&
                      !isLoading &&
                      !isLoadingDeletePermissions && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#FF506F] rounded-full border-2 border-black flex items-center justify-center">
                          <span className="text-sm font-black text-black">
                            !
                          </span>
                        </div>
                      )}
                  </div>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
}
