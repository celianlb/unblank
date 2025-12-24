import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Create link
    const { data: link, error: linkError } = await supabase
      .from('links')
      .insert({
        user_id: user.id,
        folder_id: folderId || null,
        url,
        title: title || null,
        description: description || null,
        original_image_url: originalImageUrl || null,
        image_format: imageFormat || null,
        content_type: contentType || null,
        position: 0,
      })
      .select()
      .single();

    if (linkError || !link) {
      console.error('Error creating link:', linkError);
      return NextResponse.json(
        { error: 'Failed to create link' },
        { status: 500 }
      );
    }

    // Add tags if provided
    if (tags && tags.length > 0) {
      const tagInserts = tags.map((tag: string) => ({
        link_id: link.id,
        tag: tag.trim(),
      }));

      const { error: tagsError } = await supabase
        .from('link_tags')
        .insert(tagInserts);

      if (tagsError) {
        console.error('Error adding tags:', tagsError);
        // Don't fail the request if tags fail, just log it
      }
    }

    return NextResponse.json({ 
      success: true, 
      link 
    });
  } catch (error) {
    console.error('Error in links API:', error);
    return NextResponse.json(
      { error: 'Failed to create link' },
      { status: 500 }
    );
  }
}

