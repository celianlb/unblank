import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, handleApiError } from '@/lib/api/auth';
import AIFactory from '@/lib/ai/aiFactory';

/**
 * POST /api/links/[linkId]/generate-tags
 * Génère automatiquement des tags pour un lien via IA
 *
 * Body:
 * - replaceExisting?: boolean (défaut: false)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    // 1. Authentification
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return authResult.error;
    }

    const { user, supabase } = authResult.data;
    const { linkId } = await params;

    // 2. Parser le body
    const body = await request.json().catch(() => ({}));
    const { replaceExisting = false } = body;

    // 3. Récupérer le lien avec ses métadonnées
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('id, user_id, url, title, description, screenshot_url, original_image_url, content_type')
      .eq('id', linkId)
      .single();

    if (linkError || !link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    // 4. Vérifier les permissions (doit être le propriétaire)
    if (link.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have permission to generate tags for this link' },
        { status: 403 }
      );
    }

    // 5. Déterminer l'URL de l'image à analyser
    // Priorité : screenshot_url (géré par notre système) > original_image_url
    const screenshotUrl = link.screenshot_url;
    const originalImageUrl = link.original_image_url;

    if (!screenshotUrl && !originalImageUrl) {
      return NextResponse.json(
        { error: 'No image available for tag generation' },
        { status: 400 }
      );
    }

    // 6. Stratégie de sélection de l'URL :
    // - Si screenshot_url existe : l'utiliser directement (accessible publiquement)
    // - Sinon : essayer d'utiliser original_image_url via le proxy
    let imageUrl: string;

    if (screenshotUrl) {
      // Screenshot URL est géré par notre système, accessible directement
      imageUrl = screenshotUrl;
      console.log('[AI Tags] Using screenshot URL directly:', imageUrl);
    } else if (originalImageUrl) {
      // Pour les URLs externes, laisser OpenAI essayer directement
      // (plus fiable que le proxy pour certaines URLs protégées)
      imageUrl = originalImageUrl;
      console.log('[AI Tags] Using original image URL directly:', imageUrl);
    }

    // 7. Créer le use case et exécuter
    const generateAITagsUseCase = AIFactory.createGenerateAITagsUseCase(supabase);

    const result = await generateAITagsUseCase.execute({
      linkId: link.id,
      userId: user.id,
      imageUrl: imageUrl!,
      linkUrl: link.url,
      linkTitle: link.title || undefined,
      linkDescription: link.description || undefined,
      replaceExisting,
    });

    return NextResponse.json({
      success: true,
      tags: result.tags,
      created: result.created,
      existing: result.existing,
      linked: result.linked,
    });

  } catch (error) {
    console.error('[API] Error generating AI tags:', error);

    // Gestion d'erreurs spécifiques
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }

      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      if (error.message.includes('OPEN_API_KEY')) {
        return NextResponse.json(
          { error: 'AI service not configured' },
          { status: 503 }
        );
      }
    }

    return handleApiError(error, 'Generate AI Tags');
  }
}
