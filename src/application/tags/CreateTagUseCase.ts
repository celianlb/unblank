import { TagService } from '@/domain/tags/services/TagService';
import { Tag } from '@/domain/tags/models/Tag';

/**
 * Use case: Créer un nouveau tag
 * Avec validation et normalisation automatique
 */
export class CreateTagUseCase {
  constructor(private readonly tagService: TagService) {}

  async execute(userId: string, name: string): Promise<Tag | null> {
    return this.tagService.createTag(userId, name);
  }
}
