import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SubscriptionFactory } from '@/infra/subscription/SubscriptionFactory';
import { handleApiError } from '@/lib/api/auth';

/**
 * API Route: POST /api/stripe/webhook
 * Reçoit et traite les webhooks Stripe
 * Note: Pas d'authentification utilisateur car appelé par Stripe
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Récupérer le body brut (important pour la vérification de signature)
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    // 2. Créer un client Supabase admin pour mettre à jour les users
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Clé service role pour bypasser RLS
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 3. Créer le use case via la Factory (Clean Architecture)
    const handleWebhookUseCase = SubscriptionFactory.createHandleWebhookUseCase(supabase);

    // 4. Traiter le webhook
    await handleWebhookUseCase.execute(body, signature);

    return NextResponse.json({ received: true });
  } catch (error) {
    return handleApiError(error, 'stripe/webhook');
  }
}
