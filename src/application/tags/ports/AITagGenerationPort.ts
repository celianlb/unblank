/**
 * Port: Interface pour le service de génération de tags par IA
 * Abstraction Clean Architecture - implémenté par OpenAITagService
 */

export interface AITagGenerationInput {
  imageUrl: string;
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
}

export interface AITagGenerationOutput {
  tags: string[];
  confidence?: number;
  model?: string;
}

export interface AITagGenerationPort {
  /**
   * Génère des tags français à partir d'une image
   * @param input - Données du lien (image URL, métadonnées)
   * @returns Liste de tags générés en français
   */
  generateTagsFromImage(input: AITagGenerationInput): Promise<AITagGenerationOutput>;
}
