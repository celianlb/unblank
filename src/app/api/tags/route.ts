import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import TagFactory from '@/lib/tags/tagFactory';
import { handleCorsPreFlight, addCorsHeaders } from '@/lib/api/cors';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    // Get the access token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
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
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
    }

    // ✅ CLEAN ARCHITECTURE: Utilisation du service tags via la factory
    const tagService = TagFactory.createTagService(supabase);

    // Get user tags with usage count
    const tags = await tagService.getUserTags(user.id);

    const response = NextResponse.json({
      tags,
    });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error in tags API:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    // Get the access token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
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
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
      return addCorsHeaders(response, origin);
    }

    // Parse request body
    const { name } = await request.json();

    if (!name || typeof name !== 'string') {
      const response = NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // ✅ CLEAN ARCHITECTURE: Utilisation du service tags via la factory
    const tagService = TagFactory.createTagService(supabase);

    // Create tag
    const tag = await tagService.createTag(user.id, name);

    if (!tag) {
      const response = NextResponse.json(
        { error: 'Failed to create tag' },
        { status: 500 }
      );
      return addCorsHeaders(response, origin);
    }

    const response = NextResponse.json({ tag });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error creating tag:', error);
    const response = NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}
