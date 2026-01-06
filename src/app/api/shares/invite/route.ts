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
    const { folderId, email, permission, expiresAt } = body;

    if (!folderId || !email || !permission) {
      return NextResponse.json(
        { error: 'folderId, email, and permission are required' },
        { status: 400 }
      );
    }

    if (!['view', 'edit'].includes(permission)) {
      return NextResponse.json(
        { error: 'Invalid permission. Must be "view" or "edit"' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validation 1: Empêcher de s'inviter soi-même
    if (user.email && email.toLowerCase() === user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'You cannot invite yourself' },
        { status: 400 }
      );
    }

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const shareService = ShareFactory.createShareService(supabase);

    // Validation 2: Vérifier si l'utilisateur est déjà invité
    const existingShare = await shareService.getFolderShares(folderId);
    const alreadyInvited = existingShare.find(
      (share: any) => share.user?.email?.toLowerCase() === email.toLowerCase()
    );

    if (alreadyInvited) {
      return NextResponse.json(
        { error: 'User already has access to this folder' },
        { status: 400 }
      );
    }

    const share = await shareService.inviteByEmail(
      folderId,
      user.id,
      email,
      permission as SharePermission,
      expiresAt
    );

    // TODO: Send email notification to the invited user
    // You can integrate with a service like Resend, SendGrid, or AWS SES

    return NextResponse.json({ share, message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Error inviting user:', error);
    
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
    
    return NextResponse.json(
      { error: 'Failed to invite user' },
      { status: 500 }
    );
  }
}
