import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import LinkFactory from '@/lib/links/linkFactory';

/**
 * PUT /api/links/[linkId]/tags
 * Met à jour les tags d'un lien
 * Vérifie les permissions (propriétaire ou permission edit via shares sur le dossier parent)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
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

    const { linkId } = await params;
    const { tags } = await request.json();

    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'Tags must be an array' },
        { status: 400 }
      );
    }

    // ✅ Récupérer le lien avec son dossier parent
    const { data: link } = await supabase
      .from('links')
      .select('user_id, folder_id')
      .eq('id', linkId)
      .single();

    if (!link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    // ✅ Vérifier les permissions
    // 1. Vérifier si l'utilisateur est le propriétaire du lien
    const isOwner = link.user_id === user.id;

    // 2. Si pas propriétaire, vérifier les permissions via le dossier parent
    if (!isOwner && link.folder_id) {
      const { data: share } = await supabase
        .from('shares')
        .select('permission')
        .eq('folder_id', link.folder_id)
        .eq('shared_with_email', user.email)
        .eq('is_active', true)
        .eq('permission', 'edit')
        .maybeSingle();

      const hasEditPermission = share?.permission === 'edit';

      if (!hasEditPermission) {
        return NextResponse.json(
          { error: 'You do not have permission to edit tags for this link' },
          { status: 403 }
        );
      }
    } else if (!isOwner && !link.folder_id) {
      // Lien sans dossier et pas le propriétaire : interdit
      return NextResponse.json(
        { error: 'You do not have permission to edit tags for this link' },
        { status: 403 }
      );
    }

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const linkService = LinkFactory.createLinkService(supabase);
    const success = await linkService.updateTags(linkId, user.id, tags);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update tags' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, tags });
  } catch (error) {
    console.error('Error updating tags:', error);
    return NextResponse.json(
      { error: 'Failed to update tags' },
      { status: 500 }
    );
  }
}
