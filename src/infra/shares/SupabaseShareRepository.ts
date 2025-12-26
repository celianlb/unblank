import { SupabaseClient } from '@supabase/supabase-js';
import { ShareRepository } from '@/domain/shares/ports/ShareRepository';
import { Share, ShareWithUser, CreateShareDTO, UpdateShareDTO } from '@/domain/shares/models/Share';

export class SupabaseShareRepository implements ShareRepository {
  constructor(private supabase: SupabaseClient) {}

  async createShare(data: CreateShareDTO): Promise<Share> {
    const { data: share, error } = await this.supabase
      .from('shares')
      .insert({
        folder_id: data.folder_id,
        shared_by: data.shared_by,
        shared_with_email: data.shared_with_email || null,
        share_token: data.share_token,
        permission: data.permission,
        expires_at: data.expires_at || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create share: ${error.message}`);
    }

    return share;
  }

  async getSharesByFolder(folderId: string): Promise<ShareWithUser[]> {
    const { data: shares, error } = await this.supabase
      .from('shares')
      .select('*')
      .eq('folder_id', folderId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get shares: ${error.message}`);
    }

    // Return shares without user join - the UI can display the email directly
    return (shares || []).map(share => ({
      ...share,
      user: null, // No user data for now
    }));
  }

  async getShareById(shareId: string): Promise<Share | null> {
    const { data: share, error } = await this.supabase
      .from('shares')
      .select('*')
      .eq('id', shareId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get share: ${error.message}`);
    }

    return share;
  }

  async getShareByToken(token: string): Promise<Share | null> {
    const { data: share, error } = await this.supabase
      .from('shares')
      .select('*')
      .eq('share_token', token)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get share by token: ${error.message}`);
    }

    return share;
  }

  async updateShare(shareId: string, data: UpdateShareDTO): Promise<Share> {
    const { data: share, error } = await this.supabase
      .from('shares')
      .update(data)
      .eq('id', shareId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update share: ${error.message}`);
    }

    return share;
  }

  async revokeShare(shareId: string): Promise<void> {
    const { error } = await this.supabase
      .from('shares')
      .update({ is_active: false })
      .eq('id', shareId);

    if (error) {
      throw new Error(`Failed to revoke share: ${error.message}`);
    }
  }

  async deleteShare(shareId: string): Promise<void> {
    const { error } = await this.supabase
      .from('shares')
      .delete()
      .eq('id', shareId);

    if (error) {
      throw new Error(`Failed to delete share: ${error.message}`);
    }
  }

  async hasAccess(folderId: string, userId: string): Promise<boolean> {
    // Check if user has an active share for this folder
    const { data: shares, error } = await this.supabase
      .from('shares')
      .select('id')
      .eq('folder_id', folderId)
      .eq('is_active', true)
      .or(`shared_with_email.eq.${userId},shared_by.eq.${userId}`);

    if (error) {
      throw new Error(`Failed to check access: ${error.message}`);
    }

    return (shares && shares.length > 0) || false;
  }

  async getSharedWithUser(userEmail: string): Promise<ShareWithUser[]> {
    const { data: shares, error } = await this.supabase
      .from('shares')
      .select(`
        id,
        folder_id,
        permission,
        folders:folder_id (
          id,
          name,
          slug,
          parent_folder_id,
          is_group,
          created_at,
          updated_at
        )
      `)
      .eq('is_active', true)
      .eq('shared_with_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get shared folders: ${error.message}`);
    }

    return shares || [];
  }
}
