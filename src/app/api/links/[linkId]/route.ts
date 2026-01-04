import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import LinkFactory from '@/lib/links/linkFactory';
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

    // ✅ Récupérer le lien avec son dossier parent
    const { data: link } = await supabase
      .from('links')
      .select('user_id, folder_id')
      .eq('id', linkId)
      .single();

    if (!link) {
      const response = NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, origin);
    }

    // ✅ Vérifier les permissions
    // 1. Vérifier si l'utilisateur est le propriétaire du lien
    const isOwner = link.user_id === user.id;

    // 2. Si pas propriétaire, vérifier les permissions via le dossier parent
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
          { error: 'You do not have permission to delete this link' },
          { status: 403 }
        );
        return addCorsHeaders(response, origin);
      }
    } else if (!isOwner && !link.folder_id) {
      // Lien sans dossier et pas le propriétaire : interdit
      const response = NextResponse.json(
        { error: 'You do not have permission to delete this link' },
        { status: 403 }
      );
      return addCorsHeaders(response, origin);
    }

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const linkService = LinkFactory.createLinkService(supabase);

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

