import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ShareFactory from '@/lib/shares/shareFactory';

export async function GET(request: NextRequest) {
  try {
    // Get the access token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const shareService = ShareFactory.createShareService(supabase);

    // Get folders shared with this user
    console.log('[SHARED FOLDERS] Fetching for email:', user.email);
    const allShared = await shareService.getSharedFolders(user.email!);
    console.log('[SHARED FOLDERS] Found:', allShared.length, 'total shared items');

    // Séparer les groupes et les dossiers
    const sharedGroups = allShared.filter(item => item.is_group === true);

    // Récupérer tous les groupes que l'utilisateur possède
    const { data: ownedGroups } = await supabase
      .from('folders')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_group', true);

    const ownedGroupIds = new Set(ownedGroups?.map(g => g.id) || []);

    // Pour les dossiers partagés, exclure:
    // 1. Ceux dont le groupe parent est AUSSI partagé (accessibles via le groupe partagé)
    // 2. Ceux dont le groupe parent est possédé par l'utilisateur (accessibles via son propre groupe)
    const sharedGroupIds = new Set(sharedGroups.map(g => g.id));
    const sharedFolders = allShared.filter(item => {
      if (item.is_group) return false; // Pas un dossier

      // Si le dossier n'a pas de parent, toujours l'inclure
      if (!item.parent_folder_id) return true;

      // Exclure si le parent est un groupe partagé OU un groupe possédé
      return !sharedGroupIds.has(item.parent_folder_id) && !ownedGroupIds.has(item.parent_folder_id);
    });

    console.log('[SHARED FOLDERS] Groups:', sharedGroups.length, 'Folders:', sharedFolders.length);

    return NextResponse.json({
      folders: sharedFolders,
      groups: sharedGroups,
      all: allShared
    });
  } catch (error) {
    console.error('Error fetching shared folders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared folders' },
      { status: 500 }
    );
  }
}
