import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ShareFactory from '@/lib/shares/shareFactory';
import { SharePermission } from '@/domain/shares/models/Share';

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
        { error: 'Invalid permission. Must be "view" or "edit"' },
        { status: 400 }
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

    // Generate the share URL - use request origin as primary source for production
    const origin = request.headers.get('origin');
    const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/s/${share.share_token}`;

    return NextResponse.json({ share, shareUrl });
  } catch (error) {
    console.error('Error creating public share:', error);
    return NextResponse.json(
      { error: 'Failed to create public share' },
      { status: 500 }
    );
  }
}
