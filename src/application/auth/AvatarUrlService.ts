/**
 * Service: Génération URLs publiques pour avatars
 * Couche Application : logique métier de génération d'URLs
 */
export class AvatarUrlService {
  private readonly SUPABASE_STORAGE_URL: string;
  private readonly NEW_BUCKET = 'unblank-avatars';

  constructor(supabaseUrl: string) {
    this.SUPABASE_STORAGE_URL = supabaseUrl;
  }

  /**
   * Génère URL publique avec cache-buster stable
   * - Avatars (unblank-avatars) : ?v={userId}
   * - URLs externes (Google, Pinterest) : retour direct
   */
  getAvatarUrl(avatarPath: string | undefined): string | undefined {
    if (!avatarPath) return undefined;

    // URL externe (Google, Pinterest) - ne devrait plus arriver
    // car OAuth sync les télécharge vers unblank-avatars
    if (avatarPath.startsWith('http')) return avatarPath;

    // URL publique directe avec cache-buster stable
    const userId = this.extractUserIdFromPath(avatarPath);
    return `${this.SUPABASE_STORAGE_URL}/storage/v1/object/public/${this.NEW_BUCKET}/${avatarPath}?v=${userId}`;
  }

  /**
   * Génère URL après upload (cache-buster timestamp)
   * Force refresh navigateur après upload
   */
  getUploadedAvatarUrl(avatarPath: string): string {
    const timestamp = Date.now();
    return `${this.SUPABASE_STORAGE_URL}/storage/v1/object/public/${this.NEW_BUCKET}/${avatarPath}?t=${timestamp}`;
  }

  private extractUserIdFromPath(path: string): string {
    // Path format: userId/avatar.ext
    return path.split('/')[0] || '';
  }
}
