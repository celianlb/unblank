import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import FolderFactory from '@/lib/folders/folderFactory';
import ShareFactory from '@/lib/shares/shareFactory';
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

    // Fetch user's folders and groups using the domain service
    const [folders, groups] = await Promise.all([
      folderService.getUserFolders(user.id),
      folderService.getUserGroups(user.id)
    ]);

    const response = NextResponse.json({
      folders,
      groups,
      all: [...groups, ...folders] // Combined list for convenience
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
    const { name, parentFolderId, isGroup } = body;

    if (!name) {
      const response = NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // ✅ CLEAN ARCHITECTURE: Vérifier les permissions via ShareService si on crée dans un groupe partagé
    if (parentFolderId) {
      const shareService = ShareFactory.createShareService(supabase);
      const hasEditPermission = await shareService.hasEditPermission(parentFolderId, user.id, user.email!);

      if (!hasEditPermission) {
        const response = NextResponse.json(
          { error: 'You do not have permission to create folders in this group' },
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
      parentFolderId,
      isGroup
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

    // ✅ CLEAN ARCHITECTURE: Récupérer les informations de propriété via FolderService
    const folderService = FolderFactory.createFolderService(supabase);
    const folders = await folderService.getFoldersOwnership(folderIds);

    if (!folders || folders.length !== folderIds.length) {
      const response = NextResponse.json(
        { error: 'Some folders not found' },
        { status: 404 }
      );
      return addCorsHeaders(response, origin);
    }

    // ✅ CLEAN ARCHITECTURE: Vérifier les permissions via ShareService
    const shareService = ShareFactory.createShareService(supabase);

    for (const folder of folders) {
      const isOwner = folder.userId === user.id;

      // Si pas propriétaire, vérifier les permissions
      if (!isOwner) {
        const hasEditPermission = await shareService.hasEditPermission(folder.id, user.id, user.email!);

        if (!hasEditPermission) {
          const response = NextResponse.json(
            { error: `You do not have permission to delete folder ${folder.id}` },
            { status: 403 }
          );
          return addCorsHeaders(response, origin);
        }
      }
    }

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
