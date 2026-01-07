import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ShareFactory from '@/lib/shares/shareFactory';
import { GetFolderSharesUseCase } from '@/application/shares/usecases/GetFolderSharesUseCase';
import { handleApiError, authenticateRequest } from '@/lib/api/auth';

/**
 * API Route: GET /api/shares?folderId=xxx
 * Récupère tous les shares (membres) d'un dossier
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentifier la requête
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return authResult.error;
    }

    const { supabase: userSupabase } = authResult.data;

    // 2. Valider les paramètres
    const folderId = request.nextUrl.searchParams.get('folderId');
    if (!folderId) {
      return NextResponse.json({ error: 'folderId is required' }, { status: 400 });
    }

    // 3. Créer le client admin pour bypasser RLS
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 4. Créer le service et le use case
    const shareService = ShareFactory.createShareService(adminSupabase);
    const useCase = new GetFolderSharesUseCase(userSupabase, adminSupabase, shareService);

    // 5. Exécuter le use case
    const shares = await useCase.execute(folderId);

    return NextResponse.json(shares);
  } catch (error) {
    return handleApiError(error, 'shares');
  }
}
