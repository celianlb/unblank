import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/infra/db/supabase';

/**
 * Hook to fetch folders shared with the current user
 */
export function useSharedFolders(userId: string | null) {
  return useQuery({
    queryKey: ['shared-folders', userId],
    queryFn: async () => {
      if (!userId) return [];

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
