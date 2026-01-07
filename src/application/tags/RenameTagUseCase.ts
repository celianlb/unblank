import { TagService } from '@/domain/tags/services/TagService';
import { Tag } from '@/domain/tags/models/Tag';

/**
 * Use case: Renommer un tag existant
 */
export class RenameTagUseCase {
  constructor(private readonly tagService: TagService) {}

  async execute(tagId: string, newName: string): Promise<Tag | null> {
    return this.tagService.renameTag(tagId, newName);
  }
}
