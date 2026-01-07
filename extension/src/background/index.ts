import { saveSession, clearSession } from '../utils/auth';
import type { AuthSession } from '../types';

// Background service worker for Chrome extension
console.log('Background service worker loaded');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);

  if (details.reason === 'install') {
    // First time installation
    console.log('First time installation');
  } else if (details.reason === 'update') {
    // Extension updated
    console.log('Extension updated');
  }
});

// Listen for extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked', tab);

  // Get the current tab ID
  const tabId = tab.id;

  if (!tabId) {
    console.error('No tab ID found');
    return;
  }

  // Skip chrome:// and other restricted URLs
  if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
    console.log('Cannot inject into restricted page:', tab.url);
    return;
  }

  try {
    // Try to send message to existing content script
    const response = await chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_OVERLAY' }).catch(() => null);

    if (response) {
      console.log('Toggle overlay response:', response);
    } else {
      // Content script not loaded, inject it manually
      console.log('Content script not found, injecting manually...');

      // Get the manifest to find the content script file
      const manifest = chrome.runtime.getManifest();
      const contentScripts = manifest.content_scripts?.[0];

      if (contentScripts?.js) {
        // Inject the content script
        await chrome.scripting.executeScript({
          target: { tabId },
          files: contentScripts.js as string[]
        });

        // Wait a bit for initialization
        await new Promise(resolve => setTimeout(resolve, 100));

        // Now toggle the overlay
        await chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_OVERLAY' });
        console.log('Content script injected and overlay toggled');
      }
    }
  } catch (error) {
    console.error('Error handling extension click:', error);
  }
});

// Listen for messages from content scripts and external sources (SaaS app)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in background:', request, 'from:', sender);

  // Handle different message types
  if (request.type === 'GET_DATA') {
    // Example: fetch data and send response
    sendResponse({ success: true, data: 'Background data' });
  } else if (request.type === 'AUTH_SESSION') {
    // Handle authentication session from SaaS app
    handleAuthSession(request.session as AuthSession)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Error handling auth session:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  } else if (request.type === 'AUTH_LOGOUT') {
    // Handle logout from SaaS app
    handleLogout()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Error handling logout:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  return true; // Keep message channel open for async response
});

// Listen for messages from external sources (SaaS app)
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('External message received:', request, 'from:', sender);

  if (request.type === 'AUTH_SESSION') {
    handleAuthSession(request.session as AuthSession)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Error handling auth session:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  return true;
});

/**
 * Handle authentication session from SaaS app
 */
async function handleAuthSession(session: AuthSession): Promise<void> {
  try {
    console.log('[Auth] Saving session');
    
    // Save session to storage
    await saveSession(session);
    
    // Notify all extension components that auth is successful
    chrome.runtime.sendMessage({ type: 'AUTH_SUCCESS', session }).catch(() => {
      // Ignore errors if no listeners
    });
    
    // Notify all tabs (content scripts) that auth is successful
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'AUTH_SUCCESS', session }).catch(() => {
            // Ignore errors if content script not loaded in this tab
          });
        }
      });
    });
    
    console.log('[Auth] Session saved successfully');
  } catch (error) {
    console.error('[Auth] Error saving session');
    throw error;
  }
}

/**
 * Handle logout from SaaS app
 */
async function handleLogout(): Promise<void> {
  try {
    console.log('[Auth] Clearing session');
    
    // Clear session from storage
    await clearSession();
    
    // Notify all extension components that user logged out
    chrome.runtime.sendMessage({ type: 'AUTH_LOGOUT' }).catch(() => {
      // Ignore errors if no listeners
    });
    
    // Notify all tabs (content scripts) that user logged out
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'AUTH_LOGOUT' }).catch(() => {
            // Ignore errors if content script not loaded in this tab
          });
        }
      });
    });
    
    console.log('[Auth] Session cleared successfully');
  } catch (error) {
    console.error('[Auth] Error clearing session');
    throw error;
  }
}

// Export empty object to make this a module
export {};
