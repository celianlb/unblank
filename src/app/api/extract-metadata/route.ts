import { NextRequest, NextResponse } from 'next/server';

// Simple metadata extraction without external dependencies
function extractMetadata(html: string, url: string): { title: string; description: string; image: string | null } {
  // Extract title
  let title = '';
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const twitterTitleMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i);
  const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

  title = ogTitleMatch?.[1] || twitterTitleMatch?.[1] || titleTagMatch?.[1] || '';

  // Extract description
  let description = '';
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const twitterDescMatch = html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i);
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);

  description = ogDescMatch?.[1] || twitterDescMatch?.[1] || metaDescMatch?.[1] || '';

  // Extract image
  let image: string | null = null;
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);

  image = ogImageMatch?.[1] || twitterImageMatch?.[1] || null;

  // Handle relative image URLs
  if (image && !image.startsWith('http')) {
    try {
      const baseUrl = new URL(url);
      image = new URL(image, baseUrl.origin).href;
    } catch {
      image = null;
    }
  }

  return { title, description, image };
}

// Fonction pour détecter le type de contenu
function detectContentType(url: string): 'image' | 'video' | 'link' {
  // Images directes
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) {
    return 'image';
  }

  // Pinterest
  if (url.includes('pinterest.com') || url.includes('pin.it')) {
    return 'image';
  }

  // Vidéos
  if (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('vimeo.com') ||
    url.includes('dailymotion.com')
  ) {
    return 'video';
  }

  // Par défaut
  return 'link';
}

// Fonction pour extraire le format d'image
function extractImageFormat(url: string): string | undefined {
  const match = url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i);
  if (match) {
    const format = match[1].toUpperCase();
    return format === 'JPEG' ? 'JPG' : format;
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Valider l'URL
    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Détecter le type de contenu
    const contentType = detectContentType(url);

    // Si c'est une image directe, pas besoin de scraper
    if (contentType === 'image' && /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url)) {
      const imageFormat = extractImageFormat(url);
      const fileName = validUrl.pathname.split('/').pop() || 'image';

      return NextResponse.json({
        url,
        title: fileName,
        description: '',
        image: url,
        contentType: 'image',
        imageFormat,
      });
    }

    // Pour les autres types, scraper la page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UnblankBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const metadata = extractMetadata(html, url);

    // Extraire le format d'image si présent
    let imageFormat: string | undefined;
    if (metadata.image) {
      imageFormat = extractImageFormat(metadata.image);
    }

    return NextResponse.json({
      url: url,
      title: metadata.title || validUrl.hostname,
      description: metadata.description || '',
      image: metadata.image || null,
      contentType,
      imageFormat,
    });

  } catch (error) {
    console.error('Error extracting metadata:', error);
    return NextResponse.json(
      {
        error: 'Failed to extract metadata',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
