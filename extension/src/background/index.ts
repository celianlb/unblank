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

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('Message received in background:', request);

  // Handle different message types
  if (request.type === 'GET_DATA') {
    // Example: fetch data and send response
    sendResponse({ success: true, data: 'Background data' });
  }

  return true; // Keep message channel open for async response
});

// Export empty object to make this a module
export {};
