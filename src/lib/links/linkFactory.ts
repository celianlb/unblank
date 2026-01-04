import { SupabaseClient, createClient as createSupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/infra/db/supabase';
import { SupabaseLinkRepository } from '@/infra/links/SupabaseLinkRepository';
import { LinkService } from '@/domain/links/services/LinkService';
import TagFactory from '@/lib/tags/tagFactory';

/**
 * Factory pour créer les instances de gestion des liens
 * Pattern: Dependency Injection + Factory
 *
 * Supporte deux modes:
 * 1. Client-side: utilise le singleton (getLinkService)
 * 2. Server-side: crée des instances avec un client personnalisé (createLinkService)
 */
class LinkFactory {
  private static linkRepository: SupabaseLinkRepository | null = null;
  private static linkService: LinkService | null = null;

  /**
   * Récupère l'instance du repository (Singleton - pour client-side)
   */
  static getLinkRepository(): SupabaseLinkRepository {
    if (!this.linkRepository) {
      const tagService = TagFactory.getTagService();
      this.linkRepository = new SupabaseLinkRepository(supabase, tagService);
    }
    return this.linkRepository;
  }

  /**
   * Récupère l'instance du service (Singleton - pour client-side)
   */
  static getLinkService(): LinkService {
    if (!this.linkService) {
      this.linkService = new LinkService(this.getLinkRepository());
    }
    return this.linkService;
  }

  /**
   * Crée une nouvelle instance du service avec un client Supabase personnalisé
   * Utilisé côté serveur (API routes) avec le token de l'utilisateur
   */
  static createLinkService(supabaseClient: SupabaseClient): LinkService {
    const tagService = TagFactory.createTagService(supabaseClient);
    const repository = new SupabaseLinkRepository(supabaseClient, tagService);
    return new LinkService(repository);
  }

  /**
   * Réinitialise les instances (utile pour les tests)
   */
  static reset(): void {
    this.linkRepository = null;
    this.linkService = null;
  }
}

export default LinkFactory;
