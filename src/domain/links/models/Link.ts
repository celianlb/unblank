import { Tag } from './Tag';

export interface Link {
  id: string;
  user_id: string;
  folder_id: string | null;
  url: string;
  title: string | null;
  description: string | null;
  screenshot_url: string | null;
  original_image_url: string | null;
  image_format: string | null;
  content_type: string | null;
  is_duplicate: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface CreateLinkData {
  url: string;
  title?: string;
  description?: string;
  folderId?: string;
  originalImageUrl?: string;
  imageFormat?: string;
  contentType?: string;
  tags?: string[];
}
