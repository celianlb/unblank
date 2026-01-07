import { TagService } from '@/domain/tags/services/TagService';
import { TagWithMetadata } from '@/domain/tags/models/TagWithMetadata';

/**
 * Use case: Récupérer tous les tags d'un utilisateur
 * Inclut les tags propres et ceux accessibles via shares
 */
export class GetUserTagsUseCase {
  constructor(private readonly tagService: TagService) {}

  async execute(userId: string): Promise<TagWithMetadata[]> {
    return this.tagService.getUserTags(userId);
  }
}
