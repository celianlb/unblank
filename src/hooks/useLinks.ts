import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import type { Link, CreateLinkData } from '@/domain/links/models';
import LinkFactory from '@/lib/links/linkFactory';
import { supabase } from '@/infra/db/supabase';

// ✅ CLEAN ARCHITECTURE: Utilisation du singleton via la factory
const linkService = LinkFactory.getLinkService();

/**
 * Hook pour récupérer les liens d'un dossier
 */
export function useFolderLinks(folderId: string | undefined) {
  return useQuery({
    queryKey: ['links', folderId],
    queryFn: () => linkService.getFolderLinks(folderId!),
    enabled: !!folderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook pour récupérer tous les liens d'un utilisateur
 * @param limit - Nombre maximum de liens à récupérer (optionnel)
 */
export function useUserLinks(userId: string | undefined, limit?: number) {
  return useQuery({
    queryKey: ['links', 'user', userId, limit],
    queryFn: () => linkService.getUserLinks(userId!, limit),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer le nombre total de liens d'un utilisateur
 */
export function useUserLinksCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['links', 'user', 'count', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('links')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .is('folder_id', null);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer les liens d'un utilisateur avec pagination infinie
 * @param pageSize - Nombre de liens par page (défaut: 12)
 */
export function useInfiniteUserLinks(userId: string | undefined, pageSize: number = 12) {
  return useInfiniteQuery({
    queryKey: ['links', 'user', 'infinite', userId, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam * pageSize;
      // On demande pageSize + 1 pour savoir s'il y a une page suivante
      const links = await linkService.getUserLinks(userId!, pageSize + 1, offset);

      // S'il y a plus de pageSize résultats, il y a une page suivante
      const hasMore = links.length > pageSize;
      const resultLinks = hasMore ? links.slice(0, pageSize) : links;

      return {
        links: resultLinks,
        nextPage: hasMore ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    initialPageParam: 0,
  });
}

/**
 * Hook pour supprimer des liens
 * Invalide automatiquement le cache des dossiers (pour mettre à jour les compteurs)
 */
export function useDeleteLinks(folderId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkIds: string[]) => {
      // Récupérer le token d'accès depuis Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch('/api/links', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ linkIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete links');
      }

      return response.json();
    },

    onSuccess: () => {
      // Invalider les liens du dossier
      if (folderId) {
        queryClient.invalidateQueries({ queryKey: ['links', folderId] });
      }

      // Invalider les liens de tous les utilisateurs (incluant infinite)
      queryClient.invalidateQueries({ queryKey: ['links', 'user'] });

      // Invalider tous les dossiers pour mettre à jour les compteurs et miniatures
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['folder'] });
      queryClient.invalidateQueries({ queryKey: ['group-folders'] }); // ✅ Invalider les dossiers des groupes (pour les miniatures)
      // ✅ Invalider aussi les dossiers partagés pour que les autres utilisateurs voient le changement
      queryClient.invalidateQueries({ queryKey: ['shared-folders'] });
    },
  });
}

/**
 * Hook pour supprimer un seul lien
 * ✅ CLEAN ARCHITECTURE: Utilise l'API route avec vérification de permissions
 */
export function useDeleteLink(userId?: string, folderId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkId: string) => {
      // Récupérer le token d'accès depuis Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`/api/links/${linkId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete link');
      }

      return response.json();
    },

    onSuccess: () => {
      // Invalider les liens du dossier
      if (folderId) {
        queryClient.invalidateQueries({ queryKey: ['links', folderId] });
      }

      // Invalider TOUS les liens de l'utilisateur (incluant infinite scroll)
      queryClient.invalidateQueries({ queryKey: ['links', 'user'] });

      // Invalider tous les dossiers pour mettre à jour les compteurs et miniatures
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['folder'] });
      queryClient.invalidateQueries({ queryKey: ['group-folders'] }); // ✅ Invalider les dossiers des groupes (pour les miniatures)
      // ✅ Invalider aussi les dossiers partagés pour que les autres utilisateurs voient le changement
      queryClient.invalidateQueries({ queryKey: ['shared-folders'] });
    },
  });
}

/**
 * Hook pour créer un lien
 * ✅ CLEAN ARCHITECTURE: Utilise l'API route avec vérification de permissions
 */
export function useCreateLink(userId: string, folderId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLinkData) => {
      // Récupérer le token d'accès depuis Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(errorData.error || 'Failed to create link');
        (error as any).code = errorData.code;
        throw error;
      }

      const result = await response.json();
      return result.link;
    },

    onSuccess: (newLink) => {
      if (!newLink) return;

      // Invalider les liens du dossier
      if (folderId || newLink.folder_id) {
        queryClient.invalidateQueries({ queryKey: ['links', folderId || newLink.folder_id] });
      }

      // Invalider TOUS les liens de l'utilisateur (incluant infinite scroll)
      queryClient.invalidateQueries({ queryKey: ['links', 'user'] });

      // Invalider tous les dossiers pour mettre à jour les compteurs et miniatures
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['folder'] });
      queryClient.invalidateQueries({ queryKey: ['group-folders'] }); // ✅ Invalider les dossiers des groupes (pour les miniatures)
      // ✅ Invalider aussi les dossiers partagés pour que les autres utilisateurs voient le changement
      queryClient.invalidateQueries({ queryKey: ['shared-folders'] });
    },
  });
}

/**
 * Hook pour déplacer un lien vers un autre dossier
 */
export function useMoveLinkToFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId, targetFolderId }: { linkId: string; targetFolderId: string | null }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`/api/links/${linkId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ targetFolderId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to move link');
      }

      return response.json();
    },

    onSuccess: () => {
      // Invalider toutes les queries de liens
      queryClient.invalidateQueries({ queryKey: ['links'] });
      // Invalider les dossiers pour mettre à jour les compteurs et miniatures
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['folder'] });
      queryClient.invalidateQueries({ queryKey: ['sub-folders'] });
      queryClient.invalidateQueries({ queryKey: ['shared-folders'] });
    },
  });
}
