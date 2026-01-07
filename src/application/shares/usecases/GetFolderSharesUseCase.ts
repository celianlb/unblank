import { SupabaseClient } from '@supabase/supabase-js';
import { ShareService } from '@/domain/shares/services/ShareService';
import { ShareWithUser } from '@/domain/shares/models/Share';

/**
 * Use Case: Récupérer tous les shares d'un dossier
 *
 * Vérifie d'abord que l'utilisateur a accès au dossier,
 * puis récupère tous les shares en utilisant des permissions admin.
 */
export class GetFolderSharesUseCase {
  constructor(
    private readonly userSupabase: SupabaseClient,
    private readonly adminSupabase: SupabaseClient,
    private readonly shareService: ShareService
  ) {}

  async execute(folderId: string): Promise<ShareWithUser[]> {
    // 1. Vérifier que l'utilisateur a accès au dossier (avec RLS)
    const { data: folder, error } = await this.userSupabase
      .from('folders')
      .select('id')
      .eq('id', folderId)
      .single();

    if (error || !folder) {
      throw new Error('Folder not found or access denied');
    }

    // 2. Récupérer tous les shares avec les permissions admin
    return this.shareService.getFolderShares(folderId);
  }
}
