import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import LinkFactory from '@/lib/links/linkFactory';
import AIFactory from '@/lib/ai/aiFactory';
import { handleCorsPreFlight, addCorsHeaders } from '@/lib/api/cors';
import { LinkLimitError } from '@/infra/links/SupabaseLinkRepository';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    // Get the access token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
    }

    // Create Supabase client with the user's access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
    }

    // Parse request body
    const body = await request.json();
    const {
      url,
      title,
      description,
      folderId,
      originalImageUrl,
      imageFormat,
      contentType,
      tags,
      autoTaggingEnabled
    } = body;

    if (!url) {
      const response = NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // ✅ Vérifier les permissions si on crée dans un dossier partagé
    if (folderId) {
      const { data: folder } = await supabase
        .from('folders')
        .select('user_id')
        .eq('id', folderId)
        .single();

      if (!folder) {
        const response = NextResponse.json(
          { error: 'Folder not found' },
          { status: 404 }
        );
        return addCorsHeaders(response, origin);
      }

      const isOwner = folder.user_id === user.id;

      // Si pas propriétaire, vérifier les permissions de partage
      if (!isOwner) {
        const { data: share } = await supabase
          .from('shares')
          .select('permission')
          .eq('folder_id', folderId)
          .eq('shared_with_email', user.email)
          .eq('is_active', true)
          .eq('permission', 'edit')
          .maybeSingle();

        const hasEditPermission = share?.permission === 'edit';

        if (!hasEditPermission) {
          const response = NextResponse.json(
            { error: 'You do not have permission to create links in this folder' },
            { status: 403 }
          );
          return addCorsHeaders(response, origin);
        }
      }
    }

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const linkService = LinkFactory.createLinkService(supabase);

    // Create link using the domain service
    const link = await linkService.createLink(user.id, {
      url,
      title,
      description,
      folderId,
      originalImageUrl,
      imageFormat,
      contentType,
      tags
    });

    // ✅ Si le tagging automatique est activé, vérifier les permissions puis générer les tags via IA
    if (autoTaggingEnabled && link) {
      // SÉCURITÉ: Vérifier que l'utilisateur a un abonnement actif pour utiliser l'IA
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_plan, subscription_status')
        .eq('id', user.id)
        .single();

      const hasAIAccess =
        userData?.subscription_status === 'active' &&
        (userData?.subscription_plan === 'pro' || userData?.subscription_plan === 'team');

      if (!hasAIAccess) {
        console.log('[Create Link] ⚠️ User attempted AI tagging without active subscription');
        // Ne pas générer de tags, mais ne pas bloquer la création du lien
      } else {
        const imageUrl = link.screenshot_url || link.original_image_url;

        if (imageUrl) {
          console.log('[Create Link] Auto-tagging enabled, scheduling AI tag generation for link:', link.id);

          // Lancement asynchrone sans bloquer la réponse (fire-and-forget)
          const generateAITagsUseCase = AIFactory.createGenerateAITagsUseCase(supabase);

          generateAITagsUseCase.execute({
            linkId: link.id,
            userId: user.id,
            imageUrl,
            linkUrl: link.url,
            linkTitle: link.title || undefined,
            linkDescription: link.description || undefined,
            replaceExisting: false,
          }).then(() => {
            console.log('[Create Link] AI tags generated successfully (background)');
          }).catch((aiError) => {
            console.error('[Create Link] Failed to generate AI tags (background, non-blocking):', aiError);
          });
        } else {
          console.log('[Create Link] No image URL available for AI tagging');
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      link
    });
    return addCorsHeaders(response, origin);
  } catch (error: any) {
    console.error('Error in links API:', error);
    
    // Gérer l'erreur de limite de liens
    if (error instanceof LinkLimitError || error.name === 'LinkLimitError' || error.message?.includes('Limite mensuelle de liens atteinte')) {
      const response = NextResponse.json(
        { 
          error: error.message || 'Limite mensuelle de liens atteinte (50 liens/mois). Passez au plan Pro pour continuer.',
          code: 'LINK_LIMIT_REACHED'
        },
        { status: 403 }
      );
      return addCorsHeaders(response, origin);
    }
    
    const response = NextResponse.json(
      { error: error.message || 'Failed to create link' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}

/**
 * DELETE /api/links
 * Supprime plusieurs liens
 * Vérifie les permissions (propriétaire ou permission edit via shares sur les dossiers parents)
 */
export async function DELETE(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    // Get the access token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
    }

    // Create Supabase client with the user's access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
    }

    // Parse request body
    const body = await request.json();
    const { linkIds } = body;

    if (!linkIds || !Array.isArray(linkIds) || linkIds.length === 0) {
      const response = NextResponse.json(
        { error: 'linkIds array is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // ✅ Vérifier les permissions pour chaque lien
    const { data: links } = await supabase
      .from('links')
      .select('id, user_id, folder_id')
      .in('id', linkIds);

    if (!links || links.length !== linkIds.length) {
      const response = NextResponse.json(
        { error: 'Some links not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, origin);
    }

    // Vérifier les permissions pour chaque lien
    for (const link of links) {
      const isOwner = link.user_id === user.id;

      // Si pas propriétaire, vérifier les permissions via le dossier parent
      if (!isOwner && link.folder_id) {
        const { data: share } = await supabase
          .from('shares')
          .select('permission')
          .eq('folder_id', link.folder_id)
          .eq('shared_with_email', user.email)
          .eq('is_active', true)
          .eq('permission', 'edit')
          .maybeSingle();

        const hasEditPermission = share?.permission === 'edit';

        if (!hasEditPermission) {
          const response = NextResponse.json(
            { error: `You do not have permission to delete link ${link.id}` },
            { status: 403 }
          );
          return addCorsHeaders(response, origin);
        }
      } else if (!isOwner && !link.folder_id) {
        // Lien sans dossier et pas le propriétaire : interdit
        const response = NextResponse.json(
          { error: `You do not have permission to delete link ${link.id}` },
          { status: 403 }
        );
        return addCorsHeaders(response, origin);
      }
    }

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const linkService = LinkFactory.createLinkService(supabase);

    // Delete links using the domain service
    const success = await linkService.deleteLinks(linkIds);

    if (!success) {
      const response = NextResponse.json(
        { error: 'Failed to delete links' },
        { status: 500 }
      );
      return addCorsHeaders(response, origin);
    }

    const response = NextResponse.json({
      success: true,
      deletedCount: linkIds.length
    });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error in links DELETE API:', error);
    const response = NextResponse.json(
      { error: 'Failed to delete links' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}
