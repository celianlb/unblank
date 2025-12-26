import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupabaseShareRepository } from '@/infra/shares/SupabaseShareRepository';
import { ShareService } from '@/domain/shares/services/ShareService';
import { SharePermission } from '@/domain/shares/models/Share';

interface RouteParams {
  params: Promise<{
    shareId: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shareId } = await params;
    const body = await request.json();
    const { permission } = body;

    if (!permission) {
      return NextResponse.json(
        { error: 'permission is required' },
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

    const share = await shareService.updatePermission(
      shareId,
      permission as SharePermission
    );

    return NextResponse.json(share);
  } catch (error) {
    console.error('Error updating share:', error);
    return NextResponse.json(
      { error: 'Failed to update share' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shareId } = await params;

    const shareRepository = new SupabaseShareRepository();
    const shareService = new ShareService(shareRepository);

    await shareService.revokeShare(shareId);

    return NextResponse.json({ message: 'Share revoked successfully' });
  } catch (error) {
    console.error('Error revoking share:', error);
    return NextResponse.json(
      { error: 'Failed to revoke share' },
      { status: 500 }
    );
  }
}
