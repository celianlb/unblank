/**
 * Helper pour authentifier les requêtes API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

export interface AuthenticatedRequest {
  user: User;
  supabase: SupabaseClient;
}

/**
 * Authentifie la requête et retourne l'utilisateur + le client Supabase
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ success: true; data: AuthenticatedRequest } | { success: false; error: NextResponse }> {
  const authHeader = request.headers.get('Authorization');
  const accessToken = authHeader?.replace('Bearer ', '');

  if (!accessToken) {
    return {
      success: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return {
    success: true,
    data: { user, supabase },
  };
}

/**
 * Gère les erreurs de manière centralisée
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  console.error(`[API] ${context}:`, error);

  const message = error instanceof Error ? error.message : 'Unknown error';

  return NextResponse.json(
    { error: 'Internal server error', details: message },
    { status: 500 }
  );
}
