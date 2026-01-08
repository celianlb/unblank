import { SupabaseClient } from '@supabase/supabase-js';
import { SearchRepository } from '@/domain/search/ports/SearchRepository';
import { Link } from '@/domain/links/models/Link';
import { SearchParams, TagWithCount, UnifiedSearchResultItem } from '@/domain/search/models/SearchResult';

/**
 * Implémentation Supabase du repository de recherche
 * Adapter entre Supabase et notre domaine métier
 */
export class SupabaseSearchRepository implements SearchRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Recherche des liens via la fonction RPC search_links
   */
  async searchLinks(userId: string, params: SearchParams): Promise<Link[]> {
    const { query, tagNames, folderId, limit = 20, offset = 0 } = params;

    // Appel à la fonction RPC PostgreSQL avec limit et offset
    const { data, error } = await this.supabase.rpc('search_links', {
      p_user_id: userId,
      p_query: query || null,
      p_tag_names: tagNames && tagNames.length > 0 ? tagNames : null,
      p_folder_id: folderId || null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('Error searching links:', error);
      throw error;
    }

    const links = data || [];

    // Parser les tags JSON en objets
    return links.map((link: any) => ({
      ...link,
      tags: typeof link.tags === 'string' ? JSON.parse(link.tags) : link.tags,
    }));
  }

  /**
   * Recherche unifiée (liens + dossiers + groupes) via la fonction RPC unified_search
   */
  async unifiedSearch(userId: string, params: SearchParams): Promise<UnifiedSearchResultItem[]> {
    const { query, tagNames, limit = 20, offset = 0 } = params;

    // Appel à la fonction RPC PostgreSQL avec limit et offset
    const { data, error } = await this.supabase.rpc('unified_search', {
      p_user_id: userId,
      p_query: query || null,
      p_tag_names: tagNames && tagNames.length > 0 ? tagNames : null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('Error in unified search:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Récupère tous les tags de l'utilisateur avec compteur d'utilisation
   */
  async getUserTags(userId: string): Promise<TagWithCount[]> {
    // Récupérer tous les tags de l'utilisateur
    const { data: tags, error: tagsError } = await this.supabase
      .from('tags')
      .select('id, name, user_id, created_at')
      .eq('user_id', userId);

    if (tagsError) {
      console.error('Error fetching user tags:', tagsError);
      throw tagsError;
    }

    if (!tags || tags.length === 0) {
      return [];
    }

    // Pour chaque tag, compter le nombre de liens associés
    const tagsWithCount: TagWithCount[] = await Promise.all(
      tags.map(async (tag) => {
        const { count } = await this.supabase
          .from('link_tags')
          .select('*', { count: 'exact', head: true })
          .eq('tag_id', tag.id);

        return {
          id: tag.id,
          name: tag.name,
          user_id: tag.user_id,
          created_at: tag.created_at,
          usage_count: count || 0,
        };
      })
    );

    // Trier par utilisation décroissante
    return tagsWithCount.sort((a, b) => b.usage_count - a.usage_count);
  }
}
