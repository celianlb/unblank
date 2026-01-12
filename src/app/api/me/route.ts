import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, handleApiError } from '@/lib/api/auth';

/**
 * GET /api/me
 * Récupère les informations de l'utilisateur connecté incluant son abonnement
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentification
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return authResult.error;
    }

    const { user, supabase } = authResult.data;

    // 2. Récupérer les informations de l'utilisateur avec son plan d'abonnement
    // Note: email est dans auth.users (disponible via user.email), pas dans public.users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, avatar_url, created_at, subscription_plan, subscription_status, subscription_expires_at, monthly_links_used, monthly_links_limit, trial_ends_at, is_beta_user, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('[API /me] Error fetching user:', userError);
    }

    console.log('[API /me] User data:', JSON.stringify(userData, null, 2));

    // 3. Déterminer le plan type depuis la table users (pas subscriptions)
    // IMPORTANT: Le plan est uniquement accordé si subscription_status === 'active'
    let planType: 'free' | 'pro' = 'free';
    const isActive = userData?.subscription_status === 'active';

    if (userData?.subscription_plan && isActive) {
      const subscriptionPlan = userData.subscription_plan;
      console.log('[API /me] Detected ACTIVE subscription plan from users table:', subscriptionPlan);
      if (subscriptionPlan === 'pro') {
        planType = 'pro';
      }
    } else if (userData?.subscription_plan && !isActive) {
      console.log('[API /me] User has plan', userData.subscription_plan, 'but status is', userData.subscription_status, '→ treating as free');
    }
    console.log('[API /me] Final planType:', planType);

    // 5. Utiliser les données d'usage de la DB (plus fiable que de compter à chaque fois)
    const linksThisMonth = userData?.monthly_links_used || 0;
    const dbLinksLimit = userData?.monthly_links_limit || 50;

    // 6. Déterminer les features selon le plan
    const features = {
      free: {
        monthlyLinksLimit: 50,
        canUseAITags: false,
        canCreateGroups: false,
        canShareWithEdit: false,
        maxShareMembers: 15,
      },
      pro: {
        monthlyLinksLimit: -1, // unlimited
        canUseAITags: true,
        canCreateGroups: true,
        canShareWithEdit: true,
        maxShareMembers: 30,
      },
    };

    // 7. Calculer les informations du trial bêta
    const isBetaUser = userData?.is_beta_user ?? false;
    const trialEndsAt = userData?.trial_ends_at ? new Date(userData.trial_ends_at) : null;
    const hasStripeSubscription = !!userData?.stripe_subscription_id;

    // L'utilisateur est en trial si: bêta user + plan Pro + pas d'abonnement Stripe + trial non expiré
    const isOnBetaTrial = isBetaUser &&
      planType === 'pro' &&
      !hasStripeSubscription &&
      trialEndsAt &&
      new Date() < trialEndsAt;

    // Calculer les jours restants du trial
    const trialDaysRemaining = trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    // 8. Construire la réponse
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: userData?.username || null,
        avatarUrl: userData?.avatar_url || null,
        createdAt: userData?.created_at || null,
      },
      subscription: {
        planType,
        status: userData?.subscription_status || 'active',
        features: features[planType],
        currentPeriodEnd: userData?.subscription_expires_at || null,
        cancelAtPeriodEnd: false,
      },
      // Informations du trial bêta
      betaTrial: {
        isOnTrial: isOnBetaTrial,
        isBetaUser,
        trialEndsAt: trialEndsAt?.toISOString() || null,
        daysRemaining: isOnBetaTrial ? trialDaysRemaining : 0,
      },
      usage: {
        linksThisMonth: linksThisMonth,
        // Pour free, utiliser la limite de la DB (peut être personnalisée)
        // Pour pro, utiliser -1 (illimité)
        linksLimit: planType === 'free' ? dbLinksLimit : features[planType].monthlyLinksLimit,
        linksRemaining:
          planType === 'free'
            ? Math.max(0, dbLinksLimit - linksThisMonth)
            : -1, // Illimité pour pro
      },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch user profile');
  }
}
