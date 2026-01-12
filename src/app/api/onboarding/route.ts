import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, handleApiError } from '@/lib/api/auth';

// Types pour validation
type UsageType = 'personal' | 'professional' | 'mixed';
type Domain = 'graphisme' | 'motion_design' | 'photographie' | 'illustration' | 'design_produit' | 'architecture' | 'etudiant' | 'autre';
type DiscoverySource = 'twitter' | 'instagram' | 'tiktok' | 'linkedin' | 'bouche_a_oreille' | 'google' | 'autre';

const VALID_USAGE_TYPES: UsageType[] = ['personal', 'professional', 'mixed'];
const VALID_DOMAINS: Domain[] = ['graphisme', 'motion_design', 'photographie', 'illustration', 'design_produit', 'architecture', 'etudiant', 'autre'];
const VALID_DISCOVERY_SOURCES: DiscoverySource[] = ['twitter', 'instagram', 'tiktok', 'linkedin', 'bouche_a_oreille', 'google', 'autre'];

interface OnboardingPayload {
  usageType: UsageType;
  domains: Domain[];
  discoverySource: DiscoverySource;
}

function validatePayload(payload: unknown): payload is OnboardingPayload {
  if (!payload || typeof payload !== 'object') return false;

  const p = payload as Record<string, unknown>;

  // Valider usageType
  if (!p.usageType || !VALID_USAGE_TYPES.includes(p.usageType as UsageType)) {
    return false;
  }

  // Valider domains (array non vide)
  if (!Array.isArray(p.domains) || p.domains.length === 0) {
    return false;
  }
  if (!p.domains.every((d: unknown) => VALID_DOMAINS.includes(d as Domain))) {
    return false;
  }

  // Valider discoverySource
  if (!p.discoverySource || !VALID_DISCOVERY_SOURCES.includes(p.discoverySource as DiscoverySource)) {
    return false;
  }

  return true;
}

/**
 * POST /api/onboarding
 * Sauvegarde les réponses d'onboarding de l'utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentification
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return authResult.error;
    }

    const { user, supabase } = authResult.data;

    // 2. Parser et valider le payload
    const payload = await request.json();

    if (!validatePayload(payload)) {
      return NextResponse.json(
        { error: 'Données invalides. Veuillez vérifier vos réponses.' },
        { status: 400 }
      );
    }

    // 3. Vérifier que l'onboarding n'est pas déjà complété
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    if (checkError) {
      console.error('[API /onboarding] Error checking user:', checkError);
      return NextResponse.json(
        { error: 'Erreur lors de la vérification de l\'utilisateur' },
        { status: 500 }
      );
    }

    if (existingUser?.onboarding_completed) {
      // Onboarding déjà complété, retourner succès quand même
      return NextResponse.json({
        success: true,
        message: 'Onboarding déjà complété',
      });
    }

    // 4. Mettre à jour l'utilisateur avec les données d'onboarding
    const { error: updateError } = await supabase
      .from('users')
      .update({
        onboarding_completed: true,
        usage_type: payload.usageType,
        domain: payload.domains,
        discovery_source: payload.discoverySource,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[API /onboarding] Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde' },
        { status: 500 }
      );
    }

    console.log('[API /onboarding] Successfully saved onboarding for user:', user.id);

    return NextResponse.json({
      success: true,
      message: 'Onboarding complété avec succès',
    });

  } catch (error) {
    return handleApiError(error, 'Failed to save onboarding');
  }
}
