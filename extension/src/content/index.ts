// Content script that runs on web pages
console.log('Unblank content script loaded');

// Listen for messages from background or popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('Message received in content script:', request);

  if (request.type === 'PING') {
    sendResponse({ success: true, message: 'Content script is active' });
  }

  return true;
});

// Export empty object to make this a module
export {};
