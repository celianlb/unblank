import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import FolderFactory from '@/lib/folders/folderFactory';
import { handleCorsPreFlight, addCorsHeaders } from '@/lib/api/cors';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

/**
 * PATCH /api/folders/[folderId]
 * Renomme un dossier
 * Vérifie les permissions (propriétaire ou permission edit via shares)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  const origin = request.headers.get('origin');

  try {
    // Await params (Next.js 15 requirement)
    const { folderId } = await params;

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

    const body = await request.json();
    const { newName } = body;

    if (!newName || newName.trim().length === 0) {
      const response = NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // ✅ Vérifier les permissions
    // 1. Vérifier si l'utilisateur est le propriétaire
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

    // 2. Si pas propriétaire, vérifier les permissions de partage
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
          { error: 'You do not have permission to rename this folder' },
          { status: 403 }
        );
        return addCorsHeaders(response, origin);
      }
    }

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const folderService = FolderFactory.createFolderService(supabase);

    // Rename folder using the domain service
    const renamedFolder = await folderService.renameFolder(folderId, newName);

    if (!renamedFolder) {
      const response = NextResponse.json(
        { error: 'Failed to rename folder' },
        { status: 500 }
      );
      return addCorsHeaders(response, origin);
    }

    const response = NextResponse.json({
      success: true,
      folder: renamedFolder
    });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error in folders PATCH API:', error);
    const response = NextResponse.json(
      { error: 'Failed to rename folder' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}

