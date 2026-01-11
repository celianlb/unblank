import { SupabaseClient } from '@supabase/supabase-js';
import { FolderRepository } from '@/domain/folders/ports/FolderRepository';
import { Folder } from '@/domain/folders/models';

/**
 * Implémentation Supabase du repository de dossiers
 * Adapter entre Supabase et notre domaine métier
 */
export class SupabaseFolderRepository implements FolderRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getFolderBySlug(userId: string, slug: string): Promise<Folder | null> {
    const { data, error } = await this.supabase
      .rpc('get_folder_by_slug_with_count', {
        p_user_id: userId,
        p_slug: slug
      });

    if (error) {
      if (error.code !== 'PGRST116') { // Ignore "not found" errors
        console.error('Error fetching folder:', error);
      }
      return null;
    }

    // La fonction RPC retourne un tableau, on prend le premier élément
    return data?.[0] || null;
  }

  async getGroupBySlug(userId: string, slug: string): Promise<Folder | null> {
    // D'abord essayer de récupérer comme groupe personnel
    const { data: ownGroup, error: ownError } = await this.supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .eq('is_group', true)
      .eq('slug', slug)
      .maybeSingle();

    if (ownGroup) {
      return ownGroup;
    }

    // Si non trouvé, vérifier si c'est un groupe partagé
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user?.email) {
      return null;
    }

    const { data: sharedGroup, error: sharedError } = await this.supabase
      .from('folders')
      .select(`
        *,
        shares!inner(*)
      `)
      .eq('is_group', true)
      .eq('slug', slug)
      .eq('shares.shared_with_email', user.email)
      .eq('shares.is_active', true)
      .maybeSingle();

    if (sharedError && sharedError.code !== 'PGRST116') {
      console.error('Error fetching shared group:', sharedError);
    }

    return sharedGroup || null;
  }

  async getUserFolders(userId: string): Promise<Folder[]> {
    const { data, error } = await this.supabase
      .rpc('get_user_folders_with_counts', { p_user_id: userId });

    if (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }

    const folders = data || [];

    // Pour chaque dossier, récupérer les 2 dernières images
    const foldersWithImages = await Promise.all(
      folders.map(async (folder: Folder) => {
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
          preview_images: previewImages
        };
      })
    );

    return foldersWithImages;
  }

  async getUserGroups(userId: string): Promise<Folder[]> {
    const { data, error } = await this.supabase
      .rpc('get_user_groups_with_counts', { p_user_id: userId });

    if (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }

    const groups = data || [];

    // Pour chaque groupe, récupérer 1 image par dossier enfant (max 4 dossiers)
    const groupsWithImages = await Promise.all(
      groups.map(async (group: Folder) => {
        // Récupérer tous les dossiers du groupe (limité à 4)
        const { data: groupFolders } = await this.supabase
          .from('folders')
          .select('id')
          .eq('parent_folder_id', group.id)
          .limit(4);

        if (!groupFolders || groupFolders.length === 0) {
          return { ...group, preview_images: [] };
        }

        // Pour chaque dossier, récupérer sa première image
        const previewImagesPromises = groupFolders.map(async (folder) => {
          const { data: links } = await this.supabase
            .from('links')
            .select('original_image_url, screenshot_url')
            .eq('folder_id', folder.id)
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
          ...group,
          preview_images: previewImages
        };
      })
    );

    return groupsWithImages;
  }

  async getGroupFolders(userId: string, groupId: string): Promise<Folder[]> {
    // Récupérer les dossiers enfants du groupe
    const { data: folders, error } = await this.supabase
      .from('folders')
      .select('*')
      .eq('parent_folder_id', groupId)
      .eq('is_group', false)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching group folders:', error);
      throw error;
    }

    if (!folders || folders.length === 0) {
      return [];
    }

    // Pour chaque dossier, compter les liens et récupérer les images
    const foldersWithCountsAndImages = await Promise.all(
      folders.map(async (folder) => {
        // Compter les liens
        const { count } = await this.supabase
          .from('links')
          .select('*', { count: 'exact', head: true })
          .eq('folder_id', folder.id);

        // Récupérer les 2 dernières images
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
          preview_images: previewImages
        };
      })
    );

    return foldersWithCountsAndImages;
  }

  async createFolder(userId: string, name: string, parentFolderId?: string | null, isGroup: boolean = false): Promise<Folder | null> {
    try {
      // ✅ Le dossier appartient toujours au créateur (userId)
      // Le trigger auto_share_folder_with_creator lui donnera automatiquement 'edit' permission
      const { data, error } = await this.supabase
        .from('folders')
        .insert({
          user_id: userId,  // Toujours le créateur
          name: name,
          is_group: isGroup,
          parent_folder_id: parentFolderId,
          position: 0
          // Le slug sera auto-généré par le trigger SQL
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error creating folder:', error);
        return null;
      }

      return {
        ...data,
        link_count: 0
      };
    } catch (error) {
      console.error('Error creating folder:', error);
      return null;
    }
  }

  async moveFolderToGroup(folderId: string, groupId: string | null): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('folders')
        .update({ parent_folder_id: groupId })
        .eq('id', folderId)
        .eq('is_system', false); // Empêche le groupement des dossiers système

      if (error) {
        console.error('Error moving folder to group:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error moving folder to group:', error);
      return false;
    }
  }

  async renameFolder(folderId: string, newName: string): Promise<Folder | null> {
    try {
      const { data, error } = await this.supabase
        .from('folders')
        .update({ name: newName })
        .eq('id', folderId)
        .eq('is_system', false) // Empêche le renommage des dossiers système
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error renaming folder:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error renaming folder:', error);
      return null;
    }
  }

  async deleteFolders(folderIds: string[]): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('folders')
        .delete()
        .in('id', folderIds)
        .eq('is_system', false); // Empêche la suppression des dossiers système

      if (error) {
        console.error('Error deleting folders:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting folders:', error);
      return false;
    }
  }
}
