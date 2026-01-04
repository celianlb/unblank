import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import TagFactory from '@/lib/tags/tagFactory';
import { handleCorsPreFlight, addCorsHeaders } from '@/lib/api/cors';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tagId: string } }
) {
  const origin = request.headers.get('origin');

  try {
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
    }

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

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
    }

    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      const response = NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    const tagService = TagFactory.createTagService(supabase);

    // Vérifier que le tag appartient à l'utilisateur
    const existingTag = await tagService.getTagById(params.tagId);
    if (!existingTag || existingTag.user_id !== user.id) {
      const response = NextResponse.json(
        { error: 'Tag not found or unauthorized' },
        { status: 404 }
      );
      return addCorsHeaders(response, origin);
    }

    const tag = await tagService.renameTag(params.tagId, name);

    if (!tag) {
      const response = NextResponse.json(
        { error: 'Failed to rename tag' },
        { status: 500 }
      );
      return addCorsHeaders(response, origin);
    }

    const response = NextResponse.json({ tag });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error renaming tag:', error);
    const response = NextResponse.json(
      { error: 'Failed to rename tag' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tagId: string } }
) {
  const origin = request.headers.get('origin');

  try {
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
    }

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

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
    }

    const tagService = TagFactory.createTagService(supabase);

    // Vérifier que le tag appartient à l'utilisateur
    const existingTag = await tagService.getTagById(params.tagId);
    if (!existingTag || existingTag.user_id !== user.id) {
      const response = NextResponse.json(
        { error: 'Tag not found or unauthorized' },
        { status: 404 }
      );
      return addCorsHeaders(response, origin);
    }

    const success = await tagService.deleteTag(params.tagId);

    if (!success) {
      const response = NextResponse.json(
        { error: 'Failed to delete tag' },
        { status: 500 }
      );
      return addCorsHeaders(response, origin);
    }

    const response = NextResponse.json({ success: true });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error deleting tag:', error);
    const response = NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}
