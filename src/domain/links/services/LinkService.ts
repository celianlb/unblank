import { LinkRepository } from '../ports/LinkRepository';
import { Link, CreateLinkData } from '../models/Link';

/**
 * Service du domaine pour les opérations métier sur les liens
 * Délègue l'accès aux données au repository (inversion de dépendance)
 */
export class LinkService {
  constructor(private readonly linkRepository: LinkRepository) {}

  /**
   * Récupère tous les liens d'un dossier spécifique
   */
  async getFolderLinks(folderId: string): Promise<Link[]> {
    return this.linkRepository.getFolderLinks(folderId);
  }

  /**
   * Récupère tous les liens d'un utilisateur (tous dossiers confondus)
   */
  async getUserLinks(userId: string, limit?: number, offset?: number): Promise<Link[]> {
    return this.linkRepository.getUserLinks(userId, limit, offset);
  }

  /**
   * Détecte le type de contenu d'un lien
   * Logique métier pure (pas d'accès à la DB)
   */
  static getContentType(link: Link): 'image' | 'link' {
    // Si on a une image originale ou un format d'image, c'est une image
    if (link.original_image_url || link.image_format) {
      return 'image';
    }

    // Si le content_type commence par 'image/', c'est une image
    if (link.content_type && link.content_type.startsWith('image/')) {
      return 'image';
    }

    // Sinon c'est un lien classique
    return 'link';
  }

  /**
   * Supprime un seul lien
   */
  async deleteLink(linkId: string): Promise<boolean> {
    return this.linkRepository.deleteLink(linkId);
  }

  /**
   * Supprime plusieurs liens
   */
  async deleteLinks(linkIds: string[]): Promise<boolean> {
    // Validation métier: il faut au moins un ID
    if (!linkIds || linkIds.length === 0) {
      console.error('No link IDs provided');
      return false;
    }

    return this.linkRepository.deleteLinks(linkIds);
  }

  /**
   * Crée un nouveau lien
   * Contient la logique métier de validation
   */
  async createLink(userId: string, data: CreateLinkData): Promise<Link | null> {
    // Validation métier: l'URL est requise
    if (!data.url || data.url.trim().length === 0) {
      console.error('URL is required');
      return null;
    }

    // Validation métier: l'URL doit être valide
    try {
      new URL(data.url);
    } catch (error) {
      console.error('Invalid URL format');
      return null;
    }

    return this.linkRepository.createLink(userId, data);
  }

  /**
   * Met à jour les tags d'un lien
   */
  async updateTags(linkId: string, userId: string, tags: string[]): Promise<boolean> {
    return this.linkRepository.updateTags(linkId, userId, tags);
  }

  /**
   * Extrait les métadonnées d'une URL via l'API
   */
  static async extractMetadata(url: string): Promise<{
    url: string;
    title: string;
    description: string;
    image: string | null;
    contentType: 'image' | 'video' | 'link';
    imageFormat?: string;
  } | null> {
    try {
      const response = await fetch('/api/extract-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract metadata');
      }

      return await response.json();
    } catch (error) {
      console.error('Error extracting metadata:', error);
      return null;
    }
  }
}
