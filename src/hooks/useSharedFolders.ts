import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/infra/db/supabase';
import { Folder } from '@/domain/folders/models/Folder';

interface SharedFoldersResponse {
  folders: Folder[];
  groups: Folder[];
  all: Folder[];
}

/**
 * Hook to fetch folders and groups shared with the current user
 */
export function useSharedFolders(userId: string | null) {
  return useQuery<SharedFoldersResponse>({
    queryKey: ['shared-folders', userId],
    queryFn: async () => {
      if (!userId) return { folders: [], groups: [], all: [] };

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`/api/folders/shared`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shared folders');
      }
      return response.json();
    },
    enabled: !!userId,
  });
}
