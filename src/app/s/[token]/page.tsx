"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/infra/db/supabase";
import { Loader2, AlertCircle, Lock } from "lucide-react";

interface ShareValidation {
  isValid: boolean;
  reason?: string;
  share?: {
    id: string;
    folder_id: string;
    permission: string;
    shared_with_email: string | null;
    expires_at: string | null;
  };
}

export default function ShareTokenPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ShareValidation | null>(null);

  useEffect(() => {
    async function handleShareLink() {
      try {
        setLoading(true);

        // 1. Check if user is authenticated FIRST
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // User not authenticated - show login prompt (don't validate token yet)
          setLoading(false);
          return;
        }

        // 2. User is authenticated - validate the share token
        const response = await fetch(`/api/shares/validate?token=${token}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const data = await response.json();

        if (!response.ok || !data.isValid) {
          setError(data.reason || "Ce lien de partage n'est pas valide");
          setLoading(false);
          return;
        }

        setValidation(data);

        // 3. Create a permanent share for this user (if not already exists)
        // First, get the folder owner to use as shared_by
        const { data: folderOwner } = await supabase
          .from("folders")
          .select("user_id")
          .eq("id", data.share.folder_id)
          .single();

        if (folderOwner) {
          // Check if user already has a share for this folder
          const { data: existingUserShare } = await supabase
            .from("shares")
            .select("id")
            .eq("folder_id", data.share.folder_id)
            .eq("shared_with_email", session.user.email)
            .maybeSingle();

          if (!existingUserShare) {
            // User doesn't have a share yet, create one
            const { error: createShareError } = await supabase
              .from("shares")
              .insert({
                folder_id: data.share.folder_id,
                shared_by: folderOwner.user_id, // Owner of the folder
                shared_with_email: session.user.email,
                permission: data.share.permission,
                is_active: true,
                share_token: null, // This is a personal share, not a public link
              });

            if (createShareError) {
              console.error("Error creating user share:", createShareError);
              // Don't block the user, just log the error
            }
          }
        }

        // 4. Get folder info and redirect to the shared folder
        const { data: folderData, error: folderError } = await supabase
          .from("folders")
          .select("slug, user_id, is_group, parent_folder_id")
          .eq("id", data.share.folder_id)
          .single();

        if (folderError || !folderData) {
          setError("Impossible de trouver le dossier partagé");
          setLoading(false);
          return;
        }

        // 5. Redirect based on folder type
        if (folderData.is_group) {
          // C'est un groupe → rediriger vers /[slug]
          router.push(`/${folderData.slug}`);
        } else if (folderData.parent_folder_id) {
          // C'est un dossier dans un groupe → récupérer le slug du groupe parent
          const { data: parentGroup } = await supabase
            .from("folders")
            .select("slug")
            .eq("id", folderData.parent_folder_id)
            .single();

          if (parentGroup) {
            router.push(`/${parentGroup.slug}/${folderData.slug}`);
          } else {
            // Fallback si le groupe parent n'existe pas
            router.push(`/app/${folderData.slug}`);
          }
        } else {
          // C'est un dossier racine (sans groupe) → rediriger vers /app/[slug]
          router.push(`/app/${folderData.slug}`);
        }

      } catch (err) {
        console.error("Error handling share link:", err);
        setError("Une erreur s'est produite lors du chargement du partage");
        setLoading(false);
      }
    }

    handleShareLink();
  }, [token, router]);

  const handleLogin = () => {
    // Redirect to login with the share token in the URL
    router.push(`/login?redirect=${encodeURIComponent(`/s/${token}`)}`);
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
            className="w-full h-[46px] bg-[#0D0D0D] hover:bg-[#2D2D2D] border-2 border-black rounded-xl text-white text-[18px] font-bold font-[Heebo] transition-colors"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  // User not authenticated - show login prompt
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FEF8EE] p-4">
      <div className="bg-white border-4 border-black rounded-[24px] shadow-[4px_4px_0px_#000000] w-full max-w-[479px] p-8 flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-[#FEF8EE] border-2 border-black rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-[#0D0D0D]" strokeWidth={2} />
        </div>
        <h1
          className="text-[32px] leading-[90%] font-extrabold text-[#0D0D0D] text-center"
          style={{ fontFamily: "Area Inktrap, sans-serif" }}
        >
          Dossier partagé
        </h1>
        <p className="text-[16px] text-[#A8A8A8] font-[Heebo] text-center">
          Quelqu&apos;un a partagé un dossier avec vous.
          <br />
          Connectez-vous pour y accéder.
        </p>
        <button
          onClick={handleLogin}
          className="w-full h-[46px] bg-[#0D0D0D] hover:bg-[#2D2D2D] active:bg-[#000000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] focus:bg-[#2D2D2D] focus:outline-none border-2 border-black rounded-xl shadow-[3px_3px_0px_#000000] text-white text-[18px] font-bold font-[Heebo] transition-all cursor-pointer"
        >
          Se connecter pour voir
        </button>
      </div>
    </div>
  );
}
