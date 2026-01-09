import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Cache simple en mémoire (pour commencer)
const imageCache = new Map<string, { buffer: Buffer; contentType: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    const width = request.nextUrl.searchParams.get('w');
    const height = request.nextUrl.searchParams.get('h');
    const quality = request.nextUrl.searchParams.get('q');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
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

    // Clé de cache incluant les paramètres de redimensionnement
    const cacheKey = `${url}_${width || 'auto'}_${height || 'auto'}_${quality || '80'}`;

    // Vérifier le cache
    const cached = imageCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new NextResponse(new Uint8Array(cached.buffer), {
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch l'image
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UnblankBot/1.0)',
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Vérifier que c'est bien une image
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'URL does not point to an image' },
        { status: 400 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    let buffer: Buffer = Buffer.from(arrayBuffer);

    // Redimensionner l'image si nécessaire
    if (width || height || quality) {
      let sharpImage = sharp(buffer);

      // Récupérer les métadonnées pour préserver le format
      const metadata = await sharpImage.metadata();

      // Redimensionner
      if (width || height) {
        const resizeOptions: sharp.ResizeOptions = {
          width: width ? parseInt(width) : undefined,
          height: height ? parseInt(height) : undefined,
          fit: 'inside', // Maintient le ratio d'aspect
          withoutEnlargement: true, // Ne pas agrandir les petites images
        };
        sharpImage = sharpImage.resize(resizeOptions);
      }

      // Appliquer la qualité selon le format
      const imageQuality = quality ? parseInt(quality) : 80;
      if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        sharpImage = sharpImage.jpeg({ quality: imageQuality });
      } else if (metadata.format === 'png') {
        sharpImage = sharpImage.png({ quality: imageQuality });
      } else if (metadata.format === 'webp') {
        sharpImage = sharpImage.webp({ quality: imageQuality });
      }

      buffer = await sharpImage.toBuffer();
    }

    // Mettre en cache
    imageCache.set(cacheKey, {
      buffer,
      contentType,
      timestamp: Date.now(),
    });

    // Nettoyer le cache des anciennes entrées (simple)
    if (imageCache.size > 1000) {
      const entries = Array.from(imageCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, 500);
      toDelete.forEach(([key]) => imageCache.delete(key));
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-Cache': 'MISS',
      },
    });

  } catch (error) {
    console.error('Error proxying image:', error);
    return NextResponse.json(
      {
        error: 'Failed to proxy image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
