import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import SearchFactory from '@/lib/search/searchFactory';
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || undefined;
    const tagNames = searchParams.getAll('tags'); // Support multiple tags: ?tags=design&tags=dev
    const folderId = searchParams.get('folderId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const searchService = SearchFactory.createSearchService(supabase);

    // Perform search using the domain service
    const result = await searchService.searchLinks(user.id, {
      query,
      tagNames: tagNames.length > 0 ? tagNames : undefined,
      folderId,
      limit,
      offset,
    });

    const response = NextResponse.json({
      links: result.links,
      total: result.total,
      hasMore: result.hasMore,
    });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error in search API:', error);
    const response = NextResponse.json(
      { error: 'Failed to search links' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}
