"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/infra/db/supabase";
import { Loader2, AlertCircle, Bookmark, X, ArrowLeft } from "lucide-react";
import FolderCard from "@/components/FolderCard";
import ImageCard from "@/components/ImageCard";
import VideoCard from "@/components/VideoCard";
import DetailedLinkCard from "@/components/DetailedLinkCard";
import { getVideoPlatformInfo } from "@/utils/linkUtils";
import { formatDateAdded, formatLastUpdate } from "@/utils/formatters";
import Image from "next/image";

// Fonction locale pour déterminer le type de contenu (version simplifiée pour les données partielles)
function getContentTypeFromPartial(link: {
  url: string;
  original_image_url?: string;
  image_format?: string;
}): "image" | "video" | "link" {
  // Détecter les vidéos par URL
  if (link.url) {
    const url = link.url.toLowerCase();
    if (
      url.includes("youtube.com") ||
      url.includes("youtu.be") ||
      url.includes("vimeo.com") ||
      url.includes("dailymotion.com")
    ) {
      return "video";
    }
  }

  // Si on a une image originale ou un format d'image, c'est une image
  if (link.original_image_url || link.image_format) {
    return "image";
  }

  // Par défaut : c'est un lien classique
  return "link";
}

interface SharedFolderData {
  isValid: boolean;
  reason?: string;
  share?: {
    id: string;
    permission: string;
    expires_at: string | null;
  };
  folder?: {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
    owner: {
      username: string;
      email: string;
    } | null;
  };
  subFolders?: Array<{
    id: string;
    name: string;
    slug: string;
    updated_at: string;
    link_count: number;
    preview_images: string[];
  }>;
  links?: Array<{
    id: string;
    url: string;
    title: string;
    description: string;
    original_image_url: string;
    screenshot_url: string;
    image_format: string;
    created_at: string;
    tags: Array<{ id: string; name: string }>;
  }>;
}

