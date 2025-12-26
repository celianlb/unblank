import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import LinkFactory from '@/lib/links/linkFactory';

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

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const linkService = LinkFactory.createLinkService(supabase);
    const success = await linkService.updateTags(linkId, user.id, tags);

    if (!success) {
      return NextResponse.json(
        { error: 'Link not found or unauthorized' },
        { status: 404 }
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
