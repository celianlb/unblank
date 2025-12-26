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
   * @param supabaseClient - Client Supabase authentifié avec les credentials de l'utilisateur
   */
  static async getFolderLinks(supabaseClient: any, folderId: string): Promise<Link[]> {
    const { data, error } = await supabaseClient
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
   * @param supabaseClient - Client Supabase authentifié avec les credentials de l'utilisateur
   */
  static async getUserLinks(supabaseClient: any, userId: string, limit?: number, offset?: number): Promise<Link[]> {
    let query = supabaseClient
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

    // Ajouter la limite si fournie
    if (limit) {
      query = query.limit(limit);
    }

    // Ajouter l'offset si fourni (pour pagination)
    if (offset) {
      query = query.range(offset, offset + (limit || 10) - 1);
    }

    const { data, error } = await query;

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
   * Supprime un seul lien
   * @param supabaseClient - Client Supabase authentifié avec les credentials de l'utilisateur
   */
  static async deleteLink(supabaseClient: any, linkId: string): Promise<boolean> {
    try {
      const { error } = await supabaseClient
        .from('links')
        .delete()
        .eq('id', linkId);

      if (error) {
        console.error('Error deleting link:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting link:', error);
      return false;
    }
  }

  /**
   * Supprime plusieurs liens
   * @param supabaseClient - Client Supabase authentifié avec les credentials de l'utilisateur
   */
  static async deleteLinks(supabaseClient: any, linkIds: string[]): Promise<boolean> {
    try {
      const { error } = await supabaseClient
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

  /**
   * Crée un nouveau lien
   * @param supabaseClient - Client Supabase authentifié avec les credentials de l'utilisateur
   */
  static async createLink(
    supabaseClient: any,
    userId: string,
    data: {
      url: string;
      title?: string;
      description?: string;
      folderId?: string;
      originalImageUrl?: string;
      imageFormat?: string;
      contentType?: string;
      tags?: string[];
    }
  ): Promise<Link | null> {
    try {
      // 1. Créer le lien
      const { data: link, error: linkError } = await supabaseClient
        .from('links')
        .insert({
          user_id: userId,
          folder_id: data.folderId || null,
          url: data.url,
          title: data.title || null,
          description: data.description || null,
          original_image_url: data.originalImageUrl || null,
          image_format: data.imageFormat || null,
          content_type: data.contentType || null,
          position: 0,
        })
        .select()
        .single();

      if (linkError || !link) {
        console.error('Error creating link:', linkError);
        return null;
      }

      // 2. Ajouter les tags si fournis
      if (data.tags && data.tags.length > 0) {
        for (const tagName of data.tags) {
          // Vérifier si le tag existe déjà pour cet utilisateur
          let { data: existingTag } = await supabaseClient
            .from('tags')
            .select('id')
            .eq('user_id', userId)
            .eq('name', tagName)
            .maybeSingle();

          let tagId: string;

          if (existingTag) {
            tagId = existingTag.id;
          } else {
            // Créer le tag
            const { data: newTag, error: tagError } = await supabaseClient
              .from('tags')
              .insert({
                user_id: userId,
                name: tagName,
              })
              .select()
              .single();

            if (tagError || !newTag) {
              console.error('Error creating tag:', tagError);
              continue;
            }

            tagId = newTag.id;
          }

          // Associer le tag au lien
          await supabaseClient.from('link_tags').insert({
            link_id: link.id,
            tag_id: tagId,
            is_auto_generated: false,
          });
        }
      }

      // 3. Récupérer le lien complet avec les tags
      const { data: completeLink } = await supabaseClient
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
        .eq('id', link.id)
        .single();

      if (completeLink) {
        return {
          ...completeLink,
          tags: completeLink.link_tags?.map((lt: any) => ({
            id: lt.tags.id,
            name: lt.tags.name,
            is_auto_generated: lt.is_auto_generated,
          })) || [],
        };
      }

      return link as Link;
    } catch (error) {
      console.error('Error creating link:', error);
      return null;
    }
  }

  /**
   * Met à jour les tags d'un lien
   * @param supabaseClient - Client Supabase authentifié avec les credentials de l'utilisateur
   */
  static async updateTags(
    supabaseClient: any,
    linkId: string,
    userId: string,
    tags: string[]
  ): Promise<boolean> {
    try {
      // 1. Vérifier que le lien appartient à l'utilisateur
      const { data: link, error: linkError } = await supabaseClient
        .from('links')
        .select('id')
        .eq('id', linkId)
        .eq('user_id', userId)
        .maybeSingle();

      if (linkError || !link) {
        console.error('Link not found or unauthorized:', linkError);
        return false;
      }

      // 2. Supprimer les associations existantes
      await supabaseClient
        .from('link_tags')
        .delete()
        .eq('link_id', linkId);

      // 3. Si aucun tag, on s'arrête là
      if (tags.length === 0) {
        return true;
      }

      // 4. Créer ou récupérer les tags et créer les associations
      for (const tagName of tags) {
        // Vérifier si le tag existe déjà pour cet utilisateur
        let { data: existingTag } = await supabaseClient
          .from('tags')
          .select('id')
          .eq('user_id', userId)
          .eq('name', tagName)
          .maybeSingle();

        let tagId: string;

        if (existingTag) {
          tagId = existingTag.id;
        } else {
          // Créer le tag
          const { data: newTag, error: tagError } = await supabaseClient
            .from('tags')
            .insert({
              user_id: userId,
              name: tagName,
            })
            .select('id')
            .single();

          if (tagError || !newTag) {
            console.error('Error creating tag:', tagError);
            continue;
          }

          tagId = newTag.id;
        }

        // Associer le tag au lien
        await supabaseClient.from('link_tags').insert({
          link_id: linkId,
          tag_id: tagId,
          is_auto_generated: false,
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating tags:', error);
      return false;
    }
  }

  /**
   * Extrait les métadonnées d'une URL via l'API
   */
  static async extractMetadata(url: string): Promise<{
    url: string;
    title: string;
    description: string;
    image: string | null;
    contentType: 'image' | 'video' | 'link';
    imageFormat?: string;
  } | null> {
    try {
      const response = await fetch('/api/extract-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract metadata');
      }

      return await response.json();
    } catch (error) {
      console.error('Error extracting metadata:', error);
      return null;
    }
  }
}
