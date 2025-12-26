import { SupabaseClient, createClient as createSupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/infra/db/supabase';
import { SupabaseFolderRepository } from '@/infra/folders/SupabaseFolderRepository';
import { FolderService } from '@/domain/folders/services/FolderService';

/**
 * Factory pour créer les instances de gestion des dossiers
 * Pattern: Dependency Injection + Factory
 *
 * Supporte deux modes:
 * 1. Client-side: utilise le singleton (getFolderService)
 * 2. Server-side: crée des instances avec un client personnalisé (createFolderService)
 */
class FolderFactory {
  private static folderRepository: SupabaseFolderRepository | null = null;
  private static folderService: FolderService | null = null;

  /**
   * Récupère l'instance du repository (Singleton - pour client-side)
   */
  static getFolderRepository(): SupabaseFolderRepository {
    if (!this.folderRepository) {
      this.folderRepository = new SupabaseFolderRepository(supabase);
    }
    return this.folderRepository;
  }

  /**
   * Récupère l'instance du service (Singleton - pour client-side)
   */
  static getFolderService(): FolderService {
    if (!this.folderService) {
      this.folderService = new FolderService(this.getFolderRepository());
    }
    return this.folderService;
  }

  /**
   * Crée une nouvelle instance du service avec un client Supabase personnalisé
   * Utilisé côté serveur (API routes) avec le token de l'utilisateur
   */
  static createFolderService(supabaseClient: SupabaseClient): FolderService {
    const repository = new SupabaseFolderRepository(supabaseClient);
    return new FolderService(repository);
  }

  /**
   * Réinitialise les instances (utile pour les tests)
   */
  static reset(): void {
    this.folderRepository = null;
    this.folderService = null;
  }
}

export default FolderFactory;
