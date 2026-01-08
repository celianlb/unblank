import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import LinkFactory from '@/lib/links/linkFactory';
import ShareFactory from '@/lib/shares/shareFactory';
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
      tags
    } = body;

    if (!url) {
      const response = NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // ✅ CLEAN ARCHITECTURE: Vérifier les permissions via ShareService
    if (folderId) {
      const shareService = ShareFactory.createShareService(supabase);
      const hasEditPermission = await shareService.hasEditPermission(folderId, user.id, user.email!);

      if (!hasEditPermission) {
        const response = NextResponse.json(
          { error: 'You do not have permission to create links in this folder' },
          { status: 403 }
        );
        return addCorsHeaders(response, origin);
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

    // ✅ CLEAN ARCHITECTURE: Récupérer les informations de propriété via LinkRepository
    const linkService = LinkFactory.createLinkService(supabase);
    const links = await linkService.getLinksOwnership(linkIds);

    if (!links || links.length !== linkIds.length) {
      const response = NextResponse.json(
        { error: 'Some links not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, origin);
    }

    // ✅ CLEAN ARCHITECTURE: Vérifier les permissions via ShareService
    const shareService = ShareFactory.createShareService(supabase);

    for (const link of links) {
      const isOwner = link.userId === user.id;

      // Si pas propriétaire, vérifier les permissions
      if (!isOwner) {
        if (!link.folderId) {
          // Lien sans dossier et pas le propriétaire : interdit
          const response = NextResponse.json(
            { error: `You do not have permission to delete link ${link.id}` },
            { status: 403 }
          );
          return addCorsHeaders(response, origin);
        }

        const hasEditPermission = await shareService.hasEditPermission(link.folderId, user.id, user.email!);

        if (!hasEditPermission) {
          const response = NextResponse.json(
            { error: `You do not have permission to delete link ${link.id}` },
            { status: 403 }
          );
          return addCorsHeaders(response, origin);
        }
      }
    }

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
