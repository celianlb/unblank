import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderService, type Folder } from '../services/FolderService';

/**
 * Hook pour récupérer tous les dossiers d'un utilisateur
 */
export function useFolders(userId: string | undefined) {
  return useQuery({
    queryKey: ['folders', userId],
    queryFn: () => FolderService.getUserFolders(userId!),
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
    queryFn: () => FolderService.getUserGroups(userId!),
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
    queryFn: () => FolderService.getFolderBySlug(userId!, slug!),
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
    queryFn: () => FolderService.getGroupBySlug(userId!, slug!),
    enabled: !!userId && !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer les sous-dossiers d'un groupe
 */
export function useGroupFolders(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-folders', groupId],
    queryFn: () => FolderService.getGroupFolders(groupId!),
    enabled: !!groupId,
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
    mutationFn: (data: { name: string; isGroup: boolean; parentFolderId?: string | null }) =>
      FolderService.createFolder(userId, data.name, data.isGroup, data.parentFolderId),

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
    mutationFn: (folderIds: string[]) => FolderService.deleteFolders(folderIds),

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
 * Hook pour déplacer un dossier vers un groupe
 */
export function useMoveFolderToGroup(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, groupId }: { folderId: string; groupId: string }) =>
      FolderService.moveFolderToGroup(folderId, groupId),

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
