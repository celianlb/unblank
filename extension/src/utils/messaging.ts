import type { Message } from '@/types';

/**
 * Send a message to the background script
 */
export async function sendToBackground<T = any>(message: Message): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Send a message to a specific tab
 */
export async function sendToTab<T = any>(tabId: number, message: Message): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Send a message to the active tab
 */
export async function sendToActiveTab<T = any>(message: Message): Promise<T> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) {
    throw new Error('No active tab found');
  }
  return sendToTab<T>(tab.id, message);
}
