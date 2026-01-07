import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/infra/db/supabase';
import { SupabaseTagRepository } from '@/infra/tags/SupabaseTagRepository';
import { TagService } from '@/domain/tags/services/TagService';

/**
 * Factory pour créer les instances de gestion des tags
 * Pattern: Dependency Injection + Factory
 *
 * Supporte deux modes:
 * 1. Client-side: utilise le singleton (getTagService)
 * 2. Server-side: crée des instances avec un client personnalisé (createTagService)
 */
class TagFactory {
  private static tagRepository: SupabaseTagRepository | null = null;
  private static tagService: TagService | null = null;

  /**
   * Récupère l'instance du repository (Singleton - pour client-side)
   */
  static getTagRepository(): SupabaseTagRepository {
    if (!this.tagRepository) {
      this.tagRepository = new SupabaseTagRepository(supabase);
    }
    return this.tagRepository;
  }

  /**
   * Récupère l'instance du service (Singleton - pour client-side)
   */
  static getTagService(): TagService {
    if (!this.tagService) {
      this.tagService = new TagService(this.getTagRepository());
    }
    return this.tagService;
  }

  /**
   * Crée une nouvelle instance du service avec un client Supabase personnalisé
   * Utilisé côté serveur (API routes) avec le token de l'utilisateur
   */
  static createTagService(supabaseClient: SupabaseClient): TagService {
    const repository = new SupabaseTagRepository(supabaseClient);
    return new TagService(repository);
  }

  /**
   * Réinitialise les instances (utile pour les tests)
   */
  static reset(): void {
    this.tagRepository = null;
    this.tagService = null;
  }
}

export default TagFactory;