export default function ShareTokenPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SharedFolderData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showSaveBanner, setShowSaveBanner] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadSharedFolder() {
      try {
        setLoading(true);

        // Vérifier si l'utilisateur est connecté
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);

        // Charger le dossier partagé via l'API publique
        const response = await fetch(`/api/shares/public-view?token=${token}`);
        const result = await response.json();

        if (!response.ok || !result.isValid) {
          setError(result.reason || "Ce lien de partage n'est pas valide");
          setLoading(false);
          return;
        }

        setData(result);

        // Si l'utilisateur est connecté, vérifier s'il a déjà sauvegardé ce partage
        if (session && result.folder) {
          const { data: existingShare } = await supabase
            .from("shares")
            .select("id")
            .eq("folder_id", result.folder.id)
            .eq("shared_with_email", session.user.email)
            .maybeSingle();

          if (existingShare) {
            setSaveSuccess(true);
            setShowSaveBanner(false);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading shared folder:", err);
        setError("Une erreur s'est produite lors du chargement du partage");
        setLoading(false);
      }
    }

    loadSharedFolder();
  }, [token]);

  const handleSaveAccess = async () => {
    if (!isAuthenticated) {
      // Rediriger vers la connexion avec le token de partage
      router.push(`/login?redirect=${encodeURIComponent(`/s/${token}`)}`);
      return;
    }

    // Sauvegarder l'accès pour l'utilisateur connecté
    setIsSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !data?.folder) {
        throw new Error("Session invalide");
      }

      // Récupérer le propriétaire du dossier
      const { data: folderOwner } = await supabase
        .from("folders")
        .select("user_id")
        .eq("id", data.folder.id)
        .single();

      if (!folderOwner) {
        throw new Error("Dossier introuvable");
      }

      // Vérifier si l'utilisateur a déjà un share
      const { data: existingShare } = await supabase
        .from("shares")
        .select("id")
        .eq("folder_id", data.folder.id)
        .eq("shared_with_email", session.user.email)
        .maybeSingle();

      if (!existingShare) {
        // Créer un share personnel pour cet utilisateur
        const { error: createError } = await supabase.from("shares").insert({
          folder_id: data.folder.id,
          shared_by: folderOwner.user_id,
          shared_with_email: session.user.email,
          permission: data.share?.permission || "view",
          is_active: true,
          share_token: null,
        });

        if (createError) {
          throw createError;
        }
      }

      setSaveSuccess(true);
      setShowSaveBanner(false);
    } catch (err) {
      console.error("Error saving access:", err);
      alert("Erreur lors de la sauvegarde de l'accès");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToApp = () => {
    if (data?.folder) {
      router.push(`/app/${data.folder.slug}`);
    } else {
      router.push("/app");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FEF8EE]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#0D0D0D]" />
          <p className="text-[18px] font-[Heebo] text-[#A8A8A8]">
            Chargement du partage...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FEF8EE] p-4">
        <div className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] p-8 flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-red-100 border-2 border-black rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" strokeWidth={2} />
          </div>
          <h1
            className="text-[32px] leading-[90%] font-extrabold text-[#0D0D0D] text-center"
            style={{ fontFamily: "Area Inktrap, sans-serif" }}
          >
            Lien invalide
          </h1>
          <p className="text-[16px] text-[#A8A8A8] font-[Heebo] text-center">
            {error}
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full h-[46px] bg-[#0D0D0D] hover:bg-[#2D2D2D] border-2 border-black rounded-xl text-white text-[18px] font-bold font-[Heebo] transition-colors cursor-pointer"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  // Séparer les liens par type
  const imageLinks =
    data?.links?.filter((link) => getContentTypeFromPartial(link) === "image") || [];
  const videoLinks =
    data?.links?.filter((link) => getContentTypeFromPartial(link) === "video") || [];
  const regularLinks =
    data?.links?.filter((link) => getContentTypeFromPartial(link) === "link") || [];

  return (
    <div className="min-h-screen w-full bg-[#FEF8EE]">
      {/* Header minimaliste */}
      <header className="w-full bg-white border-b-[3px] border-black">
        <div className="w-full px-[22px] py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/UnBlank-dark.svg"
              alt="UnBlank"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
          </div>
          {saveSuccess ? (
            <button
              onClick={handleGoToApp}
              className="h-11 px-5 rounded-xl border-2 border-black bg-[#FF506F] hover:bg-[#FF6080] text-black font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voir dans mon espace
            </button>
          ) : (
            <button
              onClick={handleSaveAccess}
              disabled={isSaving}
              className="h-11 px-5 rounded-xl border-2 border-black bg-[#FF506F] hover:bg-[#FF6080] text-black font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Bookmark className="w-4 h-4" />
              {isSaving
                ? "Enregistrement..."
                : isAuthenticated
                ? "Sauvegarder l'accès"
                : "Se connecter pour sauvegarder"}
            </button>
          )}
        </div>
      </header>

      {/* Bandeau de sauvegarde */}
      {showSaveBanner && !saveSuccess && (
        <div className="w-full bg-[#FFE3E8] border-b-2 border-black px-[22px] py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Bookmark className="w-5 h-5 text-[#0D0D0D]" />
              <p className="text-sm font-[Heebo] text-[#0D0D0D]">
                <strong>
                  {data?.folder?.owner?.username || "Quelqu'un"}
                </strong>{" "}
                a partagé ce dossier avec vous.{" "}
                {isAuthenticated
                  ? "Sauvegardez-le pour y accéder depuis votre espace."
                  : "Connectez-vous ou créez un compte pour le conserver."}
              </p>
            </div>
            <button
              onClick={() => setShowSaveBanner(false)}
              className="p-1 hover:bg-black/10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-[#0D0D0D]" />
            </button>
          </div>
        </div>
      )}

      {/* Contenu du dossier */}
      <main className="w-full px-[22px] py-[22px] flex flex-col gap-8">
        {/* Titre du dossier */}
        <div className="flex flex-col gap-2">
          <h1
            className="text-[40px] leading-[90%] font-extrabold text-[#0D0D0D]"
            style={{ fontFamily: "Area Inktrap, sans-serif" }}
          >
            {data?.folder?.name}
          </h1>
          {data?.folder?.owner && (
            <p className="text-[16px] text-[#A8A8A8] font-[Heebo]">
              Partagé par{" "}
              <strong>{data.folder.owner.username || "un utilisateur"}</strong>
            </p>
          )}
        </div>

        {/* Section Sous-dossiers */}
        {data?.subFolders && data.subFolders.length > 0 && (
          <section className="flex flex-col items-start gap-[21px] w-full">
            <h2
              className="text-[24px] leading-[32px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: "Area Inktrap, sans-serif" }}
            >
              Sous-dossiers ({data.subFolders.length})
            </h2>
            <div className="flex flex-row flex-wrap gap-8 w-full">
              {data.subFolders.map((subFolder) => (
                <FolderCard
                  key={subFolder.id}
                  id={subFolder.id}
                  title={subFolder.name}
                  slug={subFolder.slug}
                  itemCount={subFolder.link_count || 0}
                  lastUpdate={formatLastUpdate(subFolder.updated_at)}
                  isSystem={false}
                  previewImages={subFolder.preview_images}
                  canDelete={false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section Images */}
        {imageLinks.length > 0 && (
          <section className="flex flex-col items-start gap-[21px] w-full">
            <h2
              className="text-[24px] leading-[32px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: "Area Inktrap, sans-serif" }}
            >
              Images ({imageLinks.length})
            </h2>
            <div className="flex flex-row flex-wrap gap-8 w-full">
              {imageLinks.map((link) => (
                <ImageCard
                  key={link.id}
                  linkId={link.id}
                  imageUrl={link.original_image_url || link.screenshot_url || ""}
                  link={link.url}
                  fileType={link.image_format?.toUpperCase() || "IMG"}
                  dimensions="N/A"
                  fileSize="N/A"
                  dateAdded={formatDateAdded(link.created_at)}
                  folder={data?.folder?.name || ""}
                  tags={link.tags?.map((t) => t.name) || []}
                  isSelectionMode={false}
                  canDelete={false}
                  canEdit={false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section Vidéos */}
        {videoLinks.length > 0 && (
          <section className="flex flex-col items-start gap-[21px] w-full">
            <h2
              className="text-[24px] leading-[32px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: "Area Inktrap, sans-serif" }}
            >
              Vidéos ({videoLinks.length})
            </h2>
            <div className="flex flex-row flex-wrap gap-8 w-full">
              {videoLinks.map((link) => {
                const platformInfo = getVideoPlatformInfo(link.url);
                return (
                  <VideoCard
                    key={link.id}
                    linkId={link.id}
                    platformName={platformInfo.platformName}
                    platformUrl={platformInfo.platformUrl}
                    videoUrl={link.url}
                    thumbnailUrl={link.screenshot_url || link.original_image_url || ""}
                    title={link.title || "Vidéo sans titre"}
                    description={link.description || ""}
                    tags={link.tags?.map((t) => t.name) || []}
                    isSelectionMode={false}
                    isSelected={false}
                    canDelete={false}
                    canEdit={false}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Section Liens */}
        {regularLinks.length > 0 && (
          <section className="flex flex-col items-start gap-[21px] w-full">
            <h2
              className="text-[24px] leading-[32px] tracking-[-0.03em] font-extrabold text-[#0D0D0D]"
              style={{ fontFamily: "Area Inktrap, sans-serif" }}
            >
              Liens ({regularLinks.length})
            </h2>
            <div className="flex flex-row flex-wrap gap-8 w-full">
              {regularLinks.map((link) => {
                let siteName = link.title || "";
                let siteUrl = "";
                try {
                  const url = new URL(link.url);
                  siteName = link.title || url.hostname.replace("www.", "");
                  siteUrl = url.hostname;
                } catch {
                  siteName = link.title || link.url;
                }

                return (
                  <DetailedLinkCard
                    key={link.id}
                    linkId={link.id}
                    siteName={siteName}
                    siteUrl={siteUrl}
                    description={link.description || ""}
                    link={link.url}
                    tags={link.tags?.map((t) => t.name) || []}
                    isSelectionMode={false}
                    canDelete={false}
                    canEdit={false}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Message si dossier vide */}
        {(!data?.links || data.links.length === 0) &&
          (!data?.subFolders || data.subFolders.length === 0) && (
            <div className="flex items-center justify-center py-16">
              <p className="text-gray-500">Ce dossier est vide</p>
            </div>
          )}
      </main>
    </div>
  );
}
