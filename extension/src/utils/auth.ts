import type { AuthSession } from '../types';

const STORAGE_KEYS = {
  SESSION: 'auth_session',
} as const;

/**
 * Check if the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await getSession();
    console.log('[Auth] isAuthenticated check - session:', session);
    if (!session) {
      console.log('[Auth] No session found');
      return false;
    }

    // Check if token is expired
    const now = Date.now();
    const isValid = session.expiresAt > now;
    console.log('[Auth] Token valid:', isValid, 'expires:', new Date(session.expiresAt), 'now:', new Date(now));
    return isValid;
  } catch (error) {
    console.error('[Auth] Error checking authentication:', error);
    return false;
  }
}

/**
 * Get the current session
 */
export async function getSession(): Promise<AuthSession | null> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEYS.SESSION], (result) => {
      const session = result[STORAGE_KEYS.SESSION] as AuthSession | undefined;
      console.log('[Auth] getSession result:', result, 'session:', session);
      resolve(session || null);
    });
  });
}

/**
 * Save the session
 */
export async function saveSession(session: AuthSession): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.set({ [STORAGE_KEYS.SESSION]: session }, () => {
        resolve();
      });
    } catch (error) {
      console.error('Error saving session:', error);
      reject(error);
    }
  });
}

/**
 * Clear the session (logout)
 */
export async function clearSession(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.remove(STORAGE_KEYS.SESSION, () => {
        resolve();
      });
    } catch (error) {
      console.error('Error clearing session:', error);
      reject(error);
    }
  });
}

/**
 * Get the access token
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.accessToken || null;
}

