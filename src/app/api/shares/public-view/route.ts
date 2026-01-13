import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ShareFactory from "@/lib/shares/shareFactory";

/**
 * API publique pour accéder à un dossier partagé sans authentification
 * Retourne les informations du dossier et son contenu (liens)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }

    // Utiliser le service role pour accéder aux données sans authentification
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Valider le token via le service
    const shareService = ShareFactory.createShareService(supabase);
    const validation = await shareService.validateShareToken(token);

    if (!validation.isValid || !validation.share) {
      return NextResponse.json(
        {
          isValid: false,
          reason: validation.reason || "Ce lien de partage n'est pas valide",
        },
        { status: 404 }
      );
    }

    const share = validation.share;

    // Récupérer les informations du dossier
    const { data: folder, error: folderError } = await supabase
      .from("folders")
      .select("id, name, slug, user_id, created_at, updated_at")
      .eq("id", share.folder_id)
      .single();

    if (folderError || !folder) {
      return NextResponse.json(
        { error: "Dossier introuvable" },
        { status: 404 }
      );
    }

    // Récupérer le propriétaire du dossier
    const { data: owner } = await supabase
      .from("users")
      .select("username, email")
      .eq("id", folder.user_id)
      .single();

    // Récupérer les liens du dossier
    const { data: links, error: linksError } = await supabase
      .from("links")
      .select(`
        id,
        url,
        title,
        description,
        original_image_url,
        screenshot_url,
        image_format,
        created_at,
        tags:link_tags(
          tag:tags(id, name)
        )
      `)
      .eq("folder_id", share.folder_id)
      .order("created_at", { ascending: false });

    if (linksError) {
      console.error("Error fetching links:", linksError);
    }

    // Transformer les liens pour aplatir les tags
    const transformedLinks = (links || []).map((link) => ({
      ...link,
      tags: link.tags
        ?.map((lt: any) => lt.tag)
        .filter(Boolean) || [],
    }));

    // Récupérer les sous-dossiers
    const { data: subFolders, error: subFoldersError } = await supabase
      .from("folders")
      .select("id, name, slug, updated_at, link_count, preview_images")
      .eq("parent_folder_id", share.folder_id)
      .order("position", { ascending: true });

    if (subFoldersError) {
      console.error("Error fetching subfolders:", subFoldersError);
    }

    return NextResponse.json({
      isValid: true,
      share: {
        id: share.id,
        permission: share.permission,
        expires_at: share.expires_at,
      },
      folder: {
        id: folder.id,
        name: folder.name,
        slug: folder.slug,
        created_at: folder.created_at,
        updated_at: folder.updated_at,
        owner: owner
          ? {
              username: owner.username,
              email: owner.email?.replace(
                /(.{2})(.*)(@.*)/,
                "$1***$3"
              ), // Masquer partiellement l'email
            }
          : null,
      },
      subFolders: subFolders || [],
      links: transformedLinks,
    });
  } catch (error) {
    console.error("Error in public share view:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du dossier partagé" },
      { status: 500 }
    );
  }
}
