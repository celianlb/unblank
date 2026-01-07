import { TagRepository } from '../ports/TagRepository';
import { Tag } from '../models/Tag';
import { TagWithMetadata } from '../models/TagWithMetadata';

/**
 * Service du domaine pour les opérations métier sur les tags
 * Délègue l'accès aux données au repository (inversion de dépendance)
 */
export class TagService {
  constructor(private readonly tagRepository: TagRepository) {}

  /**
   * Normalise un nom de tag
   * Logique métier pure: lowercase + trim pour éviter les doublons
   */
  static normalizeTagName(name: string): string {
    return name.toLowerCase().trim();
  }

  /**
   * Valide un nom de tag
   */
  static validateTagName(name: string): { valid: boolean; error?: string } {
    const normalized = TagService.normalizeTagName(name);

    if (!normalized || normalized.length === 0) {
      return { valid: false, error: 'Tag name cannot be empty' };
    }

    if (normalized.length > 50) {
      return { valid: false, error: 'Tag name cannot exceed 50 characters' };
    }

    // Autoriser uniquement lettres, chiffres, espaces, tirets et underscores
    const validPattern = /^[a-z0-9\s\-_]+$/;
    if (!validPattern.test(normalized)) {
      return { valid: false, error: 'Tag name can only contain letters, numbers, spaces, hyphens and underscores' };
    }

    return { valid: true };
  }

  /**
   * Récupère tous les tags d'un utilisateur avec leurs métadonnées
   */
  async getUserTags(userId: string): Promise<TagWithMetadata[]> {
    return this.tagRepository.getUserTags(userId);
  }

  /**
   * Récupère un tag par son nom (avec normalisation)
   */
  async getTagByName(userId: string, name: string): Promise<Tag | null> {
    const normalized = TagService.normalizeTagName(name);
    return this.tagRepository.getTagByName(userId, normalized);
  }

  /**
   * Récupère un tag par son ID
   */
  async getTagById(tagId: string): Promise<Tag | null> {
    return this.tagRepository.getTagById(tagId);
  }

  /**
   * Récupère les suggestions de tags
   */
  async getTagSuggestions(userId: string, searchTerm: string, limit: number = 10): Promise<TagWithMetadata[]> {
    const normalized = TagService.normalizeTagName(searchTerm);
    if (!normalized) {
      return [];
    }
    return this.tagRepository.getTagSuggestions(userId, normalized, limit);
  }

  /**
   * Crée un nouveau tag avec validation et normalisation
   * Retourne le tag existant si un tag avec le même nom existe déjà
   */
  async createTag(userId: string, name: string): Promise<Tag | null> {
    const normalized = TagService.normalizeTagName(name);
    
    // Validation
    const validation = TagService.validateTagName(name);
    if (!validation.valid) {
      console.error(`Tag validation failed: ${validation.error}`);
      return null;
    }

    // Vérifier si le tag existe déjà
    const existingTag = await this.tagRepository.getTagByName(userId, normalized);
    if (existingTag) {
      return existingTag;
    }

    // Créer le nouveau tag
    return this.tagRepository.createTag(userId, normalized);
  }

  /**
   * Renomme un tag
   */
  async renameTag(tagId: string, newName: string): Promise<Tag | null> {
    const normalized = TagService.normalizeTagName(newName);
    
    // Validation
    const validation = TagService.validateTagName(newName);
    if (!validation.valid) {
      console.error(`Tag validation failed: ${validation.error}`);
      return null;
    }

    return this.tagRepository.renameTag(tagId, normalized);
  }

  /**
   * Supprime un tag
   */
  async deleteTag(tagId: string): Promise<boolean> {
    return this.tagRepository.deleteTag(tagId);
  }

  /**
   * Fusionne plusieurs tags en un seul
   */
  async mergeTags(sourceTagIds: string[], targetTagId: string): Promise<boolean> {
    if (sourceTagIds.length === 0) {
      console.error('No source tags provided for merge');
      return false;
    }

    if (sourceTagIds.includes(targetTagId)) {
      console.error('Target tag cannot be in source tags list');
      return false;
    }

    return this.tagRepository.mergeTags(sourceTagIds, targetTagId);
  }

  /**
   * Supprime les tags orphelins
   */
  async deleteOrphanTags(userId: string): Promise<number> {
    return this.tagRepository.deleteOrphanTags(userId);
  }
}
