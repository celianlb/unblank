import { Link, CreateLinkData } from '../models/Link';

/**
 * Port (interface) pour le repository de liens
 * Définit le contrat que l'infrastructure doit implémenter
 */
export interface LinkRepository {
  /**
   * Récupère tous les liens d'un dossier spécifique
   */
  getFolderLinks(folderId: string): Promise<Link[]>;

  /**
   * Récupère tous les liens d'un utilisateur (tous dossiers confondus)
   */
  getUserLinks(userId: string, limit?: number, offset?: number): Promise<Link[]>;

  /**
   * Crée un nouveau lien
   */
  createLink(userId: string, data: CreateLinkData): Promise<Link | null>;

  /**
   * Supprime un seul lien
   */
  deleteLink(linkId: string): Promise<boolean>;

  /**
   * Supprime plusieurs liens
   */
  deleteLinks(linkIds: string[]): Promise<boolean>;

  /**
   * Met à jour les tags d'un lien
   */
  updateTags(linkId: string, userId: string, tags: string[]): Promise<boolean>;
}
