import { Tag } from '../models/Tag';
import { TagWithMetadata } from '../models/TagWithMetadata';

/**
 * Port (interface) pour le repository de tags
 * Définit le contrat que l'infrastructure doit implémenter
 */
export interface TagRepository {
  /**
   * Récupère tous les tags d'un utilisateur avec leurs métadonnées
   */
  getUserTags(userId: string): Promise<TagWithMetadata[]>;

  /**
   * Récupère un tag par son nom (case-insensitive)
   */
  getTagByName(userId: string, name: string): Promise<Tag | null>;

  /**
   * Récupère un tag par son ID
   */
  getTagById(tagId: string): Promise<Tag | null>;

  /**
   * Récupère les suggestions de tags basées sur une recherche partielle
   * Retourne les tags existants qui correspondent au pattern
   */
  getTagSuggestions(userId: string, searchTerm: string, limit?: number): Promise<TagWithMetadata[]>;

  /**
   * Crée un nouveau tag
   */
  createTag(userId: string, name: string): Promise<Tag | null>;

  /**
   * Renomme un tag existant
   */
  renameTag(tagId: string, newName: string): Promise<Tag | null>;

  /**
   * Supprime un tag
   */
  deleteTag(tagId: string): Promise<boolean>;

  /**
   * Fusionne plusieurs tags en un seul
   * Tous les link_tags des tags sources sont reassignés au tag de destination
   */
  mergeTags(sourceTagIds: string[], targetTagId: string): Promise<boolean>;

  /**
   * Supprime les tags orphelins (sans link_tags associés)
   */
  deleteOrphanTags(userId: string): Promise<number>;
}
