import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupabaseShareRepository } from '@/infra/shares/SupabaseShareRepository';
import { ShareService } from '@/domain/shares/services/ShareService';
import { SharePermission } from '@/domain/shares/models/Share';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
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

    const shareRepository = new SupabaseShareRepository();
    const shareService = new ShareService(shareRepository);

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
    return NextResponse.json(
      { error: 'Failed to create public share' },
      { status: 500 }
    );
  }
}
