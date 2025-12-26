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
    // Récupérer d'abord le folder pour obtenir le propriétaire
    const { data: folder, error: folderError } = await this.supabase
      .from('folders')
      .select('user_id')
      .eq('id', folderId)
      .single();

    if (folderError) {
      throw new Error(`Failed to get folder: ${folderError.message}`);
    }

    // Récupérer le profil du propriétaire
    const { data: ownerProfile } = await this.supabase
      .from('user_public_profiles')
      .select('id, email, name, avatar_url')
      .eq('id', folder.user_id)
      .maybeSingle();

    // Récupérer les shares
    const { data: shares, error } = await this.supabase
      .from('shares')
      .select('*')
      .eq('folder_id', folderId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get shares: ${error.message}`);
    }

    // Enrichir avec les infos utilisateur depuis la vue sécurisée
    const sharesWithUser = await Promise.all(
      (shares || []).map(async (share) => {
        if (!share.shared_with_email) {
          return { ...share, user: null };
        }

        const { data: userProfile } = await this.supabase
          .from('user_public_profiles')
          .select('id, email, name, avatar_url')
          .eq('email', share.shared_with_email)
          .maybeSingle();

        return {
          ...share,
          user: userProfile,
        };
      })
    );

    // Ajouter le propriétaire en tant que premier élément avec permission "owner"
    const ownerShare = {
      id: 'owner',
      folder_id: folderId,
      shared_by: folder.user_id,
      shared_with_email: ownerProfile?.email || '',
      share_token: null,
      permission: 'owner' as const,
      is_active: true,
      expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: ownerProfile,
    };

    return [ownerShare, ...sharesWithUser];
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
    // Récupérer les shares sans faire de jointure avec folders (pour éviter les problèmes RLS)
    const { data: shares, error } = await this.supabase
      .from('shares')
      .select('id, folder_id, permission, created_at')
      .eq('is_active', true)
      .eq('shared_with_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get shared folders: ${error.message}`);
    }

    if (!shares || shares.length === 0) {
      return [];
    }

    // Récupérer les folders correspondants séparément
    const folderIds = shares.map(s => s.folder_id);
    const { data: folders, error: foldersError } = await this.supabase
      .from('folders')
      .select('id, name, slug, parent_folder_id, is_group, created_at, updated_at')
      .in('id', folderIds);

    if (foldersError) {
      throw new Error(`Failed to get folders: ${foldersError.message}`);
    }

    // Pour chaque folder, récupérer le nombre de links et les images preview
    const foldersWithDetails = await Promise.all(
      (folders || []).map(async (folder) => {
        // Compter les links
        const { count } = await this.supabase
          .from('links')
          .select('*', { count: 'exact', head: true })
          .eq('folder_id', folder.id);

        // Récupérer les 2 dernières images pour preview
        const { data: links } = await this.supabase
          .from('links')
          .select('original_image_url, screenshot_url')
          .eq('folder_id', folder.id)
          .not('original_image_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(2);

        const previewImages = (links || [])
          .map(link => link.original_image_url || link.screenshot_url)
          .filter(Boolean) as string[];

        return {
          ...folder,
          link_count: count || 0,
          preview_images: previewImages,
        };
      })
    );

    // Combiner shares et folders
    return shares.map(share => ({
      ...share,
      folders: foldersWithDetails.find(f => f.id === share.folder_id) || null,
    }));
  }
}
