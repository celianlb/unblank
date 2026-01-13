import { SupabaseClient } from '@supabase/supabase-js';
import { FolderRepository } from '@/domain/folders/ports/FolderRepository';
import { Folder } from '@/domain/folders/models';

/**
 * Implémentation Supabase du repository de dossiers
 * Adapter entre Supabase et notre domaine métier
 */
export class SupabaseFolderRepository implements FolderRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getFolderById(folderId: string): Promise<Folder | null> {
    const { data, error } = await this.supabase
      .from('folders')
      .select('*')
      .eq('id', folderId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching folder by ID:', error);
      return null;
    }

    return data;
  }

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

  async getSubFolders(userId: string, parentFolderId: string): Promise<Folder[]> {
    // Récupérer les sous-dossiers d'un dossier parent
    const { data: folders, error } = await this.supabase
      .from('folders')
      .select('*')
      .eq('parent_folder_id', parentFolderId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching sub-folders:', error);
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

  async createFolder(userId: string, name: string, parentFolderId?: string | null): Promise<Folder | null> {
    try {
      const { data, error } = await this.supabase
        .from('folders')
        .insert({
          user_id: userId,
          name: name,
          is_group: false, // Toujours false maintenant
          parent_folder_id: parentFolderId || null,
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

  async moveFolderToParent(folderId: string, parentFolderId: string | null): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('folders')
        .update({ parent_folder_id: parentFolderId })
        .eq('id', folderId)
        .eq('is_system', false); // Empêche le déplacement des dossiers système

      if (error) {
        console.error('Error moving folder:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error moving folder:', error);
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

  async getFolderAncestors(folderId: string): Promise<Folder[]> {
    const ancestors: Folder[] = [];
    let currentFolderId: string | null = folderId;

    // Récupérer d'abord le dossier courant pour obtenir son parent_folder_id
    const currentFolder = await this.getFolderById(currentFolderId);
    if (!currentFolder) {
      return ancestors;
    }

    currentFolderId = currentFolder.parent_folder_id;

    // Remonter la chaîne des parents (max 10 niveaux pour éviter les boucles infinies)
    let maxIterations = 10;
    while (currentFolderId && maxIterations > 0) {
      const folder = await this.getFolderById(currentFolderId);
      if (!folder) break;

      ancestors.unshift(folder); // Ajouter au début pour avoir l'ordre du plus éloigné au plus proche
      currentFolderId = folder.parent_folder_id;
      maxIterations--;
    }

    return ancestors;
  }
}
