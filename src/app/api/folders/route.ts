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

