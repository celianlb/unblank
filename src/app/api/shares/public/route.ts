import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ShareFactory from '@/lib/shares/shareFactory';
import { SharePermission } from '@/domain/shares/models/Share';
import { ShareLimitError } from '@/infra/shares/SupabaseShareRepository';

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
    const { folderId, permission, expiresAt } = body;

    if (!folderId || !permission) {
      return NextResponse.json(
        { error: 'folderId and permission are required' },
        { status: 400 }
      );
    }

    if (!['view', 'edit'].includes(permission)) {
      return NextResponse.json(
        { error: 'Permission invalide. Doit être "view" ou "edit"' },
        { status: 400 }
      );
    }

    // Vérifier le plan de l'utilisateur - les liens publics nécessitent Pro ou Team
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_plan')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Impossible de vérifier votre abonnement' },
        { status: 500 }
      );
    }

    if (userData.subscription_plan === 'free') {
      return NextResponse.json(
        {
          error: 'Le partage par lien nécessite le plan Pro ou Team',
          code: 'UPGRADE_REQUIRED'
        },
        { status: 403 }
      );
    }

    // Vérifier la permission d'édition pour les plans Pro
    if (permission === 'edit' && userData.subscription_plan === 'pro') {
      return NextResponse.json(
        {
          error: 'Le partage avec droits d\'édition nécessite le plan Team',
          code: 'UPGRADE_REQUIRED'
        },
        { status: 403 }
      );
    }

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const shareService = ShareFactory.createShareService(supabase);

    const share = await shareService.createPublicShare(
      folderId,
      user.id,
      permission as SharePermission,
      expiresAt
    );

    // Generate the share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/s/${share.share_token}`;

    return NextResponse.json({ share, shareUrl });
  } catch (error) {
    console.error('Error creating public share:', error);

    // Gérer spécifiquement l'erreur de limite de partage
    if (error instanceof ShareLimitError) {
      return NextResponse.json(
        {
          error: error.message,
          currentCount: error.currentCount,
          maxCount: error.maxCount,
          code: 'SHARE_LIMIT_REACHED'
        },
        { status: 403 }
      );
    }

    // Extraire le message d'erreur s'il existe
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du lien de partage';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
