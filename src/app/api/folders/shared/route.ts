import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ShareFactory from '@/lib/shares/shareFactory';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shareService = ShareFactory.createShareService(supabase);

    // Récupérer tous les dossiers partagés avec cet utilisateur
    const allShared = await shareService.getSharedFolders(user.email!);

    // Filtrer pour ne garder que les dossiers top-level partagés
    // (pas les sous-dossiers dont le parent est déjà partagé)
    const sharedParentIds = new Set(allShared.map(f => f.id));
    const sharedFolders = allShared.filter(folder => {
      // Si pas de parent, toujours inclure
      if (!folder.parent_folder_id) return true;
      // Exclure si le parent est aussi partagé (accessible via le parent)
      return !sharedParentIds.has(folder.parent_folder_id);
    });

    return NextResponse.json({
      folders: sharedFolders
    });
  } catch (error) {
    console.error('Error fetching shared folders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared folders' },
      { status: 500 }
    );
  }
}
