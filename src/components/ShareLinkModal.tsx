"use client";

import { X, Copy, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCreatePublicShare,
  useInviteByEmail,
  useFolderShares,
} from "@/hooks/useShares";
import { useSubscription } from "@/hooks/useSubscription";
import Tooltip from "./Tooltip";

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  currentUserEmail?: string;
}

export default function ShareLinkModal({
  isOpen,
  onClose,
  folderId,
  currentUserEmail,
}: ShareLinkModalProps) {
  const { subscription } = useSubscription();
  const isFreeUser = !subscription || subscription.plan === "free";
  const isProUser = subscription?.plan === "pro";

  const [selectedPermission, setSelectedPermission] = useState<"view" | "edit">(
    "view"
  );
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermission, setInvitePermission] = useState<"view" | "edit">(
    "view"
  );
  const [activeTab, setActiveTab] = useState<"link" | "email">(
    isFreeUser ? "email" : "link"
  );
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string | null>(
    null
  );
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const createPublicShare = useCreatePublicShare();
  const inviteByEmailMutation = useInviteByEmail();
  const { data: shares = [] } = useFolderShares(folderId);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (generatedShareUrl) {
      navigator.clipboard.writeText(generatedShareUrl);
    }
  };

  const handleGenerate = async () => {
    setGenerateError(null);
    try {
      const result = await createPublicShare.mutateAsync({
        folderId,
        permission: selectedPermission,
      });
      setGeneratedShareUrl(result.shareUrl);
    } catch (error) {
      console.error("Error generating share link:", error);
      const message = error instanceof Error ? error.message : "Erreur lors de la génération du lien de partage";
      setGenerateError(message);
      setTimeout(() => setGenerateError(null), 4000);
    }
  };

  // Validation du format email
  const isValidEmailFormat = (email: string): boolean => {
    if (!email.trim()) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Live validation de l'email
  const validateEmail = (email: string): string | null => {
    if (!email.trim()) return null;

    // Validation 1: Empêcher de s'inviter soi-même
    if (
      currentUserEmail &&
      email.toLowerCase() === currentUserEmail.toLowerCase()
    ) {
      return "Vous ne pouvez pas vous inviter vous-même";
    }

    // Validation 2: Vérifier si l'utilisateur est déjà invité
    const existingShare = shares.find(
      (share: any) => share.user?.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingShare) {
      return "Cet utilisateur a déjà accès à ce dossier";
    }

    return null;
  };

  // Calculer l'erreur de validation en temps réel
  const validationError = validateEmail(inviteEmail);

  // Vérifier si on peut activer le bouton d'envoi
  const canSendInvite = inviteEmail.trim() && isValidEmailFormat(inviteEmail) && !validationError;

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim() || validationError) return;

    try {
      await inviteByEmailMutation.mutateAsync({
        folderId,
        email: inviteEmail,
        permission: invitePermission,
      });

      // Show checkmark
      setInviteSent(true);

      // Reset form after 2 seconds
      setTimeout(() => {
        setInviteEmail("");
        setInvitePermission("view");
        setInviteSent(false);
      }, 2000);
    } catch (error: any) {
      // Détecter si c'est une erreur de limite de partage
      if (error?.message?.includes("limite de partage")) {
        const upgradeMessage = isProUser
          ? "Limite atteinte.\nPassez à Team pour plus de membres"
          : "Limite atteinte.\nPassez à Pro pour plus de membres";
        setInviteError(upgradeMessage);
      } else {
        // Logger uniquement les erreurs inattendues
        console.error("Error inviting by email:", error);
        setInviteError(error?.message || "Erreur lors de l'envoi");
      }

      setTimeout(() => setInviteError(null), 4000);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[calc(50vh-250px)] pointer-events-none">
        <div
          className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] h-fit pointer-events-auto flex flex-col p-8 gap-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-8 top-8 w-9 h-9 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X
              className="w-9 h-9 hover:text-[#FF5070] transition-colors"
              strokeWidth={2}
            />
          </button>

          {/* Frame 61 */}
          <div className="flex flex-col items-start gap-6 w-full">
            {/* Title */}
            <h2
              className="text-[32px] leading-[90%] font-extrabold text-[#0D0D0D] w-full"
              style={{ fontFamily: "Area Inktrap, sans-serif" }}
            >
              Partager
            </h2>

            {/* Tabs */}
            <div className="flex flex-row gap-2 w-full border-b-2 border-black">
              <div className="flex-1">
                <Tooltip
                  content="Le partage par lien nécessite le plan Pro ou Team"
                  disabled={!isFreeUser}
                  className="w-full"
                >
                  <button
                    onClick={() => !isFreeUser && setActiveTab("link")}
                    disabled={isFreeUser}
                    className={`w-full pb-3 text-[18px] font-bold font-[Heebo] transition-colors ${
                      isFreeUser
                        ? "text-[#A8A8A8] opacity-50 cursor-not-allowed"
                        : activeTab === "link"
                        ? "text-[#0D0D0D] border-b-4 border-[#0D0D0D] -mb-[2px] cursor-pointer"
                        : "text-[#A8A8A8] hover:text-[#0D0D0D] cursor-pointer"
                    }`}
                  >
                    Lien de partage
                  </button>
                </Tooltip>
              </div>
              <button
                onClick={() => setActiveTab("email")}
                className={`flex-1 pb-3 text-[18px] font-bold font-[Heebo] transition-colors cursor-pointer ${
                  activeTab === "email"
                    ? "text-[#0D0D0D] border-b-4 border-[#0D0D0D] -mb-[2px]"
                    : "text-[#A8A8A8] hover:text-[#0D0D0D]"
                }`}
              >
                Inviter par email
              </button>
            </div>

            {/* Tab Content - Link */}
            <AnimatePresence mode="wait">
              {activeTab === "link" && (
                <motion.div
                  key="link"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: "hidden", width: "100%" }}
                  className="flex flex-col items-center pb-2"
                >
                  <div className="flex flex-col gap-4 w-full max-w-md px-2">
                    <p className="text-[16px] text-[#A8A8A8] font-[Heebo] w-full text-center">
                      Créez un lien que vous pouvez partager avec n&apos;importe qui
                    </p>

                {/* Radio Buttons */}
                <div className="flex flex-col gap-2 w-full">
                  {/* Lecture seule */}
                  <div
                    onClick={() => setSelectedPermission("view")}
                    className="flex flex-row items-center gap-2 w-full cursor-pointer hover:opacity-70 transition-opacity"
                  >
                    <div className="flex items-center justify-center w-[31px] h-[31px]">
                      <div className="relative w-[24px] h-[24px] bg-[#FEF8EE] border-2 border-black rounded-full flex items-center justify-center">
                        {selectedPermission === "view" && (
                          <div className="w-[16px] h-[16px] bg-[#0D0D0D] rounded-full" />
                        )}
                      </div>
                    </div>
                    <span className="text-[18px] leading-[24px] tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo]">
                      Lecture seule
                    </span>
                  </div>

                  {/* Lecture et édition */}
                  <Tooltip
                    content="Le partage avec droits d'édition nécessite le plan Pro ou Team"
                    disabled={!isFreeUser}
                  >
                    <div
                      onClick={() =>
                        !isFreeUser && setSelectedPermission("edit")
                      }
                      className={`flex flex-row items-center gap-2 w-full transition-opacity ${
                        isFreeUser
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer hover:opacity-70"
                      }`}
                    >
                      <div className="flex items-center justify-center w-[31px] h-[31px]">
                        <div className="relative w-[24px] h-[24px] bg-[#FEF8EE] border-2 border-black rounded-full flex items-center justify-center">
                          {selectedPermission === "edit" && (
                            <div className="w-[16px] h-[16px] bg-[#0D0D0D] rounded-full" />
                          )}
                        </div>
                      </div>
                      <span className="text-[18px] leading-[24px] tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo]">
                        Lecture et édition
                      </span>
                    </div>
                  </Tooltip>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  className="w-full h-[46px] bg-[#2D2D2D] hover:bg-[#4D4D4D] border-2 border-black rounded-xl text-white text-[18px] font-bold font-[Heebo] transition-all cursor-pointer active:translate-y-[2px] active:shadow-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                >
                  Générer un lien
                </button>

                {/* Error Message */}
                {generateError && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">
                      {generateError}
                    </p>
                  </div>
                )}

                {/* Share Link Display (shown if URL exists) */}
                {generatedShareUrl && (
                  <div className="flex flex-col gap-2 w-full">
                    <span className="text-[14px] font-medium text-[#0D0D0D] font-[Heebo]">
                      Lien généré
                    </span>
                    <div className="flex flex-row items-center justify-center px-2.5 gap-2.5 w-full h-[46px] bg-[#FEF8EE] border-2 border-black rounded-xl">
                      <span className="flex-1 text-[16px] leading-[24px] tracking-[-0.03em] font-normal text-[#0D0D0D] font-[Heebo] truncate">
                        {generatedShareUrl}
                      </span>
                      <button
                        onClick={handleCopyLink}
                        className="flex-shrink-0 cursor-pointer hover:opacity-70 transition-opacity"
                      >
                        <Copy
                          className="w-6 h-6 text-[#0D0D0D]"
                          strokeWidth={2}
                        />
                      </button>
                    </div>
                  </div>
                )}

                    {/* Loading state */}
                    {createPublicShare.isPending && (
                      <p className="text-[14px] text-[#A8A8A8] font-[Heebo]">
                        Génération du lien en cours...
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Tab Content - Email */}
              {activeTab === "email" && (
                <motion.div
                  key="email"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: "hidden", width: "100%" }}
                  className="flex flex-col items-center pb-2"
                >
                  <div className="flex flex-col gap-4 w-full max-w-md px-2">
                    <p className="text-[16px] text-[#A8A8A8] font-[Heebo] w-full text-center">
                      Invitez une personne spécifique par son adresse email
                    </p>

                    {/* Email Input */}
                    <div className="flex flex-col gap-2 w-full">
                      <label className="text-[14px] font-medium text-[#0D0D0D] font-[Heebo]">
                        Adresse email
                      </label>
                      <input
                        type="email"
                        placeholder="exemple@email.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full h-[44px] px-3 bg-white border-2 border-black rounded-xl text-base leading-[23px] tracking-[-0.03em] font-normal text-[#0D0D0D] placeholder-[#A8A8A8] focus:outline-none transition-colors font-[Heebo]"
                      />
                    </div>

                    {/* Permission Selection for Email Invite */}
                    <div className="flex flex-col gap-2 w-full">
                      <label className="text-[14px] font-medium text-[#0D0D0D] font-[Heebo]">
                        Niveau d&apos;accès
                      </label>
                      <div className="flex flex-col gap-2 w-full">
                        {/* Lecture seule */}
                        <div
                          onClick={() => setInvitePermission("view")}
                          className="flex flex-row items-center gap-2 w-full cursor-pointer hover:opacity-70 transition-opacity"
                        >
                          <div className="flex items-center justify-center w-[31px] h-[31px]">
                            <div className="relative w-[24px] h-[24px] bg-[#FEF8EE] border-2 border-black rounded-full flex items-center justify-center">
                              {invitePermission === "view" && (
                                <div className="w-[16px] h-[16px] bg-[#0D0D0D] rounded-full" />
                              )}
                            </div>
                          </div>
                          <span className="text-[18px] leading-[24px] tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo]">
                            Lecture seule
                          </span>
                        </div>

                        {/* Lecture et édition */}
                        <Tooltip
                          content="Le partage avec droits d'édition nécessite le plan Pro ou Team"
                          disabled={!isFreeUser}
                        >
                          <div
                            onClick={() =>
                              !isFreeUser && setInvitePermission("edit")
                            }
                            className={`flex flex-row items-center gap-2 w-full transition-opacity ${
                              isFreeUser
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer hover:opacity-70"
                            }`}
                          >
                            <div className="flex items-center justify-center w-[31px] h-[31px]">
                              <div className="relative w-[24px] h-[24px] bg-[#FEF8EE] border-2 border-black rounded-full flex items-center justify-center">
                                {invitePermission === "edit" && (
                                  <div className="w-[16px] h-[16px] bg-[#0D0D0D] rounded-full" />
                                )}
                              </div>
                            </div>
                            <span className="text-[18px] leading-[24px] tracking-[-0.03em] font-medium text-[#0D0D0D] font-[Heebo]">
                              Lecture et édition
                            </span>
                          </div>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Invite Button */}
                    <button
                      onClick={handleInviteByEmail}
                      disabled={
                        !canSendInvite ||
                        !!inviteError ||
                        inviteByEmailMutation.isPending ||
                        inviteSent
                      }
                      className={`w-full h-[46px] border-2 border-black rounded-xl text-white text-[18px] font-bold font-[Heebo] transition-all flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                        inviteSent
                          ? "bg-green-600 hover:bg-green-600 cursor-pointer"
                          : "bg-[#2D2D2D] hover:bg-[#4D4D4D] disabled:bg-[#A8A8A8] disabled:cursor-not-allowed cursor-pointer active:enabled:translate-y-[2px] active:enabled:shadow-none"
                      }`}
                    >
                      {inviteSent ? (
                        <>
                          <Check className="w-5 h-5" strokeWidth={3} />
                          Invitation envoyée
                        </>
                      ) : inviteByEmailMutation.isPending ? (
                        "Envoi en cours..."
                      ) : (
                        "Envoyer l'invitation"
                      )}
                    </button>

                    {/* Error Message */}
                    {(validationError || inviteError) && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">
                          {validationError || inviteError}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
