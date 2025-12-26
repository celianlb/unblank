import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Folder } from '@/domain/folders/models';
import FolderFactory from '@/lib/folders/folderFactory';
import { supabase } from '@/infra/db/supabase';

// ✅ CLEAN ARCHITECTURE: Utilisation du singleton via la factory
const folderService = FolderFactory.getFolderService();

/**
 * Hook pour récupérer tous les dossiers d'un utilisateur
 */
export function useFolders(userId: string | undefined) {
  return useQuery({
    queryKey: ['folders', userId],
    queryFn: () => folderService.getUserFolders(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook pour récupérer tous les groupes d'un utilisateur
 */
export function useGroups(userId: string | undefined) {
  return useQuery({
    queryKey: ['groups', userId],
    queryFn: () => folderService.getUserGroups(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
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
 * Hook pour récupérer un groupe par son slug
 */
export function useGroupBySlug(userId: string | undefined, slug: string | undefined) {
  return useQuery({
    queryKey: ['group', userId, slug],
    queryFn: () => folderService.getGroupBySlug(userId!, slug!),
    enabled: !!userId && !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer les sous-dossiers d'un groupe
 */
export function useGroupFolders(userId: string | undefined, groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-folders', groupId],
    queryFn: () => folderService.getGroupFolders(userId!, groupId!),
    enabled: !!userId && !!groupId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook pour créer un dossier
 * Invalide automatiquement le cache après création
 */
export function useCreateFolder(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; parentFolderId?: string | null; isGroup?: boolean }) => {
      // Récupérer le token d'accès depuis Supabase
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
          isGroup: data.isGroup,
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
      queryClient.invalidateQueries({ queryKey: ['groups', userId] });

      // Si c'est un sous-dossier, invalider le groupe parent
      if (variables.parentFolderId) {
        queryClient.invalidateQueries({
          queryKey: ['group-folders', variables.parentFolderId]
        });
      }
    },
  });
}

/**
 * Hook pour supprimer des dossiers
 * Invalide automatiquement le cache après suppression
 */
export function useDeleteFolders(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folderIds: string[]) => folderService.deleteFolders(folderIds),

    onSuccess: () => {
      // Invalider TOUTES les queries de dossiers (car les liens sont déplacés vers Récents)
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group-folders'] });
      queryClient.invalidateQueries({ queryKey: ['folder'] });
    },
  });
}

/**
 * Hook pour renommer un dossier
 * Invalide automatiquement le cache après renommage
 */
export function useRenameFolder(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, newName }: { folderId: string; newName: string }) =>
      folderService.renameFolder(folderId, newName),

    onSuccess: () => {
      // Invalider toutes les queries de dossiers et groupes
      queryClient.invalidateQueries({ queryKey: ['folders', userId] });
      queryClient.invalidateQueries({ queryKey: ['groups', userId] });
      queryClient.invalidateQueries({ queryKey: ['folder'] });
      queryClient.invalidateQueries({ queryKey: ['group'] });
      queryClient.invalidateQueries({ queryKey: ['group-folders'] });
    },
  });
}

/**
 * Hook pour déplacer un dossier vers un groupe
 */
export function useMoveFolderToGroup(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, groupId }: { folderId: string; groupId: string }) =>
      folderService.moveFolderToGroup(folderId, groupId),

    onSuccess: (_, variables) => {
      // Invalider les listes de dossiers et le groupe concerné
      queryClient.invalidateQueries({ queryKey: ['folders', userId] });
      queryClient.invalidateQueries({ queryKey: ['groups', userId] });
      queryClient.invalidateQueries({
        queryKey: ['group-folders', variables.groupId]
      });
    },
  });
}
