import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/infra/db/supabase';
import { SupabaseSearchRepository } from '@/infra/search/SupabaseSearchRepository';
import { SearchService } from '@/domain/search/services/SearchService';

/**
 * Factory pour créer les instances de gestion de la recherche
 * Pattern: Dependency Injection + Factory
 *
 * Supporte deux modes:
 * 1. Client-side: utilise le singleton (getSearchService)
 * 2. Server-side: crée des instances avec un client personnalisé (createSearchService)
 */
class SearchFactory {
  private static searchRepository: SupabaseSearchRepository | null = null;
  private static searchService: SearchService | null = null;

  /**
   * Récupère l'instance du repository (Singleton - pour client-side)
   */
  static getSearchRepository(): SupabaseSearchRepository {
    if (!this.searchRepository) {
      this.searchRepository = new SupabaseSearchRepository(supabase);
    }
    return this.searchRepository;
  }

  /**
   * Récupère l'instance du service (Singleton - pour client-side)
   */
  static getSearchService(): SearchService {
    if (!this.searchService) {
      this.searchService = new SearchService(this.getSearchRepository());
    }
    return this.searchService;
  }

  /**
   * Crée une nouvelle instance du service avec un client Supabase personnalisé
   * Utilisé côté serveur (API routes) avec le token de l'utilisateur
   */
  static createSearchService(supabaseClient: SupabaseClient): SearchService {
    const repository = new SupabaseSearchRepository(supabaseClient);
    return new SearchService(repository);
  }

  /**
   * Réinitialise les instances (utile pour les tests)
   */
  static reset(): void {
    this.searchRepository = null;
    this.searchService = null;
  }
}

export default SearchFactory;
