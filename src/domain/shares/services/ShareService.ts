import { ShareRepository } from '../ports/ShareRepository';
import { Share, ShareWithUser, SharePermission } from '../models/Share';

export class ShareService {
  constructor(private shareRepository: ShareRepository) {}

  /**
   * Generate a unique share token
   */
  private generateShareToken(): string {
    // Generate a random URL-safe token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create a public share link (no specific email)
   */
  async createPublicShare(
    folderId: string,
    sharedBy: string,
    permission: SharePermission,
    expiresAt?: string
  ): Promise<Share> {
    const shareToken = this.generateShareToken();

    return this.shareRepository.createShare({
      folder_id: folderId,
      shared_by: sharedBy,
      share_token: shareToken,
      permission,
      expires_at: expiresAt,
    });
  }

  /**
   * Invite a specific user by email
   */
  async inviteByEmail(
    folderId: string,
    sharedBy: string,
    email: string,
    permission: SharePermission,
    expiresAt?: string
  ): Promise<Share> {
    const shareToken = this.generateShareToken();

    return this.shareRepository.createShare({
      folder_id: folderId,
      shared_by: sharedBy,
      shared_with_email: email,
      share_token: shareToken,
      permission,
      expires_at: expiresAt,
    });
  }

  /**
   * Get all shares for a folder
   */
  async getFolderShares(folderId: string): Promise<ShareWithUser[]> {
    return this.shareRepository.getSharesByFolder(folderId);
  }

  /**
   * Get share by token (for public access)
   */
  async getShareByToken(token: string): Promise<Share | null> {
    return this.shareRepository.getShareByToken(token);
  }

  /**
   * Update share permission
   */
  async updatePermission(
    shareId: string,
    permission: SharePermission
  ): Promise<Share> {
    return this.shareRepository.updateShare(shareId, { permission });
  }

  /**
   * Revoke a share
   */
  async revokeShare(shareId: string): Promise<void> {
    return this.shareRepository.revokeShare(shareId);
  }

  /**
   * Check if a user has access to a folder
   */
  async hasAccess(folderId: string, userId: string): Promise<boolean> {
    return this.shareRepository.hasAccess(folderId, userId);
  }

  /**
   * Validate share token and check if it's active
   */
  async validateShareToken(token: string): Promise<{
    isValid: boolean;
    share?: Share;
    reason?: string;
  }> {
    const share = await this.shareRepository.getShareByToken(token);

    if (!share) {
      return { isValid: false, reason: 'Share not found' };
    }

    if (!share.is_active) {
      return { isValid: false, reason: 'Share has been revoked' };
    }

    if (share.expires_at) {
      const expirationDate = new Date(share.expires_at);
      if (expirationDate < new Date()) {
        return { isValid: false, reason: 'Share has expired' };
      }
    }

    return { isValid: true, share };
  }

  /**
   * Get all folders shared with a specific user
   */
  async getSharedFolders(userEmail: string): Promise<any[]> {
    const shares = await this.shareRepository.getSharedWithUser(userEmail);

    // Transform the data to include share info with folder data
    return shares
      .filter(share => share.folders) // Filter out shares where folder was deleted
      .map(share => ({
        ...share.folders,
        share_permission: share.permission,
        share_id: share.id,
      }));
  }
}
