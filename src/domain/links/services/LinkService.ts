import { supabase } from '@/infra/db/supabase';

export interface Link {
  id: string;
  user_id: string;
  folder_id: string | null;
  url: string;
  title: string | null;
  description: string | null;
  screenshot_url: string | null;
  original_image_url: string | null;
  image_format: string | null;
  content_type: string | null;
  is_duplicate: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  is_auto_generated?: boolean;
}

export class LinkService {
  /**
   * Récupère tous les liens d'un dossier spécifique
   */
  static async getFolderLinks(folderId: string): Promise<Link[]> {
    const { data, error } = await supabase
      .from('links')
      .select(`
        *,
        link_tags (
          tag_id,
          is_auto_generated,
          tags (
            id,
            name
          )
        )
      `)
      .eq('folder_id', folderId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching folder links:', error);
      throw error;
    }

    // Transformer les données pour inclure les tags
    return (data || []).map((link: any) => ({
      ...link,
      tags: link.link_tags?.map((lt: any) => ({
        id: lt.tags.id,
        name: lt.tags.name,
        is_auto_generated: lt.is_auto_generated,
      })) || [],
    }));
  }

  /**
   * Récupère tous les liens d'un utilisateur (tous dossiers confondus)
   */
  static async getUserLinks(userId: string): Promise<Link[]> {
    const { data, error } = await supabase
      .from('links')
      .select(`
        *,
        link_tags (
          tag_id,
          is_auto_generated,
          tags (
            id,
            name
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user links:', error);
      throw error;
    }

    return (data || []).map((link: any) => ({
      ...link,
      tags: link.link_tags?.map((lt: any) => ({
        id: lt.tags.id,
        name: lt.tags.name,
        is_auto_generated: lt.is_auto_generated,
      })) || [],
    }));
  }

  /**
   * Formate la date d'ajout d'un lien
   */
  static formatDateAdded(createdAt: string): string {
    const date = new Date(createdAt);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Formate la taille du fichier (si disponible)
   */
  static formatFileSize(bytes?: number): string {
    if (!bytes) return 'N/A';

    const kb = bytes / 1024;
    const mb = kb / 1024;

    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    }
    return `${kb.toFixed(1)} KB`;
  }

  /**
   * Détecte le type de contenu d'un lien
   */
  static getContentType(link: Link): 'image' | 'link' {
    // Si on a une image originale ou un format d'image, c'est une image
    if (link.original_image_url || link.image_format) {
      return 'image';
    }

    // Si le content_type commence par 'image/', c'est une image
    if (link.content_type && link.content_type.startsWith('image/')) {
      return 'image';
    }

    // Sinon c'est un lien classique
    return 'link';
  }

  /**
   * Supprime plusieurs liens
   */
  static async deleteLinks(linkIds: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('links')
        .delete()
        .in('id', linkIds);

      if (error) {
        console.error('Error deleting links:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting links:', error);
      return false;
    }
  }
}
