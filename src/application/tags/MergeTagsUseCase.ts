import { TagService } from '@/domain/tags/services/TagService';

/**
 * Use case: Fusionner plusieurs tags en un seul
 * Tous les link_tags des tags sources sont reassignés au tag de destination
 */
export class MergeTagsUseCase {
  constructor(private readonly tagService: TagService) {}

  async execute(sourceTagIds: string[], targetTagId: string): Promise<boolean> {
    return this.tagService.mergeTags(sourceTagIds, targetTagId);
  }
}
