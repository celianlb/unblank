import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { SupabaseShareRepository } from '@/infra/shares/SupabaseShareRepository';
import { ShareService } from '@/domain/shares/services/ShareService';

/**
 * Factory pour créer les instances de gestion des partages
 * Pattern: Dependency Injection + Factory
 *
 * Supporte deux modes:
 * 1. Client-side: utilise le singleton (getShareService)
 * 2. Server-side: crée des instances avec un client personnalisé (createShareService)
 */
class ShareFactory {
  private static shareRepository: SupabaseShareRepository | null = null;
  private static shareService: ShareService | null = null;

  /**
   * Récupère l'instance du repository (Singleton - pour client-side)
   */
  static getShareRepository(): SupabaseShareRepository {
    if (!this.shareRepository) {
      const supabaseClient = createClient();
      this.shareRepository = new SupabaseShareRepository(supabaseClient);
    }
    return this.shareRepository;
  }

  /**
   * Récupère l'instance du service (Singleton - pour client-side)
   */
  static getShareService(): ShareService {
    if (!this.shareService) {
      this.shareService = new ShareService(this.getShareRepository());
    }
    return this.shareService;
  }

  /**
   * Crée une nouvelle instance du service avec un client Supabase personnalisé
   * Utilisé côté serveur (API routes) avec le token de l'utilisateur
   */
  static createShareService(supabaseClient: SupabaseClient): ShareService {
    const repository = new SupabaseShareRepository(supabaseClient);
    return new ShareService(repository);
  }

  /**
   * Réinitialise les instances (utile pour les tests)
   */
  static reset(): void {
    this.shareRepository = null;
    this.shareService = null;
  }
}

export default ShareFactory;
