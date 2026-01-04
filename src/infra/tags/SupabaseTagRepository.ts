import { SupabaseClient } from '@supabase/supabase-js';
import { TagRepository } from '@/domain/tags/ports/TagRepository';
import { Tag } from '@/domain/tags/models/Tag';
import { TagWithMetadata } from '@/domain/tags/models/TagWithMetadata';

/**
 * Implémentation Supabase du repository de tags
 * Adapter entre Supabase et notre domaine métier
 */
export class SupabaseTagRepository implements TagRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getUserTags(userId: string): Promise<TagWithMetadata[]> {
    // Utiliser la fonction PostgreSQL optimisée pour éviter N+1
    const { data, error } = await this.supabase
      .rpc('get_tag_usage_stats', { p_user_id: userId });

    if (error) {
      console.error('Error fetching user tags:', error);
      throw error;
    }

    return data || [];
  }

  async getTagByName(userId: string, name: string): Promise<Tag | null> {
    // Recherche case-insensitive grâce à LOWER()
    const { data, error } = await this.supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', name)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching tag by name:', error);
      return null;
    }

    return data;
  }

  async getTagById(tagId: string): Promise<Tag | null> {
    const { data, error } = await this.supabase
      .from('tags')
      .select('*')
      .eq('id', tagId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching tag by id:', error);
      return null;
    }

    return data;
  }

  async getTagSuggestions(userId: string, searchTerm: string, limit: number = 10): Promise<TagWithMetadata[]> {
    // Utiliser la fonction PostgreSQL pour performance
    const { data, error } = await this.supabase
      .rpc('get_tag_suggestions', {
        p_user_id: userId,
        p_search_term: searchTerm,
        p_limit: limit
      });

    if (error) {
      console.error('Error fetching tag suggestions:', error);
      throw error;
    }

    return data || [];
  }

  async createTag(userId: string, name: string): Promise<Tag | null> {
    const { data, error } = await this.supabase
      .from('tags')
      .insert({
        user_id: userId,
        name: name
      })
      .select()
      .single();

    if (error) {
      // Si c'est une erreur de duplication (unique constraint), retourner le tag existant
      if (error.code === '23505') {
        return this.getTagByName(userId, name);
      }
      console.error('Error creating tag:', error);
      return null;
    }

    return data;
  }

  async renameTag(tagId: string, newName: string): Promise<Tag | null> {
    const { data, error } = await this.supabase
      .from('tags')
      .update({ name: newName })
      .eq('id', tagId)
      .select()
      .single();

    if (error) {
      console.error('Error renaming tag:', error);
      return null;
    }

    return data;
  }

  async deleteTag(tagId: string): Promise<boolean> {
    // Les link_tags seront supprimés en cascade par la DB
    const { error } = await this.supabase
      .from('tags')
      .delete()
      .eq('id', tagId);

    if (error) {
      console.error('Error deleting tag:', error);
      return false;
    }

    return true;
  }

  async mergeTags(sourceTagIds: string[], targetTagId: string): Promise<boolean> {
    // Utiliser la fonction PostgreSQL pour la fusion atomique
    const { error } = await this.supabase
      .rpc('merge_tags', {
        p_source_tag_ids: sourceTagIds,
        p_target_tag_id: targetTagId
      });

    if (error) {
      console.error('Error merging tags:', error);
      return false;
    }

    return true;
  }

  async deleteOrphanTags(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('cleanup_orphan_tags', { p_user_id: userId });

    if (error) {
      console.error('Error deleting orphan tags:', error);
      return 0;
    }

    return data || 0;
  }
}
