export type SharePermission = 'view' | 'edit';

export interface Share {
  id: string;
  folder_id: string;
  shared_by: string;
  shared_with_email: string | null;
  share_token: string;
  permission: SharePermission;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShareWithUser extends Share {
  user?: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
  } | null;
}

export interface CreateShareDTO {
  folder_id: string;
  shared_by: string;
  shared_with_email?: string;
  share_token: string;
  permission: SharePermission;
  expires_at?: string;
}

export interface UpdateShareDTO {
  permission?: SharePermission;
  is_active?: boolean;
  expires_at?: string | null;
}
