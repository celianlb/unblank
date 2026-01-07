import { Link } from '@/domain/links/models';

/**
 * Détermine le type de contenu d'un lien
 * Logique métier pure sans dépendances
 */
export function getContentType(link: Link): 'image' | 'link' {
  // Si on a une image originale ou un format d'image, c'est une image
  if (link.original_image_url || link.image_format) {
    return 'image';
  }

  // Si le content_type commence par 'image/', c'est une image
  if (link.content_type && link.content_type.startsWith('image/')) {
    return 'image';
  }

  // Sinon c'est un lien classique
  return 'link';
}

/**
 * Extrait les métadonnées d'une URL via l'API
 */
export async function extractMetadata(url: string): Promise<{
  url: string;
  title: string;
  description: string;
  image: string | null;
  contentType: 'image' | 'video' | 'link';
  imageFormat?: string;
} | null> {
  try {
    const response = await fetch('/api/extract-metadata', {
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
