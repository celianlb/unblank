import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/infra/db/supabase';
import type { Link } from '@/domain/links/models/Link';
import type { TagWithCount, UnifiedSearchResultItem } from '@/domain/search/models/SearchResult';

interface SearchParams {
  query?: string;
  tagNames?: string[];
  folderId?: string;
}

interface SearchResponse {
  links: Link[];
  total: number;
  hasMore: boolean;
}

interface UnifiedSearchResponse {
  results: UnifiedSearchResultItem[];
  total: number;
  hasMore: boolean;
}

/**
 * Hook pour rechercher des liens avec pagination infinie
 * @param params - Paramètres de recherche (query, tagNames, folderId)
 * @param pageSize - Nombre de résultats par page (défaut: 20)
 */
export function useInfiniteSearch(params: SearchParams, pageSize: number = 20) {
  // Only enable search when there's a query or tag filter
  const hasSearchCriteria = (params.query && params.query.trim().length >= 2) || (params.tagNames && params.tagNames.length > 0);

  return useInfiniteQuery({
    queryKey: ['search', params.query, params.tagNames, params.folderId, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      // Récupérer le token d'accès depuis Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token found');
      }

      const offset = pageParam * pageSize;

      // Construire l'URL avec les paramètres
      const urlParams = new URLSearchParams();
      if (params.query) urlParams.append('query', params.query);
      if (params.folderId) urlParams.append('folderId', params.folderId);
      if (params.tagNames) {
        params.tagNames.forEach(tag => urlParams.append('tags', tag));
      }
      urlParams.append('limit', String(pageSize));
      urlParams.append('offset', String(offset));

      const response = await fetch(`/api/search?${urlParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search links');
      }

      const data: SearchResponse = await response.json();

      return {
        links: data.links,
        hasMore: data.hasMore,
        nextPage: data.hasMore ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: hasSearchCriteria, // Only search when there's a query or tags
    staleTime: 2 * 60 * 1000, // 2 minutes
    initialPageParam: 0,
  });
}

/**
 * Hook pour récupérer les liens récents (5 derniers liens)
 * Utilisé pour l'affichage initial dans la modal de recherche
 */
export function useRecentLinks(limit: number = 5) {
  return useQuery({
    queryKey: ['links', 'recent', limit],
    queryFn: async () => {
      // Récupérer le token d'accès depuis Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`/api/search?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch recent links');
      }

      const data: SearchResponse = await response.json();
      return data.links;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook pour recherche unifiée (liens + dossiers + groupes) avec pagination infinie
 * @param params - Paramètres de recherche (query, tagNames)
 * @param pageSize - Nombre de résultats par page (défaut: 20)
 */
export function useUnifiedInfiniteSearch(params: Omit<SearchParams, 'folderId'>, pageSize: number = 20) {
  // Only enable search when there's a query or tag filter
  const hasSearchCriteria = (params.query && params.query.trim().length >= 2) || (params.tagNames && params.tagNames.length > 0);

  return useInfiniteQuery({
    queryKey: ['unified-search', params.query, params.tagNames, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      // Récupérer le token d'accès depuis Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token found');
      }

      const offset = pageParam * pageSize;

      // Construire l'URL avec les paramètres
      const urlParams = new URLSearchParams();
      if (params.query) urlParams.append('query', params.query);
      if (params.tagNames) {
        params.tagNames.forEach(tag => urlParams.append('tags', tag));
      }
      urlParams.append('limit', String(pageSize));
      urlParams.append('offset', String(offset));

      const response = await fetch(`/api/search/unified?${urlParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search');
      }

      const data: UnifiedSearchResponse = await response.json();

      return {
        results: data.results,
        hasMore: data.hasMore,
        nextPage: data.hasMore ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: hasSearchCriteria, // Only search when there's a query or tags
    staleTime: 2 * 60 * 1000, // 2 minutes
    initialPageParam: 0,
  });
}

/**
 * Hook pour récupérer tous les tags de l'utilisateur avec compteur d'utilisation
 * Utilisé pour l'autocomplete des tags dans la recherche
 */
export function useUserTags() {
  return useQuery({
    queryKey: ['tags', 'all'],
    queryFn: async () => {
      // Récupérer le token d'accès depuis Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch('/api/tags', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch tags');
      }

      const data: { tags: TagWithCount[] } = await response.json();
      return data.tags;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (les tags changent rarement)
  });
}
