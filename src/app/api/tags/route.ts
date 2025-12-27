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

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const searchService = SearchFactory.createSearchService(supabase);

    // Get user tags with usage count
    const tags = await searchService.getUserTags(user.id);

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
