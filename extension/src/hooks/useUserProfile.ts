import { useState, useEffect } from 'react';
import type { UserData } from '../types';
import { getUserProfile } from '../utils/api';

/**
 * Hook to get and listen to user profile/subscription data
 */
export function useUserProfile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user profile on mount
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        console.log('[useUserProfile] Fetched user data:', data);
        console.log('[useUserProfile] Plan type:', data?.subscription?.planType);
        console.log('[useUserProfile] Can use AI tags:', data?.subscription?.features?.canUseAITags);
        setUserData(data);
        setError(null);
      } catch (err) {
        console.error('[useUserProfile] Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // Listen for storage changes (when user data is updated)
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'sync' && changes.user_data) {
        console.log('[useUserProfile] User data updated:', changes.user_data.newValue);
        const newValue = changes.user_data.newValue as UserData | null | undefined;
        setUserData(newValue || null);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // Cleanup listener on unmount
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  /**
   * Refresh user profile data
   */
  const refresh = async () => {
    setLoading(true);
    try {
      const data = await getUserProfile();
      setUserData(data);
      setError(null);
    } catch (err) {
      console.error('[useUserProfile] Error refreshing profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh profile');
    } finally {
      setLoading(false);
    }
  };

  return {
    userData,
    loading,
    error,
    refresh,
    // Convenience getters
    planType: userData?.subscription.planType || 'free',
    canUseAITags: userData?.subscription.features.canUseAITags || false,
    linksRemaining: userData?.usage.linksRemaining ?? 0,
    linksThisMonth: userData?.usage.linksThisMonth || 0,
    linksLimit: userData?.usage.linksLimit || 50,
  };
}
