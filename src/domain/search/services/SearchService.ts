import { SearchRepository } from '../ports/SearchRepository';
import { SearchParams, SearchResult, TagWithCount } from '../models/SearchResult';

/**
 * Service du domaine pour les opérations de recherche
 * Contient la logique métier et valide les paramètres
 */
export class SearchService {
  constructor(private readonly searchRepository: SearchRepository) {}

  /**
   * Recherche des liens avec validation et pagination
   * @param userId - ID de l'utilisateur
   * @param params - Paramètres de recherche
   * @returns Résultat de recherche avec métadonnées
   */
  async searchLinks(userId: string, params: SearchParams): Promise<SearchResult> {
    // Validation métier: la requête doit faire au moins 2 caractères
    if (params.query && params.query.trim().length > 0 && params.query.trim().length < 2) {
      console.warn('Search query must be at least 2 characters');
      return {
        links: [],
        total: 0,
        hasMore: false,
      };
    }

    // Valeurs par défaut pour la pagination
    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    // Appel au repository
    const links = await this.searchRepository.searchLinks(userId, {
      ...params,
      limit: limit + 1, // +1 pour détecter s'il y a plus de résultats
      offset,
    });

    // Filtrer pour ne garder que les liens de l'utilisateur actuel
    // (mesure de sécurité supplémentaire contre les bugs RLS)
    const userLinks = links.filter(link => link.user_id === userId);

    // Déterminer s'il y a plus de résultats
    const hasMore = userLinks.length > limit;
    const resultLinks = hasMore ? userLinks.slice(0, limit) : userLinks;

    return {
      links: resultLinks,
      total: resultLinks.length,
      hasMore,
    };
  }

  /**
   * Récupère tous les tags de l'utilisateur avec compteur d'utilisation
   * @param userId - ID de l'utilisateur
   * @returns Liste des tags triés par utilisation
   */
  async getUserTags(userId: string): Promise<TagWithCount[]> {
    return this.searchRepository.getUserTags(userId);
  }

  /**
   * Valide si une requête de recherche est valide
   * Logique métier pure
   */
  static isValidSearchQuery(query: string | undefined): boolean {
    if (!query) return true; // Pas de query = recherche globale valide
    const trimmed = query.trim();
    return trimmed.length === 0 || trimmed.length >= 2;
  }
}
