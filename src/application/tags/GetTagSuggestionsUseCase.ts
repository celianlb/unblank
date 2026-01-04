import { TagService } from '@/domain/tags/services/TagService';
import { TagWithMetadata } from '@/domain/tags/models/TagWithMetadata';

/**
 * Use case: Obtenir des suggestions de tags pour l'autocomplete
 * Basé sur une recherche partielle du nom
 */
export class GetTagSuggestionsUseCase {
  constructor(private readonly tagService: TagService) {}

  async execute(userId: string, searchTerm: string, limit: number = 10): Promise<TagWithMetadata[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    return this.tagService.getTagSuggestions(userId, searchTerm, limit);
  }
}
