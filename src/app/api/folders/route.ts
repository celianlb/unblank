import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import FolderFactory from '@/lib/folders/folderFactory';

export async function GET(request: NextRequest) {
  try {
    // Get the access token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const folderService = FolderFactory.createFolderService(supabase);

    // Fetch user's folders and groups using the domain service
    const [folders, groups] = await Promise.all([
      folderService.getUserFolders(user.id),
      folderService.getUserGroups(user.id)
    ]);

    return NextResponse.json({
      folders,
      groups,
      all: [...groups, ...folders] // Combined list for convenience
    });
  } catch (error) {
    console.error('Error in folders API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the access token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, parentFolderId, isGroup } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    // ✅ Vérifier les permissions si on crée dans un groupe partagé
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
        return NextResponse.json(
          { error: 'You do not have permission to create folders in this group' },
          { status: 403 }
        );
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
      return NextResponse.json(
        { error: 'Failed to create folder' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      folder
    });
  } catch (error) {
    console.error('Error in folders POST API:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}

