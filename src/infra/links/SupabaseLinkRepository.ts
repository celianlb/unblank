import { SupabaseClient } from '@supabase/supabase-js';
import { LinkRepository } from '@/domain/links/ports/LinkRepository';
import { Link, CreateLinkData } from '@/domain/links/models';

/**
 * Implémentation Supabase du repository de liens
 * Adapter entre Supabase et notre domaine métier
 */
export class SupabaseLinkRepository implements LinkRepository {
  constructor(private readonly supabase: SupabaseClient) {}

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
      tags: link.link_tags?.map((lt: any) => ({
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
      tags: link.link_tags?.map((lt: any) => ({
        id: lt.tags.id,
        name: lt.tags.name,
        is_auto_generated: lt.is_auto_generated,
      })) || [],
    }));
  }

  async createLink(userId: string, data: CreateLinkData): Promise<Link | null> {
    try {
      // 1. Créer le lien
      const { data: link, error: linkError } = await this.supabase
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
          let { data: existingTag } = await this.supabase
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
            const { data: newTag, error: tagError } = await this.supabase
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
          await this.supabase.from('link_tags').insert({
            link_id: link.id,
            tag_id: tagId,
            is_auto_generated: false,
          });
        }
      }

      // 3. Récupérer le lien complet avec les tags
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
      return null;
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
      // 1. Vérifier que le lien appartient à l'utilisateur
      const { data: link, error: linkError } = await this.supabase
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
      await this.supabase
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
        let { data: existingTag } = await this.supabase
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
          const { data: newTag, error: tagError } = await this.supabase
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
        await this.supabase.from('link_tags').insert({
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
}
