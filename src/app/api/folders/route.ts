import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
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

    // Fetch user's folders and groups using RPC functions (aligned with SaaS)
    const [foldersResult, groupsResult] = await Promise.all([
      supabase.rpc('get_user_folders_with_counts', { p_user_id: user.id }),
      supabase.rpc('get_user_groups_with_counts', { p_user_id: user.id })
    ]);

    if (foldersResult.error) {
      console.error('Error fetching folders:', foldersResult.error);
      throw foldersResult.error;
    }

    if (groupsResult.error) {
      console.error('Error fetching groups:', groupsResult.error);
      throw groupsResult.error;
    }

    const folders = foldersResult.data || [];
    const groups = groupsResult.data || [];

    return NextResponse.json({
      folders,
      groups,
      all: [...groups, ...folders] // Combined list for convenience
    });
  } catch (error) {
    console.error('Error in folders API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

