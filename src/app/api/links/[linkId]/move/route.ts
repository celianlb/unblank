import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import LinkFactory from '@/lib/links/linkFactory';
import { handleCorsPreFlight, addCorsHeaders } from '@/lib/api/cors';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

/**
 * PATCH /api/links/[linkId]/move
 * Déplace un lien vers un autre dossier
 * Vérifie les permissions (propriétaire ou permission edit via shares)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const origin = request.headers.get('origin');

  try {
    const { linkId } = await params;

    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
    }

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

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
    }

    const body = await request.json();
    const { targetFolderId } = body;

    // Récupérer le lien avec son dossier actuel
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

    // Vérifier que l'utilisateur est propriétaire du lien
    const isLinkOwner = link.user_id === user.id;

    if (!isLinkOwner) {
      // Vérifier si l'utilisateur a la permission edit sur le dossier source
      if (link.folder_id) {
        const { data: sourceShare } = await supabase
          .from('shares')
          .select('permission')
          .eq('folder_id', link.folder_id)
          .eq('shared_with_email', user.email)
          .eq('is_active', true)
          .eq('permission', 'edit')
          .maybeSingle();

        if (!sourceShare) {
          const response = NextResponse.json(
            { error: 'You do not have permission to move this link' },
            { status: 403 }
          );
          return addCorsHeaders(response, origin);
        }
      } else {
        // Lien sans dossier et l'utilisateur n'est pas propriétaire
        const response = NextResponse.json(
          { error: 'You do not have permission to move this link' },
          { status: 403 }
        );
        return addCorsHeaders(response, origin);
      }
    }

    // Si on déplace vers un dossier, vérifier les permissions sur le dossier de destination
    if (targetFolderId) {
      const { data: targetFolder } = await supabase
        .from('folders')
        .select('user_id')
        .eq('id', targetFolderId)
        .single();

      if (!targetFolder) {
        const response = NextResponse.json(
          { error: 'Target folder not found' },
          { status: 404 }
        );
        return addCorsHeaders(response, origin);
      }

      const isTargetOwner = targetFolder.user_id === user.id;

      if (!isTargetOwner) {
        const { data: targetShare } = await supabase
          .from('shares')
          .select('permission')
          .eq('folder_id', targetFolderId)
          .eq('shared_with_email', user.email)
          .eq('is_active', true)
          .eq('permission', 'edit')
          .maybeSingle();

        if (!targetShare) {
          const response = NextResponse.json(
            { error: 'You do not have permission to move links into this folder' },
            { status: 403 }
          );
          return addCorsHeaders(response, origin);
        }
      }
    }

    const linkService = LinkFactory.createLinkService(supabase);

    const success = await linkService.moveLinkToFolder(linkId, targetFolderId);

    if (!success) {
      const response = NextResponse.json(
        { error: 'Failed to move link' },
        { status: 500 }
      );
      return addCorsHeaders(response, origin);
    }

    const response = NextResponse.json({
      success: true,
    });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error in links move PATCH API:', error);
    const response = NextResponse.json(
      { error: 'Failed to move link' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}
