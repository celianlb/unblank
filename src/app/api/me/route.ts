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

    // 2. Récupérer les informations de l'utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, username, avatar_url, created_at')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('[API /me] Error fetching user:', userError);
    }

    // 3. Récupérer l'abonnement actif
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (subError) {
      console.error('[API /me] Error fetching subscription:', subError);
    }

    const activeSubscription = subscriptions?.[0] || null;

    // 4. Déterminer le plan type (free par défaut)
    let planType: 'free' | 'pro' | 'team' = 'free';
    if (activeSubscription) {
      if (activeSubscription.plan_type === 'pro') {
        planType = 'pro';
      } else if (activeSubscription.plan_type === 'team') {
        planType = 'team';
      }
    }

    // 5. Récupérer le nombre de liens créés ce mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: linksThisMonth, error: linksError } = await supabase
      .from('links')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    if (linksError) {
      console.error('[API /me] Error counting links:', linksError);
    }

    // 6. Déterminer les features selon le plan
    const features = {
      free: {
        monthlyLinksLimit: 50,
        canUseAITags: false,
        canCreateGroups: false,
        canShareWithEdit: false,
        maxShareMembers: 2,
      },
      pro: {
        monthlyLinksLimit: -1, // unlimited
        canUseAITags: true,
        canCreateGroups: true,
        canShareWithEdit: true,
        maxShareMembers: 4,
      },
      team: {
        monthlyLinksLimit: -1, // unlimited
        canUseAITags: true,
        canCreateGroups: true,
        canShareWithEdit: true,
        maxShareMembers: -1, // unlimited
        hasUnlimitedCollaboration: true,
      },
    };

    // 7. Construire la réponse
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
        status: activeSubscription?.status || 'inactive',
        features: features[planType],
        currentPeriodEnd: activeSubscription?.current_period_end || null,
        cancelAtPeriodEnd: activeSubscription?.cancel_at_period_end || false,
      },
      usage: {
        linksThisMonth: linksThisMonth || 0,
        linksLimit: features[planType].monthlyLinksLimit,
        linksRemaining:
          features[planType].monthlyLinksLimit === -1
            ? -1
            : Math.max(0, features[planType].monthlyLinksLimit - (linksThisMonth || 0)),
      },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch user profile');
  }
}
