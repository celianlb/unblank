import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import FolderFactory from '@/lib/folders/folderFactory';
import { handleCorsPreFlight, addCorsHeaders } from '@/lib/api/cors';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

/**
 * PATCH /api/folders/[folderId]/move
 * Déplace un dossier vers un autre dossier parent
 * Vérifie les permissions (propriétaire ou permission edit via shares)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  const origin = request.headers.get('origin');

  try {
    const { folderId } = await params;

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
    const { parentFolderId } = body;

    // Vérifier les permissions sur le dossier à déplacer
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
          { error: 'You do not have permission to move this folder' },
          { status: 403 }
        );
        return addCorsHeaders(response, origin);
      }
    }

    // Si on déplace vers un dossier parent, vérifier les permissions sur le dossier de destination
    if (parentFolderId) {
      const { data: targetFolder } = await supabase
        .from('folders')
        .select('user_id')
        .eq('id', parentFolderId)
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
          .eq('folder_id', parentFolderId)
          .eq('shared_with_email', user.email)
          .eq('is_active', true)
          .eq('permission', 'edit')
          .maybeSingle();

        const hasTargetEditPermission = targetShare?.permission === 'edit';

        if (!hasTargetEditPermission) {
          const response = NextResponse.json(
            { error: 'You do not have permission to move folders into this folder' },
            { status: 403 }
          );
          return addCorsHeaders(response, origin);
        }
      }
    }

    const folderService = FolderFactory.createFolderService(supabase);

    const success = await folderService.moveFolderToParent(folderId, parentFolderId);

    if (!success) {
      const response = NextResponse.json(
        { error: 'Failed to move folder' },
        { status: 500 }
      );
      return addCorsHeaders(response, origin);
    }

    const response = NextResponse.json({
      success: true,
    });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error in folders move PATCH API:', error);
    const response = NextResponse.json(
      { error: 'Failed to move folder' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}
