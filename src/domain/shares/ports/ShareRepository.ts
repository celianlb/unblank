import { Share, ShareWithUser, ShareWithFolder, CreateShareDTO, UpdateShareDTO } from '../models/Share';

export interface ShareRepository {
  /**
   * Create a new share
   */
  createShare(data: CreateShareDTO): Promise<Share>;

  /**
   * Get all shares for a specific folder
   */
  getSharesByFolder(folderId: string): Promise<ShareWithUser[]>;

  /**
   * Get a share by its ID
   */
  getShareById(shareId: string): Promise<Share | null>;

  /**
   * Get a share by its token
   */
  getShareByToken(token: string): Promise<Share | null>;

  /**
   * Get a share by folder ID and user email
   */
  getShareByFolderAndEmail(folderId: string, userEmail: string): Promise<Share | null>;

  /**
   * Update a share
   */
  updateShare(shareId: string, data: UpdateShareDTO): Promise<Share>;

  /**
   * Revoke a share (set is_active to false)
   */
  revokeShare(shareId: string): Promise<void>;

  /**
   * Delete a share permanently
   */
  deleteShare(shareId: string): Promise<void>;

  /**
   * Check if a user has access to a folder via share
   */
  hasAccess(folderId: string, userId: string): Promise<boolean>;

  /**
   * Get all folders shared with a specific user
   */
  getSharedWithUser(userEmail: string): Promise<ShareWithFolder[]>;

  /**
   * Revoke all shares for a user in a group and its child folders
   */
  revokeGroupShares(groupId: string, userEmail: string, childFolderIds: string[]): Promise<void>;
}
