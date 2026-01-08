import { Link } from '@/domain/links/models/Link';

/**
 * Filtres de recherche
 */
export interface SearchFilters {
  query?: string;
  tagNames?: string[];
  folderId?: string | null;
}

/**
 * Paramètres de recherche avec pagination
 */
export interface SearchParams extends SearchFilters {
  limit?: number;
  offset?: number;
}

/**
 * Type de résultat de recherche
 */
export type SearchResultType = 'link' | 'folder' | 'group';

/**
 * Item de résultat de recherche unifié
 */
export interface UnifiedSearchResultItem {
  result_type: SearchResultType;
  id: string;
  name: string;
  url?: string;
  description?: string;
  screenshot_url?: string;
  folder_id?: string;
  folder_name?: string;
  is_group: boolean;
  link_count: number;
  tags: Array<{ id: string; name: string }>;
  created_at: string;
  is_shared?: boolean; // Indique si le dossier/groupe est partagé avec l'utilisateur (true) ou lui appartient (false/undefined)
}

/**
 * Résultat de recherche avec métadonnées de pagination
 */
export interface SearchResult {
  links: Link[];
  total: number;
  hasMore: boolean;
}

/**
 * Résultat de recherche unifié avec métadonnées de pagination
 */
export interface UnifiedSearchResult {
  results: UnifiedSearchResultItem[];
  total: number;
  hasMore: boolean;
}

/**
 * Tag avec compteur d'utilisation
 */
export interface TagWithCount {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  usage_count: number;
}
