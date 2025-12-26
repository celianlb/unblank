import { NextRequest, NextResponse } from 'next/server';
import { SupabaseShareRepository } from '@/infra/shares/SupabaseShareRepository';
import { ShareService } from '@/domain/shares/services/ShareService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }

    const shareRepository = new SupabaseShareRepository();
    const shareService = new ShareService(shareRepository);

    const validation = await shareService.validateShareToken(token);

    return NextResponse.json(validation);
  } catch (error) {
    console.error('Error validating share token:', error);
    return NextResponse.json(
      { error: 'Failed to validate share token' },
      { status: 500 }
    );
  }
}
