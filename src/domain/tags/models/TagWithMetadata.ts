import { Tag } from './Tag';

export interface TagWithMetadata extends Tag {
  usage_count: number;
  link_count?: number;
  last_used_at?: string;
}
