import { SupabaseClient } from '@supabase/supabase-js';
import { LinkRepository } from '@/domain/links/ports/LinkRepository';
import { Link, CreateLinkData } from '@/domain/links/models';
import { TagService } from '@/domain/tags/services/TagService';

export class LinkLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LinkLimitError';
  }
}

/**
 * Implémentation Supabase du repository de liens
 * Adapter entre Supabase et notre domaine métier
 */
export class SupabaseLinkRepository implements LinkRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly tagService?: TagService
  ) {}

  async getFolderLinks(folderId: string): Promise<Link[]> {
    const { data, error } = await this.supabase
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
      tags: link.link_tags
        ?.filter((lt: any) => lt.tags !== null) // ✅ Filtrer les tags orphelins
        .map((lt: any) => ({
          id: lt.tags.id,
          name: lt.tags.name,
          is_auto_generated: lt.is_auto_generated,
        })) || [],
    }));
  }

  async getUserLinks(userId: string, limit?: number, offset?: number): Promise<Link[]> {
    let query = this.supabase
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
      .is('folder_id', null)
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
      tags: link.link_tags
        ?.filter((lt: any) => lt.tags !== null) // ✅ Filtrer les tags orphelins
        .map((lt: any) => ({
          id: lt.tags.id,
          name: lt.tags.name,
          is_auto_generated: lt.is_auto_generated,
        })) || [],
    }));
  }

  async createLink(userId: string, data: CreateLinkData): Promise<Link | null> {
    try {
      // 1. Déterminer le dossier cible
      let targetFolderId = data.folderId || null;
      let linkOwnerId = userId;

      // Si aucun dossier n'est spécifié, utiliser le dossier "Récents" de l'utilisateur
      if (!targetFolderId) {
        const { data: recentsFolder, error: recentsFolderError } = await this.supabase
          .from('folders')
          .select('id')
          .eq('user_id', userId)
          .eq('name', 'Récents')
          .eq('is_system', true)
          .maybeSingle();

        if (recentsFolderError) {
          console.error('Error fetching Récents folder:', recentsFolderError);
        }

        if (recentsFolder) {
          targetFolderId = recentsFolder.id;
        }
      }

      // 2. Si le lien est dans un dossier spécifique, récupérer le propriétaire du dossier
      if (data.folderId) {
        const { data: folder, error: folderError } = await this.supabase
          .from('folders')
          .select('user_id')
          .eq('id', data.folderId)
          .single();

        if (folderError) {
          console.error('Error fetching folder:', folderError);
          return null;
        }

        if (folder) {
          linkOwnerId = folder.user_id;
        }
      }

      // 3. Créer le lien avec le user_id du propriétaire du dossier (ou de l'utilisateur si pas de dossier)
      const { data: link, error: linkError } = await this.supabase
        .from('links')
        .insert({
          user_id: linkOwnerId,
          folder_id: targetFolderId,
          url: data.url,
          title: data.title || null,
          description: data.description || null,
          original_image_url: data.originalImageUrl || null,
          screenshot_url: null,
          image_format: data.imageFormat || null,
          content_type: data.contentType || null,
          position: 0,
        })
        .select()
        .single();

      if (linkError) {
        console.error('Error creating link:', linkError);
        
        // Détecter l'erreur de limite mensuelle de liens
        if (linkError.message?.includes('Monthly links limit reached')) {
          throw new LinkLimitError(
            'Limite mensuelle de liens atteinte (50 liens/mois). Passez au plan Pro pour continuer.'
          );
        }
        
        throw new Error(linkError.message || 'Failed to create link');
      }

      if (!link) {
        throw new Error('Failed to create link');
      }

      // 4. Ajouter les tags si fournis
      if (data.tags && data.tags.length > 0 && this.tagService) {
        for (const tagName of data.tags) {
          // ✅ CLEAN ARCHITECTURE: Utiliser TagService pour normalisation et création
          const tag = await this.tagService.createTag(linkOwnerId, tagName);

          if (!tag) {
            console.error('Error creating/getting tag:', tagName);
            continue;
          }

          // Associer le tag au lien
          await this.supabase.from('link_tags').insert({
            link_id: link.id,
            tag_id: tag.id,
            is_auto_generated: false,
          });
        }
      }

      // 5. Récupérer le lien complet avec les tags
      const { data: completeLink } = await this.supabase
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
      // Laisser remonter les erreurs métier (comme LinkLimitError)
      throw error;
    }
  }

  async deleteLink(linkId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
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

  async deleteLinks(linkIds: string[]): Promise<boolean> {
    try {
      const { error } = await this.supabase
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

  async updateTags(linkId: string, userId: string, tags: string[]): Promise<boolean> {
    try {
      // ✅ Vérifier que le lien existe et que l'utilisateur a les permissions (RLS le gère)
      const { data: link, error: linkError } = await this.supabase
        .from('links')
        .select('id')
        .eq('id', linkId)
        .maybeSingle();

      if (linkError || !link) {
        console.error('Link not found or unauthorized:', linkError);
        return false;
      }

      // 2. Supprimer les associations existantes
      await this.supabase
        .from('link_tags')
        .delete()
        .eq('link_id', linkId);

      // 3. Si aucun tag, on s'arrête là
      if (tags.length === 0) {
        return true;
      }

      // 4. Créer ou récupérer les tags via TagService (clean architecture)
      if (!this.tagService) {
        console.error('TagService not injected - cannot update tags');
        return false;
      }

      for (const tagName of tags) {
        // ✅ CLEAN ARCHITECTURE: Utiliser TagService pour normalisation et création
        const tag = await this.tagService.createTag(userId, tagName);

        if (!tag) {
          console.error('Error creating/getting tag:', tagName);
          continue;
        }

        // Associer le tag au lien
        await this.supabase.from('link_tags').insert({
          link_id: linkId,
          tag_id: tag.id,
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
   * Déplace un lien vers un autre dossier
   */
  async moveLinkToFolder(linkId: string, targetFolderId: string | null): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('links')
        .update({ folder_id: targetFolderId })
        .eq('id', linkId);

      if (error) {
        console.error('Error moving link to folder:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error moving link to folder:', error);
      return false;
    }
  }
}
