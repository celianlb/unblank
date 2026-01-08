import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import LinkFactory from '@/lib/links/linkFactory';
import ShareFactory from '@/lib/shares/shareFactory';
import { handleCorsPreFlight, addCorsHeaders } from '@/lib/api/cors';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

/**
 * DELETE /api/links/[linkId]
 * Supprime un seul lien
 * Vérifie les permissions (propriétaire ou permission edit via shares sur le dossier parent)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const origin = request.headers.get('origin');

  try {
    // Await params (Next.js 15 requirement)
    const { linkId } = await params;

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

    // ✅ CLEAN ARCHITECTURE: Récupérer les informations de propriété via LinkService
    const linkService = LinkFactory.createLinkService(supabase);
    const link = await linkService.getLinkOwnership(linkId);

    if (!link) {
      const response = NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, origin);
    }

    // ✅ CLEAN ARCHITECTURE: Vérifier les permissions via ShareService
    const isOwner = link.userId === user.id;

    if (!isOwner) {
      if (!link.folderId) {
        // Lien sans dossier et pas le propriétaire : interdit
        const response = NextResponse.json(
          { error: 'You do not have permission to delete this link' },
          { status: 403 }
        );
        return addCorsHeaders(response, origin);
      }

      const shareService = ShareFactory.createShareService(supabase);
      const hasEditPermission = await shareService.hasEditPermission(link.folderId, user.id, user.email!);

      if (!hasEditPermission) {
        const response = NextResponse.json(
          { error: 'You do not have permission to delete this link' },
          { status: 403 }
        );
        return addCorsHeaders(response, origin);
      }
    }

    // Delete link using the domain service
    const success = await linkService.deleteLink(linkId);

    if (!success) {
      const response = NextResponse.json(
        { error: 'Failed to delete link' },
        { status: 500 }
      );
      return addCorsHeaders(response, origin);
    }

    const response = NextResponse.json({
      success: true,
    });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error in links DELETE API:', error);
    const response = NextResponse.json(
      { error: 'Failed to delete link' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}

