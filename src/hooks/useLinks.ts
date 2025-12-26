import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import type { Link, CreateLinkData } from '@/domain/links/models';
import LinkFactory from '@/lib/links/linkFactory';

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
    mutationFn: (linkIds: string[]) => linkService.deleteLinks(linkIds),

    onSuccess: () => {
      // Invalider les liens du dossier
      if (folderId) {
        queryClient.invalidateQueries({ queryKey: ['links', folderId] });
      }

      // Invalider les liens de tous les utilisateurs (incluant infinite)
      queryClient.invalidateQueries({ queryKey: ['links', 'user'] });

      // Invalider tous les dossiers pour mettre à jour les compteurs
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['folder'] });
    },
  });
}

/**
 * Hook pour supprimer un seul lien
 * Invalide automatiquement le cache des liens et dossiers
 */
export function useDeleteLink(userId?: string, folderId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkId: string) => linkService.deleteLink(linkId),

    onSuccess: () => {
      // Invalider les liens du dossier
      if (folderId) {
        queryClient.invalidateQueries({ queryKey: ['links', folderId] });
      }

      // Invalider TOUS les liens de l'utilisateur (incluant infinite scroll)
      queryClient.invalidateQueries({ queryKey: ['links', 'user'] });

      // Invalider tous les dossiers pour mettre à jour les compteurs
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['folder'] });
    },
  });
}

/**
 * Hook pour créer un lien
 * Invalide automatiquement le cache des liens et dossiers
 */
export function useCreateLink(userId: string, folderId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLinkData) => linkService.createLink(userId, data),

    onSuccess: (newLink) => {
      if (!newLink) return;

      // Invalider les liens du dossier
      if (folderId || newLink.folder_id) {
        queryClient.invalidateQueries({ queryKey: ['links', folderId || newLink.folder_id] });
      }

      // Invalider TOUS les liens de l'utilisateur (incluant infinite scroll)
      queryClient.invalidateQueries({ queryKey: ['links', 'user'] });

      // Invalider tous les dossiers pour mettre à jour les compteurs
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['folder'] });
    },
  });
}
