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
  user_id: string;
  group_id?: string;
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
 * Get user folders
 */
export async function getFolders(): Promise<Folder[]> {
  try {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/folders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch folders');
    }

    const data = await response.json();
    return data.folders || [];
  } catch (error) {
    console.error('Error fetching folders:', error);
    return [];
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
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to create link');
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating link:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

