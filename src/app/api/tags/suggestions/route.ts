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

    // Get search term from query params
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('q') || '';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    if (!searchTerm) {
      const response = NextResponse.json(
        { error: 'Search term is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // ✅ CLEAN ARCHITECTURE: Utilisation du service tags via la factory
    const tagService = TagFactory.createTagService(supabase);

    // Get tag suggestions
    const suggestions = await tagService.getTagSuggestions(user.id, searchTerm, limit);

    const response = NextResponse.json({
      suggestions,
    });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error getting tag suggestions:', error);
    const response = NextResponse.json(
      { error: 'Failed to get tag suggestions' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}
