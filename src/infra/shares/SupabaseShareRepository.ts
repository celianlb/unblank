import { SupabaseClient } from '@supabase/supabase-js';
import { ShareRepository } from '@/domain/shares/ports/ShareRepository';
import { Share, ShareWithUser, ShareWithFolder, CreateShareDTO, UpdateShareDTO } from '@/domain/shares/models/Share';

export class ShareLimitError extends Error {
  constructor(message: string, public currentCount: number, public maxCount: number) {
    super(message);
    this.name = 'ShareLimitError';
  }
}

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
      // Détecter l'erreur de limite de partage depuis la RLS policy
      if (error.message.includes('Share members limit reached')) {
        // Extraire les nombres du message d'erreur
        const match = error.message.match(/Current: (\d+), Max: (\d+)/);
        const currentCount = match ? parseInt(match[1]) : 0;
        const maxCount = match ? parseInt(match[2]) : 0;
        throw new ShareLimitError(
          `La limite de partage a été atteinte pour votre plan (${maxCount} membres maximum)`,
          currentCount,
          maxCount
        );
      }
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

  async getShareByFolderAndEmail(folderId: string, userEmail: string): Promise<Share | null> {
    // Normaliser l'email en minuscules pour la recherche
    const normalizedEmail = userEmail.toLowerCase();

    console.log('[GET SHARE] Looking for share:', { folderId, normalizedEmail });

    // Utiliser une requête qui gère les doublons potentiels (prendre le plus récent)
    const { data: shares, error } = await this.supabase
      .from('shares')
      .select('*')
      .eq('folder_id', folderId)
      .ilike('shared_with_email', normalizedEmail)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    console.log('[GET SHARE] Result:', { shareCount: shares?.length, shareId: shares?.[0]?.id, error: error?.message });

    if (error) {
      throw new Error(`Failed to get share by folder and email: ${error.message}`);
    }

    return shares?.[0] || null;
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
    console.log('[REVOKE SHARE] Attempting to revoke share:', shareId);

    const { data, error } = await this.supabase
      .from('shares')
      .update({ is_active: false })
      .eq('id', shareId)
      .select();

    console.log('[REVOKE SHARE] Result:', { data, error: error?.message });

    if (error) {
      throw new Error(`Failed to revoke share: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to revoke share - RLS policy may have blocked the update');
    }

    console.log('[REVOKE SHARE] Successfully revoked share:', shareId);
  }

  async deleteShare(shareId: string): Promise<void> {
    console.log('[DELETE SHARE] Attempting to delete share:', shareId);

    const { data, error, count } = await this.supabase
      .from('shares')
      .delete()
      .eq('id', shareId)
      .select();

    console.log('[DELETE SHARE] Result:', { data, error, count, shareId });

    if (error) {
      console.error('[DELETE SHARE] Error:', error);
      throw new Error(`Failed to delete share: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn('[DELETE SHARE] No rows deleted - possible RLS restriction');
      throw new Error('Failed to delete share - you may not have permission to delete this share');
    }

    console.log('[DELETE SHARE] Successfully deleted share');
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

  async getSharedWithUser(userEmail: string): Promise<ShareWithFolder[]> {
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
        // Si c'est un groupe, compter les links dans tous les sous-dossiers
        if (folder.is_group) {
          // Récupérer tous les sous-dossiers du groupe
          const { data: childFolders } = await this.supabase
            .from('folders')
            .select('id')
            .eq('parent_folder_id', folder.id);

          const childFolderIds = (childFolders || []).map(f => f.id);

          // Compter les links dans tous les sous-dossiers
          let totalCount = 0;
          if (childFolderIds.length > 0) {
            const { count } = await this.supabase
              .from('links')
              .select('*', { count: 'exact', head: true })
              .in('folder_id', childFolderIds);
            totalCount = count || 0;
          }

          // Récupérer les images preview des sous-dossiers (max 4 dossiers, 1 image par dossier)
          const limitedChildFolders = childFolderIds.slice(0, 4);
          const previewImagesPromises = limitedChildFolders.map(async (folderId) => {
            const { data: links } = await this.supabase
              .from('links')
              .select('original_image_url, screenshot_url')
              .eq('folder_id', folderId)
              .not('original_image_url', 'is', null)
              .order('created_at', { ascending: false })
              .limit(1);

            if (links && links.length > 0) {
              return links[0].original_image_url || links[0].screenshot_url;
            }
            return null;
          });

          const allImages = await Promise.all(previewImagesPromises);
          const previewImages = allImages.filter(Boolean) as string[];

          return {
            ...folder,
            link_count: totalCount,
            preview_images: previewImages,
          };
        }

        // Pour les dossiers normaux, compter les links directement
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

  async revokeGroupShares(groupId: string, userEmail: string, childFolderIds: string[]): Promise<void> {
    // Construire la liste des IDs: groupe + tous ses enfants (fournis par le FolderService)
    const folderIds = [groupId, ...childFolderIds];

    // Révoquer tous les shares de cet utilisateur pour ces dossiers
    const { error } = await this.supabase
      .from('shares')
      .update({ is_active: false })
      .in('folder_id', folderIds)
      .eq('shared_with_email', userEmail)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to revoke group shares: ${error.message}`);
    }
  }
}
