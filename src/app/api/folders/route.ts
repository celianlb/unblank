import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import FolderFactory from '@/lib/folders/folderFactory';
import { handleCorsPreFlight, addCorsHeaders } from '@/lib/api/cors';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

export async function GET(request: NextRequest) {
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

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const folderService = FolderFactory.createFolderService(supabase);

    // Fetch user's folders using the domain service
    const folders = await folderService.getUserFolders(user.id);

    const response = NextResponse.json({
      folders
    });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error in folders API:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
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
    const { name, parentFolderId } = body;

    if (!name) {
      const response = NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // ✅ Vérifier les permissions si on crée dans un dossier parent partagé
    if (parentFolderId) {
      const { data: share } = await supabase
        .from('shares')
        .select('permission')
        .eq('folder_id', parentFolderId)
        .eq('shared_with_email', user.email)
        .eq('is_active', true)
        .eq('permission', 'edit')
        .maybeSingle();

      // Vérifier aussi si l'utilisateur est le propriétaire du parent
      const { data: parentFolder } = await supabase
        .from('folders')
        .select('user_id')
        .eq('id', parentFolderId)
        .single();

      const isOwner = parentFolder?.user_id === user.id;
      const hasEditPermission = share?.permission === 'edit';

      if (!isOwner && !hasEditPermission) {
        const response = NextResponse.json(
          { error: 'You do not have permission to create folders in this folder' },
          { status: 403 }
        );
        return addCorsHeaders(response, origin);
      }
    }

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const folderService = FolderFactory.createFolderService(supabase);

    // Create folder using the domain service
    const folder = await folderService.createFolder(
      user.id,
      name,
      parentFolderId
    );

    if (!folder) {
      const response = NextResponse.json(
        { error: 'Failed to create folder' },
        { status: 500 }
      );
      return addCorsHeaders(response, origin);
    }

    const response = NextResponse.json({
      success: true,
      folder
    });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error in folders POST API:', error);
    const response = NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}

/**
 * DELETE /api/folders
 * Supprime plusieurs dossiers
 * Vérifie les permissions (propriétaire ou permission edit via shares)
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
    const { folderIds } = body;

    if (!folderIds || !Array.isArray(folderIds) || folderIds.length === 0) {
      const response = NextResponse.json(
        { error: 'folderIds array is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // ✅ Vérifier les permissions pour chaque dossier
    for (const folderId of folderIds) {
      // 1. Vérifier si l'utilisateur est le propriétaire
      const { data: folder } = await supabase
        .from('folders')
        .select('user_id')
        .eq('id', folderId)
        .single();

      if (!folder) {
        const response = NextResponse.json(
          { error: `Folder ${folderId} not found` },
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
            { error: `You do not have permission to delete folder ${folderId}` },
            { status: 403 }
          );
          return addCorsHeaders(response, origin);
        }
      }
    }

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const folderService = FolderFactory.createFolderService(supabase);

    // Delete folders using the domain service
    const success = await folderService.deleteFolders(folderIds);

    if (!success) {
      const response = NextResponse.json(
        { error: 'Failed to delete folders' },
        { status: 500 }
      );
      return addCorsHeaders(response, origin);
    }

    const response = NextResponse.json({
      success: true,
      deletedCount: folderIds.length
    });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error in folders DELETE API:', error);
    const response = NextResponse.json(
      { error: 'Failed to delete folders' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}
