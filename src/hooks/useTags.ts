import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Tag } from '@/domain/tags/models/Tag';
import type { TagWithMetadata } from '@/domain/tags/models/TagWithMetadata';
import TagFactory from '@/lib/tags/tagFactory';
import { supabase } from '@/infra/db/supabase';

// ✅ CLEAN ARCHITECTURE: Utilisation du singleton via la factory
const tagService = TagFactory.getTagService();

/**
 * Hook pour récupérer tous les tags d'un utilisateur avec métadonnées
 */
export function useTags(userId: string | undefined) {
  return useQuery({
    queryKey: ['tags', userId],
    queryFn: () => tagService.getUserTags(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook pour récupérer les suggestions de tags (autocomplete)
 */
export function useTagSuggestions(userId: string | undefined, searchTerm: string, limit?: number) {
  return useQuery({
    queryKey: ['tag-suggestions', userId, searchTerm, limit],
    queryFn: () => tagService.getTagSuggestions(userId!, searchTerm, limit),
    enabled: !!userId && searchTerm.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour créer un tag
 */
export function useCreateTag(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tag');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalider le cache des tags
      queryClient.invalidateQueries({ queryKey: ['tags', userId] });
      queryClient.invalidateQueries({ queryKey: ['tag-suggestions', userId] });
    },
  });
}

/**
 * Hook pour renommer un tag
 */
export function useRenameTag(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tagId, newName }: { tagId: string; newName: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to rename tag');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', userId] });
      queryClient.invalidateQueries({ queryKey: ['tag-suggestions', userId] });
    },
  });
}

/**
 * Hook pour supprimer un tag
 */
export function useDeleteTag(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete tag');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', userId] });
      queryClient.invalidateQueries({ queryKey: ['tag-suggestions', userId] });
    },
  });
}

/**
 * Hook pour fusionner plusieurs tags
 */
export function useMergeTags(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sourceTagIds, targetTagId }: { sourceTagIds: string[]; targetTagId: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch('/api/tags/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ sourceTagIds, targetTagId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to merge tags');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', userId] });
      queryClient.invalidateQueries({ queryKey: ['tag-suggestions', userId] });
      // Aussi invalider les liens qui pourraient afficher ces tags
      queryClient.invalidateQueries({ queryKey: ['links'] });
    },
  });
}
