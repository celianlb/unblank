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
    const { data, error } = await this.supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .eq('is_group', true)
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) {
      if (error?.code !== 'PGRST116') { // Ignore "not found" errors
        console.error('Error fetching group:', error);
      }
      return null;
    }

    return data;
  }

  async getUserFolders(userId: string): Promise<Folder[]> {
    const { data, error } = await this.supabase
      .rpc('get_user_folders_with_counts', { p_user_id: userId });

    if (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }

    return data || [];
  }

  async getUserGroups(userId: string): Promise<Folder[]> {
    const { data, error } = await this.supabase
      .rpc('get_user_groups_with_counts', { p_user_id: userId });

    if (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }

    return data || [];
  }

  async getGroupFolders(userId: string, groupId: string): Promise<Folder[]> {
    const { data, error } = await this.supabase
      .rpc('get_group_folders_with_counts', { p_group_id: groupId });

    if (error) {
      console.error('Error fetching group folders:', error);
      throw error;
    }

    return data || [];
  }

  async createFolder(userId: string, name: string, parentFolderId?: string | null, isGroup: boolean = false): Promise<Folder | null> {
    try {
      const { data, error } = await this.supabase
        .from('folders')
        .insert({
          user_id: userId,
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
