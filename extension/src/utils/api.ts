import { getAccessToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Metadata {
  url: string;
  title: string;
  description: string;
  image: string | null;
  contentType: 'image' | 'video' | 'link';
  imageFormat?: string;
}

export interface Folder {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  parent_folder_id: string | null;
  is_group: boolean;
  is_system: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  link_count?: number;
}

/**
 * Extract metadata from a URL
 */
export async function extractMetadata(url: string): Promise<Metadata | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/extract-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error('Failed to extract metadata');
    }

    return await response.json();
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return null;
  }
}

/**
 * Get user folders and groups (aligned with SaaS implementation)
 */
export async function getFolders(): Promise<{ folders: Folder[]; groups: Folder[]; all: Folder[] }> {
  try {
    console.log('[API] Getting access token...');
    const token = await getAccessToken();
    console.log('[API] Token retrieved:', token ? 'YES' : 'NO');

    if (!token) {
      throw new Error('Not authenticated');
    }

    const url = `${API_BASE_URL}/api/folders`;
    console.log('[API] Fetching folders from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[API] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[API] Error response:', errorData);
      throw new Error(errorData.error || 'Failed to fetch folders');
    }

    const data = await response.json();
    console.log('[API] Folders data:', data);
    return {
      folders: data.folders || [],
      groups: data.groups || [],
      all: data.all || []
    };
  } catch (error) {
    console.error('[API] Error fetching folders:', error);
    throw error; // Propagate error instead of silently returning empty array
  }
}

/**
 * Create a link
 */
export async function createLink(data: {
  url: string;
  title?: string;
  description?: string;
  folderId?: string;
  originalImageUrl?: string;
  imageFormat?: string;
  contentType?: string;
  tags?: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[API] Creating link with data:', data);
    console.log('[API] Getting access token...');
    const token = await getAccessToken();
    console.log('[API] Token retrieved:', token ? 'YES' : 'NO');

    if (!token) {
      throw new Error('Not authenticated');
    }

    const url = `${API_BASE_URL}/api/links`;
    console.log('[API] Posting to:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('[API] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[API] Error response:', errorData);
      throw new Error(errorData.error || 'Failed to create link');
    }

    const result = await response.json();
    console.log('[API] Link created successfully:', result);
    return { success: true };
  } catch (error) {
    console.error('[API] Error creating link:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

