import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import FolderFactory from '@/lib/folders/folderFactory';
import { handleCorsPreFlight, addCorsHeaders } from '@/lib/api/cors';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const origin = request.headers.get('origin');

  try {
    // Await params (Next.js 15 requirement)
    const { groupId } = await params;

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
    const folderService = FolderFactory.createFolderService(supabase);

    // Fetch folders for the specific group
    const folders = await folderService.getGroupFolders(user.id, groupId);

    const response = NextResponse.json({
      folders
    });
    return addCorsHeaders(response, origin);
  } catch (error) {
    console.error('Error in group folders API:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch group folders' },
      { status: 500 }
    );
    return addCorsHeaders(response, origin);
  }
}
