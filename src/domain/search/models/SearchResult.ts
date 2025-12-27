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
 * Résultat de recherche avec métadonnées de pagination
 */
export interface SearchResult {
  links: Link[];
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
