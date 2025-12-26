import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SharePermission } from '@/domain/shares/models/Share';

// API endpoints
const SHARES_API = '/api/shares';

interface CreatePublicShareParams {
  folderId: string;
  permission: SharePermission;
  expiresAt?: string;
}

interface InviteByEmailParams {
  folderId: string;
  email: string;
  permission: SharePermission;
  expiresAt?: string;
}

interface UpdateSharePermissionParams {
  shareId: string;
  permission: SharePermission;
}

/**
 * Hook to fetch shares for a specific folder
 */
export function useFolderShares(folderId: string | null) {
  return useQuery({
    queryKey: ['shares', folderId],
    queryFn: async () => {
      if (!folderId) return [];

      const response = await fetch(`${SHARES_API}?folderId=${folderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch shares');
      }
      return response.json();
    },
    enabled: !!folderId,
  });
}

/**
 * Hook to create a public share link
 */
export function useCreatePublicShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreatePublicShareParams) => {
      const response = await fetch(`${SHARES_API}/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to create public share');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shares', variables.folderId] });
    },
  });
}

/**
 * Hook to invite a user by email
 */
export function useInviteByEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: InviteByEmailParams) => {
      const response = await fetch(`${SHARES_API}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to invite user');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shares', variables.folderId] });
    },
  });
}

/**
 * Hook to update share permission
 */
export function useUpdateSharePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateSharePermissionParams) => {
      const response = await fetch(`${SHARES_API}/${params.shareId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission: params.permission }),
      });

      if (!response.ok) {
        throw new Error('Failed to update share permission');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares'] });
    },
  });
}

/**
 * Hook to revoke a share
 */
export function useRevokeShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shareId: string) => {
      const response = await fetch(`${SHARES_API}/${shareId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke share');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares'] });
    },
  });
}

/**
 * Hook to validate a share token
 */
export function useValidateShareToken(token: string | null) {
  return useQuery({
    queryKey: ['share-token', token],
    queryFn: async () => {
      if (!token) return null;

      const response = await fetch(`${SHARES_API}/validate?token=${token}`);
      if (!response.ok) {
        throw new Error('Failed to validate share token');
      }
      return response.json();
    },
    enabled: !!token,
  });
}
