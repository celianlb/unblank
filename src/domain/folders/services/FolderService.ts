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
   * @param supabaseClient - Client Supabase authentifié avec les credentials de l'utilisateur
   */
  static async getFolderBySlug(supabaseClient: any, userId: string, slug: string): Promise<Folder | null> {
    const { data, error } = await supabaseClient
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
   * @param supabaseClient - Client Supabase authentifié avec les credentials de l'utilisateur
   */
  static async getGroupBySlug(supabaseClient: any, userId: string, slug: string): Promise<Folder | null> {
    // Requête optimisée : utilise la colonne slug avec index
    const { data, error } = await supabaseClient
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

  /**
   * Récupère tous les dossiers d'un utilisateur (non-groupes)
   * ✅ OPTIMISÉ : 1 seule requête au lieu de N+1 grâce à la fonction SQL
   * @param supabaseClient - Client Supabase authentifié avec les credentials de l'utilisateur
   */
  static async getUserFolders(supabaseClient: any, userId: string): Promise<Folder[]> {
    const { data, error } = await supabaseClient
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
   * @param supabaseClient - Client Supabase authentifié avec les credentials de l'utilisateur
   */
  static async getUserGroups(supabaseClient: any, userId: string): Promise<Folder[]> {
    const { data, error } = await supabaseClient
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
   * @param supabaseClient - Client Supabase authentifié avec les credentials de l'utilisateur
   */
  static async getGroupFolders(supabaseClient: any, userId: string, groupId: string): Promise<Folder[]> {
    const { data, error } = await supabaseClient
      .rpc('get_group_folders_with_counts', { p_group_id: groupId });

    if (error) {
      console.error('Error fetching group folders:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Crée un nouveau dossier
   * @param supabaseClient - Client Supabase authentifié avec les credentials de l'utilisateur
   */
  static async createFolder(supabaseClient: any, userId: string, name: string, parentFolderId?: string | null): Promise<Folder | null> {
    try {
      const { data, error } = await supabaseClient
        .from('folders')
        .insert({
          user_id: userId,
          name: name,
          is_group: false,
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

  /**
   * Déplace un dossier dans un groupe
   * @param supabaseClient - Client Supabase authentifié avec les credentials de l'utilisateur
   */
  static async moveFolderToGroup(supabaseClient: any, folderId: string, groupId: string | null): Promise<boolean> {
    try {
      const { error } = await supabaseClient
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
   * @param supabaseClient - Client Supabase authentifié avec les credentials de l'utilisateur
   */
  static async renameFolder(supabaseClient: any, folderId: string, newName: string): Promise<Folder | null> {
    try {
      const { data, error } = await supabaseClient
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

  /**
   * Supprime un ou plusieurs dossiers
   * Les liens seront automatiquement déplacés vers "Récents" par le trigger SQL
   * @param supabaseClient - Client Supabase authentifié avec les credentials de l'utilisateur
   */
  static async deleteFolders(supabaseClient: any, folderIds: string[]): Promise<boolean> {
    try {
      const { error } = await supabaseClient
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
