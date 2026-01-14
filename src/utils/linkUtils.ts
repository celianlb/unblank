import { Link } from '@/domain/links/models';

/**
 * Détermine le type de contenu d'un lien
 * Logique métier pure sans dépendances
 */
export function getContentType(link: Link): 'image' | 'video' | 'link' {
  // PRIORITÉ 1 : Vérifier le content_type explicite
  if (link.content_type === 'video') {
    return 'video';
  }

  if (link.content_type === 'image') {
    return 'image';
  }

  // PRIORITÉ 2 : Fallback - détecter les vidéos par URL (pour les anciens liens créés avant le support des vidéos)
  if (link.url) {
    const url = link.url.toLowerCase();
    if (
      url.includes('youtube.com') ||
      url.includes('youtu.be') ||
      url.includes('vimeo.com') ||
      url.includes('dailymotion.com')
    ) {
      return 'video';
    }
  }

  // PRIORITÉ 3 : Si le content_type commence par 'image/' (MIME type), c'est une image
  if (link.content_type && link.content_type.startsWith('image/')) {
    return 'image';
  }

  // PRIORITÉ 4 : Si on a un format d'image ET que l'URL elle-même est une image directe
  // (pour les anciens liens avec format mais sans content_type explicite)
  if (link.image_format && link.url) {
    const url = link.url.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) {
      return 'image';
    }
  }

  // Par défaut : c'est un lien classique (peut avoir une og:image comme thumbnail)
  return 'link';
}

/**
 * Extrait les informations de plateforme vidéo depuis une URL
 */
export function getVideoPlatformInfo(url: string): {
  platformName: string;
  platformUrl: string;
} {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return {
        platformName: 'YouTube',
        platformUrl: 'youtube.com',
      };
    }

    if (hostname.includes('vimeo.com')) {
      return {
        platformName: 'Vimeo',
        platformUrl: 'vimeo.com',
      };
    }

    if (hostname.includes('dailymotion.com')) {
      return {
        platformName: 'Dailymotion',
        platformUrl: 'dailymotion.com',
      };
    }

    // Fallback pour les autres plateformes vidéo
    return {
      platformName: urlObj.hostname.replace('www.', ''),
      platformUrl: urlObj.hostname,
    };
  } catch (error) {
    return {
      platformName: 'Vidéo',
      platformUrl: 'unknown',
    };
  }
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
