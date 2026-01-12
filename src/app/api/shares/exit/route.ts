import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ShareFactory from '@/lib/shares/shareFactory';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { folderId } = body;

    if (!folderId) {
      return NextResponse.json(
        { error: 'folderId is required' },
        { status: 400 }
      );
    }

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const shareService = ShareFactory.createShareService(supabase);

    // Pour un utilisateur invité, on révoque simplement son share sur le dossier/groupe
    // Les sous-dossiers d'un groupe ne sont pas accessibles directement via RLS,
    // car le share est créé uniquement sur le groupe parent
    await shareService.exitFolder(folderId, user.email!);

    return NextResponse.json({
      message: 'Successfully exited folder/group'
    });
  } catch (error) {
    console.error('Error exiting folder/group:', error);

    // Handle specific error cases
    if (error instanceof Error && error.message === 'No active share found for this folder') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to exit folder/group' },
      { status: 500 }
    );
  }
}
