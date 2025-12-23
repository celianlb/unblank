import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/infra/db/supabase';

/**
 * DELETE /api/links/[id]
 * Supprime un lien
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('[API] DELETE request for link ID:', id);

    if (!id) {
      console.log('[API] No ID provided');
      return NextResponse.json(
        { error: 'Link ID is required' },
        { status: 400 }
      );
    }

    // Supprimer le lien
    console.log('[API] Attempting to delete link from Supabase...');
    const { data, error } = await supabase
      .from('links')
      .delete()
      .eq('id', id)
      .select();

    console.log('[API] Supabase delete response:', { data, error });

    if (error) {
      console.error('[API] Error deleting link:', error);
      return NextResponse.json(
        { error: 'Failed to delete link', details: error },
        { status: 500 }
      );
    }

    console.log('[API] Link deleted successfully');
    return NextResponse.json(
      { success: true, deleted: data },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error in DELETE /api/links/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
