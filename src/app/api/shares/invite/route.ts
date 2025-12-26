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

    const shareRepository = new SupabaseShareRepository();
    const shareService = new ShareService(shareRepository);

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
    return NextResponse.json(
      { error: 'Failed to invite user' },
      { status: 500 }
    );
  }
}
