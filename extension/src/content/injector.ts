/**
 * Content script injector for SaaS pages
 * This script makes the extension ID available to the page via postMessage
 */

// Only run on localhost:3000 and unblank.app domains
const currentUrl = window.location.href;
const isUnblankDomain = 
  currentUrl.includes('localhost:3000') || 
  currentUrl.includes('unblank.app');

if (isUnblankDomain) {
  const extensionId = chrome.runtime.id;
  
  console.log('[Unblank Extension] Injector loaded, extension ID:', extensionId);
  
  // Listen for requests from the page for the extension ID
  window.addEventListener('message', (event) => {
    // Only accept messages from same origin
    if (event.origin !== window.location.origin) return;
    
    if (event.data.type === 'GET_EXTENSION_ID') {
      console.log('[Unblank Extension] Extension ID requested');
      window.postMessage({
        type: 'EXTENSION_ID_RESPONSE',
        extensionId: extensionId
      }, '*');
    }
  });
  
  // Also listen for auth session messages to forward to background
  window.addEventListener('message', (event) => {
    // Only accept messages from same origin
    if (event.origin !== window.location.origin) return;
    
    if (event.data.type === 'AUTH_SESSION') {
      console.log('[Unblank Extension] Forwarding auth session to background');
      chrome.runtime.sendMessage({
        type: 'AUTH_SESSION',
        session: event.data.session
      }).then(() => {
        console.log('[Unblank Extension] Auth session forwarded successfully');
      }).catch((error) => {
        console.error('[Unblank Extension] Error forwarding auth session');
      });
    }
    
    if (event.data.type === 'AUTH_LOGOUT') {
      console.log('[Unblank Extension] Forwarding logout to background');
      chrome.runtime.sendMessage({
        type: 'AUTH_LOGOUT'
      }).then(() => {
        console.log('[Unblank Extension] Logout forwarded successfully');
      }).catch((error) => {
        console.error('[Unblank Extension] Error forwarding logout');
      });
    }
  });
  
  // Send initial message to let page know extension is ready
  window.postMessage({
    type: 'UNBLANK_EXTENSION_READY',
    extensionId: extensionId
  }, '*');
}

export {};

