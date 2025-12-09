import { supabase } from '@/infra/db/supabase';

export interface Folder {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  parent_folder_id: string | null;
  is_group: boolean;
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
   */
  static async getFolderBySlug(userId: string, slug: string): Promise<Folder | null> {
    // Requête optimisée : utilise la colonne slug avec index
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .eq('slug', slug)
      .single();

    if (error || !data) {
      if (error?.code !== 'PGRST116') { // Ignore "not found" errors
        console.error('Error fetching folder:', error);
      }
      return null;
    }

    // Compter les liens
    const { count } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true })
      .eq('folder_id', data.id);

    return {
      ...data,
      link_count: count || 0,
    };
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
   */
  static async getUserFolders(userId: string): Promise<Folder[]> {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .eq('is_group', false)
      .is('parent_folder_id', null)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }

    // Récupérer le count de liens pour chaque dossier
    const foldersWithCounts = await Promise.all(
      (data || []).map(async (folder: any) => {
        const { count } = await supabase
          .from('links')
          .select('*', { count: 'exact', head: true })
          .eq('folder_id', folder.id);

        return {
          ...folder,
          link_count: count || 0,
        };
      })
    );

    return foldersWithCounts;
  }

  /**
   * Récupère tous les groupes de dossiers d'un utilisateur
   */
  static async getUserGroups(userId: string): Promise<Folder[]> {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .eq('is_group', true)
      .is('parent_folder_id', null)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }

    // Récupérer le count de liens pour chaque groupe (somme des liens de tous ses sous-dossiers)
    const groupsWithCounts = await Promise.all(
      (data || []).map(async (group: any) => {
        // Compter les liens dans tous les sous-dossiers du groupe
        const { data: subFolders } = await supabase
          .from('folders')
          .select('id')
          .eq('parent_folder_id', group.id);

        let totalLinks = 0;
        if (subFolders && subFolders.length > 0) {
          const folderIds = subFolders.map((f: any) => f.id);
          const { count } = await supabase
            .from('links')
            .select('*', { count: 'exact', head: true })
            .in('folder_id', folderIds);
          totalLinks = count || 0;
        }

        return {
          ...group,
          link_count: totalLinks,
        };
      })
    );

    return groupsWithCounts;
  }

  /**
   * Récupère les dossiers d'un groupe spécifique
   */
  static async getGroupFolders(groupId: string): Promise<Folder[]> {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('parent_folder_id', groupId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching group folders:', error);
      throw error;
    }

    // Récupérer le count de liens pour chaque dossier
    const foldersWithCounts = await Promise.all(
      (data || []).map(async (folder: any) => {
        const { count } = await supabase
          .from('links')
          .select('*', { count: 'exact', head: true })
          .eq('folder_id', folder.id);

        return {
          ...folder,
          link_count: count || 0,
        };
      })
    );

    return foldersWithCounts;
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
        .eq('id', folderId);

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
   * Supprime un ou plusieurs dossiers
   * Les liens seront automatiquement déplacés vers "Récents" par le trigger SQL
   */
  static async deleteFolders(folderIds: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .in('id', folderIds);

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
