import { Link } from '@/domain/links/models/Link';
import { SearchParams, TagWithCount } from '../models/SearchResult';

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
   * Récupère tous les tags de l'utilisateur avec leur compteur d'utilisation
   * @param userId - ID de l'utilisateur
   * @returns Liste des tags triés par utilisation décroissante
   */
  getUserTags(userId: string): Promise<TagWithCount[]>;
}
