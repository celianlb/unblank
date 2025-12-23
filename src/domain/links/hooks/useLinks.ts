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

      // Invalider les liens de tous les utilisateurs
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
    mutationFn: async (linkId: string) => {
      console.log('useDeleteLink mutation called with ID:', linkId);
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        const error = await response.text();
        console.error('Delete failed:', error);
        throw new Error('Failed to delete link');
      }

      const result = await response.json();
      console.log('Delete successful:', result);
      return result;
    },

    onSuccess: () => {
      console.log('Delete mutation onSuccess called');
      console.log('Invalidating queries...');

      // Invalider les liens du dossier
      if (folderId) {
        queryClient.invalidateQueries({ queryKey: ['links', folderId] });
      }

      // Invalider les liens de l'utilisateur avec le bon userId
      if (userId) {
        console.log('Invalidating user links for userId:', userId);
        queryClient.invalidateQueries({ queryKey: ['links', 'user', userId] });
      }

      // Invalider tous les liens user (au cas où)
      queryClient.invalidateQueries({ queryKey: ['links', 'user'] });

      // Invalider tous les dossiers pour mettre à jour les compteurs
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['folder'] });

      console.log('Queries invalidated');
    },

    onError: (error) => {
      console.error('Delete mutation onError called:', error);
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
    mutationFn: (data: {
      url: string;
      title?: string;
      description?: string;
      folderId?: string;
      originalImageUrl?: string;
      imageFormat?: string;
      contentType?: string;
      tags?: string[];
    }) => LinkService.createLink(userId, data),

    onSuccess: (newLink) => {
      if (!newLink) return;

      // Invalider les liens du dossier
      if (folderId || newLink.folder_id) {
        queryClient.invalidateQueries({ queryKey: ['links', folderId || newLink.folder_id] });
      }

      // Invalider les liens de l'utilisateur
      queryClient.invalidateQueries({ queryKey: ['links', 'user', userId] });

      // Invalider tous les dossiers pour mettre à jour les compteurs
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['folder'] });
    },
  });
}
