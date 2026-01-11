import OpenAI from 'openai';
import {
  AITagGenerationPort,
  AITagGenerationInput,
  AITagGenerationOutput
} from '@/application/tags/ports/AITagGenerationPort';

/**
 * Infrastructure Layer: Implémentation OpenAI du port de génération de tags
 * Gère toutes les interactions avec l'API OpenAI
 */
export class OpenAITagService implements AITagGenerationPort {
  private openai: OpenAI;
  private model = 'gpt-4o-mini'; // Modèle optimisé coût/performance

  constructor() {
    const apiKey = process.env.OPEN_API_KEY;

    if (!apiKey) {
      throw new Error('OPEN_API_KEY is not defined in environment variables');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateTagsFromImage(input: AITagGenerationInput): Promise<AITagGenerationOutput> {
    try {
      const prompt = this.buildPrompt(input);

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant spécialisé dans la génération de tags français pour organiser des bookmarks visuels.

Règles strictes:
- Retourne UNIQUEMENT une liste de tags séparés par des virgules
- 3 à 8 tags maximum
- Tags en français, courts (1-3 mots)
- Lowercase, pas d'accents si possible
- Pas de ponctuation sauf tirets pour mots composés
- Focus sur: style visuel, couleurs dominantes, sujet, ambiance, catégorie
- Pas de tags génériques comme "image" ou "photo"

Exemples:
"design minimal, interface utilisateur, bleu, moderne, dashboard"
"nature, paysage, montagnes, photographie, aventure"
"typographie, serif, vintage, branding, luxe"`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: input.imageUrl,
                  detail: 'low', // Optimisation des coûts
                },
              },
            ],
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No tags generated from OpenAI');
      }

      // Parser les tags (séparés par virgules)
      const tags = content
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0 && tag.length <= 50)
        .slice(0, 8);

      if (tags.length === 0) {
        throw new Error('No valid tags extracted from OpenAI response');
      }

      return {
        tags,
        model: this.model,
      };
    } catch (error) {
      console.error('[OpenAITagService] Error generating tags:', error);

      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }

      throw new Error(`Failed to generate AI tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Construit le prompt avec le contexte du lien
   */
  private buildPrompt(input: AITagGenerationInput): string {
    let prompt = 'Analyse cette image et génère des tags français pertinents.';

    if (input.linkTitle) {
      prompt += `\n\nTitre: ${input.linkTitle}`;
    }

    if (input.linkDescription) {
      prompt += `\n\nDescription: ${input.linkDescription}`;
    }

    if (input.linkUrl) {
      prompt += `\n\nSource: ${input.linkUrl}`;
    }

    return prompt;
  }
}
