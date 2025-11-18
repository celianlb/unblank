'use client';

/**
 * Bridge for communication between the SaaS app and Chrome extension
 */

interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  email: string;
}

let cachedExtensionId: string | null = null;

/**
 * Check if the page was opened from the extension
 */
export function isFromExtension(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('ext') === 'true';
}

/**
 * Get the extension ID via postMessage
 */
async function getExtensionId(): Promise<string | null> {
  // Return cached ID if available
  if (cachedExtensionId) {
    return cachedExtensionId;
  }

  // Try to get from environment variable
  const envExtensionId = process.env.NEXT_PUBLIC_EXTENSION_ID;
  if (envExtensionId) {
    cachedExtensionId = envExtensionId;
    return envExtensionId;
  }

  // Wait for extension to announce itself or request it
  return new Promise<string | null>((resolve) => {
    let resolved = false;

    const messageHandler = (event: MessageEvent) => {
      if (resolved) return;

      // Check for extension ready message or response
      if (event.data.type === 'UNBLANK_EXTENSION_READY' || 
          event.data.type === 'EXTENSION_ID_RESPONSE') {
        if (event.data.extensionId) {
          cachedExtensionId = event.data.extensionId;
          resolved = true;
          window.removeEventListener('message', messageHandler);
          console.log('[Extension Bridge] Extension ID received:', event.data.extensionId);
          resolve(event.data.extensionId);
        }
      }
    };

    window.addEventListener('message', messageHandler);

    // Request extension ID
    window.postMessage({ type: 'GET_EXTENSION_ID' }, '*');

    // Timeout after 2 seconds
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.removeEventListener('message', messageHandler);
        console.warn('[Extension Bridge] Extension ID request timed out');
        resolve(null);
      }
    }, 2000);
  });
}

/**
 * Send auth session to the extension
 */
export async function sendSessionToExtension(session: AuthSession): Promise<void> {
  if (typeof window === 'undefined') {
    console.log('[Extension Bridge] Not in browser context');
    return;
  }

  try {
    console.log('[Extension Bridge] Getting extension ID...');
    const extensionId = await getExtensionId();
    
    if (!extensionId) {
      console.error('[Extension Bridge] Extension ID not found - extension may not be installed or loaded');
      return;
    }

    console.log('[Extension Bridge] Sending auth session via postMessage');
    
    // Send via postMessage to content script which will forward to background
    window.postMessage({
      type: 'AUTH_SESSION',
      session,
    }, '*');

    console.log('[Extension Bridge] Session sent to extension');

    // Close the tab after a short delay
    setTimeout(() => {
      console.log('[Extension Bridge] Closing tab...');
      window.close();
    }, 1000);
  } catch (error) {
    console.error('[Extension Bridge] Error sending session to extension:', error);
  }
}

/**
 * Send logout signal to extension
 */
export async function sendLogoutToExtension(): Promise<void> {
  if (typeof window === 'undefined') {
    console.log('[Extension Bridge] Not in browser context');
    return;
  }

  try {
    console.log('[Extension Bridge] Sending logout signal...');
    
    // Send via postMessage to content script
    window.postMessage({
      type: 'AUTH_LOGOUT',
    }, '*');
    
    console.log('[Extension Bridge] Logout signal sent');
  } catch (error) {
    console.error('[Extension Bridge] Error sending logout:', error);
  }
}

/**
 * Check if user is already authenticated when coming from extension
 */
export function shouldAutoCloseForExtension(isAuthenticated: boolean): boolean {
  return isFromExtension() && isAuthenticated;
}

