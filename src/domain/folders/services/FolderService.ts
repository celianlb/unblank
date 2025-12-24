import { supabase } from '@/infra/db/supabase';

export interface Folder {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  parent_folder_id: string | null;
  is_group: boolean;
  is_system: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  link_count?: number;
}

export class FolderService {
  /**
   * Génère un slug à partir d'un nom de dossier
   */
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with -
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing -
  }

  /**
   * Récupère un dossier par son slug (nom normalisé)
   * ✅ OPTIMISÉ : Utilise une fonction SQL pour 1 seule requête au lieu de 2
   */
  static async getFolderBySlug(userId: string, slug: string): Promise<Folder | null> {
    const { data, error } = await supabase
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

  /**
   * Récupère un groupe par son slug
   */
  static async getGroupBySlug(userId: string, slug: string): Promise<Folder | null> {
    // Requête optimisée : utilise la colonne slug avec index
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .eq('is_group', true)
      .eq('slug', slug)
      .single();

    if (error || !data) {
      if (error?.code !== 'PGRST116') { // Ignore "not found" errors
        console.error('Error fetching group:', error);
      }
      return null;
    }

    return data;
  }

  /**
   * Récupère tous les dossiers d'un utilisateur (non-groupes)
   * ✅ OPTIMISÉ : 1 seule requête au lieu de N+1 grâce à la fonction SQL
   */
  static async getUserFolders(userId: string): Promise<Folder[]> {
    const { data, error } = await supabase
      .rpc('get_user_folders_with_counts', { p_user_id: userId });

    if (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Récupère tous les groupes de dossiers d'un utilisateur
   * ✅ OPTIMISÉ : 1 seule requête au lieu de N×2 grâce à la fonction SQL
   */
  static async getUserGroups(userId: string): Promise<Folder[]> {
    const { data, error } = await supabase
      .rpc('get_user_groups_with_counts', { p_user_id: userId });

    if (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Récupère les dossiers d'un groupe spécifique
   * ✅ OPTIMISÉ : 1 seule requête au lieu de N+1 grâce à la fonction SQL
   */
  static async getGroupFolders(groupId: string): Promise<Folder[]> {
    const { data, error } = await supabase
      .rpc('get_group_folders_with_counts', { p_group_id: groupId });

    if (error) {
      console.error('Error fetching group folders:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Crée un nouveau dossier
   */
  static async createFolder(userId: string, name: string, isGroup: boolean = false, parentFolderId: string | null = null): Promise<Folder | null> {
    try {
      const { data, error } = await supabase
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
        .single();

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

  /**
   * Déplace un dossier dans un groupe
   */
  static async moveFolderToGroup(folderId: string, groupId: string): Promise<boolean> {
    try {
      const { error } = await supabase
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

  /**
   * Renomme un dossier
   */
  static async renameFolder(folderId: string, newName: string): Promise<Folder | null> {
    try {
      const { data, error } = await supabase
        .from('folders')
        .update({ name: newName })
        .eq('id', folderId)
        .eq('is_system', false) // Empêche le renommage des dossiers système
        .select()
        .single();

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

  /**
   * Supprime un ou plusieurs dossiers
   * Les liens seront automatiquement déplacés vers "Récents" par le trigger SQL
   */
  static async deleteFolders(folderIds: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
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

  /**
   * Calcule la date de dernière mise à jour d'un dossier
   */
  static formatLastUpdate(updatedAt: string): string {
    const now = new Date();
    const updated = new Date(updatedAt);
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Mise à jour il y a quelques secondes';
    if (diffMins < 60) return `Mise à jour il y a ${diffMins}min`;
    if (diffHours < 24) return `Mise à jour il y a ${diffHours}h`;
    if (diffDays < 7) return `Mise à jour il y a ${diffDays}j`;

    return `Mise à jour le ${updated.toLocaleDateString('fr-FR')}`;
  }
}
