import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Folder } from '@/domain/folders/models';
import FolderFactory from '@/lib/folders/folderFactory';
import { supabase } from '@/infra/db/supabase';

// ✅ CLEAN ARCHITECTURE: Utilisation du singleton via la factory
const folderService = FolderFactory.getFolderService();

/**
 * Hook pour récupérer tous les dossiers top-level d'un utilisateur
 */
export function useFolders(userId: string | undefined) {
  return useQuery({
    queryKey: ['folders', userId],
    queryFn: () => folderService.getUserFolders(userId!),
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: true,
  });
}

/**
 * Hook pour récupérer un dossier par son slug
 */
export function useFolderBySlug(userId: string | undefined, slug: string | undefined) {
  return useQuery({
    queryKey: ['folder', userId, slug],
    queryFn: () => folderService.getFolderBySlug(userId!, slug!),
    enabled: !!userId && !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer les sous-dossiers d'un dossier parent
 */
export function useSubFolders(userId: string | undefined, parentFolderId: string | undefined) {
  return useQuery({
    queryKey: ['sub-folders', parentFolderId],
    queryFn: () => folderService.getSubFolders(userId!, parentFolderId!),
    enabled: !!userId && !!parentFolderId,
    staleTime: 0,
    refetchOnMount: true,
  });
}

/**
 * Hook pour créer un dossier
 * Invalide automatiquement le cache après création
 */
export function useCreateFolder(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; parentFolderId?: string | null }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: data.name,
          parentFolderId: data.parentFolderId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create folder');
      }

      const result = await response.json();
      return result.folder;
    },

    onSuccess: (newFolder, variables) => {
      // Invalider les listes concernées
      queryClient.invalidateQueries({ queryKey: ['folders', userId] });

      // Si c'est un sous-dossier, invalider le dossier parent
      if (variables.parentFolderId) {
        queryClient.invalidateQueries({
          queryKey: ['sub-folders', variables.parentFolderId]
        });
      }

      // Invalider aussi les dossiers partagés
      queryClient.invalidateQueries({ queryKey: ['shared-folders'] });
    },
  });
}

/**
 * Hook pour supprimer des dossiers
 */
export function useDeleteFolders(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folderIds: string[]) => {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch('/api/folders', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ folderIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete folders');
      }

      return response.json();
    },

    onSuccess: () => {
      // Invalider TOUTES les queries de dossiers
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['sub-folders'] });
      queryClient.invalidateQueries({ queryKey: ['folder'] });
      queryClient.invalidateQueries({ queryKey: ['shared-folders'] });
    },
  });
}

/**
 * Hook pour renommer un dossier
 */
export function useRenameFolder(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ folderId, newName }: { folderId: string; newName: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to rename folder');
      }

      const result = await response.json();
      return result.folder;
    },

    onSuccess: () => {
      // Invalider toutes les queries de dossiers
      queryClient.invalidateQueries({ queryKey: ['folders', userId] });
      queryClient.invalidateQueries({ queryKey: ['folder'] });
      queryClient.invalidateQueries({ queryKey: ['sub-folders'] });
      queryClient.invalidateQueries({ queryKey: ['shared-folders'] });
    },
  });
}

/**
 * Hook pour déplacer un dossier vers un autre dossier parent
 */
export function useMoveFolderToParent(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ folderId, parentFolderId }: { folderId: string; parentFolderId: string | null }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`/api/folders/${folderId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ parentFolderId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to move folder');
      }

      return response.json();
    },

    onSuccess: (_, variables) => {
      // Invalider les listes de dossiers
      queryClient.invalidateQueries({ queryKey: ['folders', userId] });
      queryClient.invalidateQueries({ queryKey: ['sub-folders'] });
      queryClient.invalidateQueries({ queryKey: ['shared-folders'] });
    },
  });
}
