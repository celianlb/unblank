import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import TagFactory from '@/lib/tags/tagFactory';
import { handleCorsPreFlight, addCorsHeaders } from '@/lib/api/cors';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

export async function POST(request: NextRequest) {
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

    const { sourceTagIds, targetTagId } = await request.json();

    if (!Array.isArray(sourceTagIds) || !targetTagId) {
      const response = NextResponse.json(
        { error: 'sourceTagIds (array) and targetTagId are required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    const tagService = TagFactory.createTagService(supabase);

    // Vérifier que tous les tags appartiennent à l'utilisateur
    const targetTag = await tagService.getTagById(targetTagId);
    if (!targetTag || targetTag.user_id !== user.id) {
      const response = NextResponse.json(
        { error: 'Target tag not found or unauthorized' },
        { status: 404 }
      );
      return addCorsHeaders(response, origin);
    }

    // Fusionner les tags
    const success = await tagService.mergeTags(sourceTagIds, targetTagId);

    if (!success) {
      const response = NextResponse.json(
        { error: 'Failed to merge tags' },
        { status: 500 }
      );
      return addCorsHeaders(response, origin);
    }

    const response = NextResponse.json({ success: true });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error merging tags:', error);
    const response = NextResponse.json(
      { error: 'Failed to merge tags' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}
