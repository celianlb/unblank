import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinkService, type Link } from '../services/LinkService';

/**
 * Hook pour récupérer les liens d'un dossier
 */
export function useFolderLinks(folderId: string | undefined) {
  return useQuery({
    queryKey: ['links', folderId],
    queryFn: () => LinkService.getFolderLinks(folderId!),
    enabled: !!folderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook pour récupérer tous les liens d'un utilisateur
 */
export function useUserLinks(userId: string | undefined) {
  return useQuery({
    queryKey: ['links', 'user', userId],
    queryFn: () => LinkService.getUserLinks(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook pour supprimer des liens
 * Invalide automatiquement le cache des dossiers (pour mettre à jour les compteurs)
 */
export function useDeleteLinks(folderId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkIds: string[]) => LinkService.deleteLinks(linkIds),

    onSuccess: () => {
      // Invalider les liens du dossier
      if (folderId) {
        queryClient.invalidateQueries({ queryKey: ['links', folderId] });
      }

      // Invalider tous les dossiers pour mettre à jour les compteurs
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['folder'] });
    },
  });
}
