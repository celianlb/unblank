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

// Listen for messages from content scripts or popup
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
