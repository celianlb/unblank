import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import LinkFactory from '@/lib/links/linkFactory';
import { handleCorsPreFlight, addCorsHeaders } from '@/lib/api/cors';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
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
    const body = await request.json();
    const {
      url,
      title,
      description,
      folderId,
      originalImageUrl,
      imageFormat,
      contentType,
      tags
    } = body;

    if (!url) {
      const response = NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const linkService = LinkFactory.createLinkService(supabase);

    // Create link using the domain service
    const link = await linkService.createLink(user.id, {
      url,
      title,
      description,
      folderId,
      originalImageUrl,
      imageFormat,
      contentType,
      tags
    });

    if (!link) {
      const response = NextResponse.json(
        { error: 'Failed to create link' },
        { status: 500 }
      );
      return addCorsHeaders(response, origin);
    }

    const response = NextResponse.json({
      success: true,
      link
    });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error in links API:', error);
    const response = NextResponse.json(
      { error: 'Failed to create link' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}

export async function DELETE(request: NextRequest) {
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
    const body = await request.json();
    const { linkIds } = body;

    if (!linkIds || !Array.isArray(linkIds) || linkIds.length === 0) {
      const response = NextResponse.json(
        { error: 'linkIds array is required' },
        { status: 400 }
      );
      return addCorsHeaders(response, origin);
    }

    // ✅ CLEAN ARCHITECTURE: Utilisation du service via la factory
    const linkService = LinkFactory.createLinkService(supabase);

    // Delete links using the domain service
    const success = await linkService.deleteLinks(linkIds);

    if (!success) {
      const response = NextResponse.json(
        { error: 'Failed to delete links' },
        { status: 500 }
      );
      return addCorsHeaders(response, origin);
    }

    const response = NextResponse.json({
      success: true,
      deletedCount: linkIds.length
    });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error in links DELETE API:', error);
    const response = NextResponse.json(
      { error: 'Failed to delete links' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}
