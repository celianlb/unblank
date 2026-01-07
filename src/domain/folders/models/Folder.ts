export interface Folder {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  parent_folder_id: string | null;
  is_group: boolean;
  is_system: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  link_count?: number;
  preview_images?: string[];
}
