import { Link } from '@/domain/links/models/Link';
import { SearchParams, TagWithCount, UnifiedSearchResultItem } from '../models/SearchResult';

/**
 * Port (interface) pour le repository de recherche
 * Définit le contrat que l'infrastructure doit implémenter
 */
export interface SearchRepository {
  /**
   * Recherche des liens avec filtres et pagination
   * @param userId - ID de l'utilisateur
   * @param params - Paramètres de recherche (query, tags, folderId, pagination)
   * @returns Liste de liens correspondant aux critères
   */
  searchLinks(userId: string, params: SearchParams): Promise<Link[]>;

  /**
   * Recherche unifiée (liens + dossiers + groupes) avec filtres et pagination
   * @param userId - ID de l'utilisateur
   * @param params - Paramètres de recherche (query, tags, pagination)
   * @returns Liste de résultats (liens, dossiers, groupes)
   */
  unifiedSearch(userId: string, params: SearchParams): Promise<UnifiedSearchResultItem[]>;

  /**
   * Récupère tous les tags de l'utilisateur avec leur compteur d'utilisation
   * @param userId - ID de l'utilisateur
   * @returns Liste des tags triés par utilisation décroissante
   */
  getUserTags(userId: string): Promise<TagWithCount[]>;
}
