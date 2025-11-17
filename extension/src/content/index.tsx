// Content script that runs on web pages and injects React overlay
import React from 'react';
import { createRoot } from 'react-dom/client';
import OverlayApp from './OverlayApp';

console.log('[UNBLANK] Content script loaded on', window.location.href);
console.log('[UNBLANK] Ready to receive messages');

// Load Heebo font from Google Fonts
const loadHeeboFont = () => {
  if (!document.getElementById('unblank-heebo-font')) {
    const link = document.createElement('link');
    link.id = 'unblank-heebo-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Heebo:wght@600&display=swap';
    document.head.appendChild(link);
  }
};

// Load font on script initialization
loadHeeboFont();

// Track overlay state
let overlayRoot: ReturnType<typeof createRoot> | null = null;
let overlayContainer: HTMLDivElement | null = null;
let isOverlayVisible = false;

// Apply styles to overlay container
function applyOverlayStyles(container: HTMLDivElement) {
  // Use Object.assign to apply styles as properties (more resistant to CSS overrides)
  Object.assign(container.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    width: '100%',
    height: '100%',
    zIndex: '2147483647',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
    margin: '0',
    padding: '16px',
    boxSizing: 'border-box',
    pointerEvents: 'none', // Allow clicks to pass through the container
  });
}

// Create and show the overlay
function showOverlay() {
  if (overlayContainer) {
    // Overlay already exists, re-apply styles and show it
    applyOverlayStyles(overlayContainer);
    overlayContainer.style.display = 'flex';
    isOverlayVisible = true;
    console.log('Overlay re-shown');
    return;
  }

  // Create the overlay container
  overlayContainer = document.createElement('div');
  overlayContainer.id = 'unblank-extension-overlay';

  // Apply styles
  applyOverlayStyles(overlayContainer);

  // Add to page
  document.body.appendChild(overlayContainer);

  // Create React root and render the overlay app
  overlayRoot = createRoot(overlayContainer);
  overlayRoot.render(
    <React.StrictMode>
      <OverlayApp onClose={hideOverlay} />
    </React.StrictMode>
  );

  isOverlayVisible = true;
  console.log('Overlay shown');
}

// Hide the overlay
function hideOverlay() {
  if (overlayContainer) {
    overlayContainer.style.display = 'none';
    isOverlayVisible = false;
    console.log('Overlay hidden');
  }
}

// Toggle the overlay
function toggleOverlay() {
  if (isOverlayVisible) {
    hideOverlay();
  } else {
    showOverlay();
  }
}

// Remove the overlay completely
function removeOverlay() {
  if (overlayRoot) {
    overlayRoot.unmount();
    overlayRoot = null;
  }
  if (overlayContainer) {
    overlayContainer.remove();
    overlayContainer = null;
  }
  isOverlayVisible = false;
  console.log('Overlay removed');
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('Message received in content script:', request);

  if (request.type === 'SHOW_OVERLAY') {
    showOverlay();
    sendResponse({ success: true, message: 'Overlay shown' });
  } else if (request.type === 'HIDE_OVERLAY') {
    hideOverlay();
    sendResponse({ success: true, message: 'Overlay hidden' });
  } else if (request.type === 'TOGGLE_OVERLAY') {
    toggleOverlay();
    sendResponse({ success: true, message: 'Overlay toggled' });
  } else if (request.type === 'REMOVE_OVERLAY') {
    removeOverlay();
    sendResponse({ success: true, message: 'Overlay removed' });
  } else if (request.type === 'PING') {
    sendResponse({ success: true, message: 'Content script is active' });
  }

  return true;
});

// Export empty object to make this a module
export {};
