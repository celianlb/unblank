import { TagService } from '@/domain/tags/services/TagService';

/**
 * Use case: Supprimer un tag
 */
export class DeleteTagUseCase {
  constructor(private readonly tagService: TagService) {}

  async execute(tagId: string): Promise<boolean> {
    return this.tagService.deleteTag(tagId);
  }
}
