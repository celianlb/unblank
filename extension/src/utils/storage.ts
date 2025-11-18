import type { ExtensionStorage } from '@/types';

/**
 * Get data from Chrome storage
 */
export async function getStorageData<K extends keyof ExtensionStorage>(
  keys: K | K[]
): Promise<Pick<ExtensionStorage, K>> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys as string | string[], (result) => {
      resolve(result as Pick<ExtensionStorage, K>);
    });
  });
}

/**
 * Set data in Chrome storage
 */
export async function setStorageData(data: Partial<ExtensionStorage>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(data, () => {
      resolve();
    });
  });
}

/**
 * Remove data from Chrome storage
 */
export async function removeStorageData(keys: keyof ExtensionStorage | Array<keyof ExtensionStorage>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(keys as string | string[], () => {
      resolve();
    });
  });
}

/**
 * Clear all data from Chrome storage
 */
export async function clearStorage(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.clear(() => {
      resolve();
    });
  });
}
