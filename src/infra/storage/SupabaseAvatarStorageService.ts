import { SupabaseClient } from '@supabase/supabase-js';
import { AvatarStoragePort } from '@/application/auth/ports/AvatarStoragePort';

/**
 * Implémentation Supabase du storage d'avatars
 * Infrastructure Layer : adapter entre Supabase Storage et notre domaine
 */
export class SupabaseAvatarStorageService implements AvatarStoragePort {
  private readonly NEW_BUCKET = 'unblank-avatars';

  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Upload un avatar dans le bucket public unblank-avatars
   * Utilise upsert pour remplacer automatiquement l'ancien avatar
   */
  async uploadAvatar(file: File, userId: string): Promise<string> {
    const extension = this.getExtension(file.type);
    const filePath = `${userId}/avatar.${extension}`;

    const { error } = await this.supabase.storage
      .from(this.NEW_BUCKET)
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600', // 1h cache CDN
        upsert: true, // Remplace l'ancien avatar s'il existe
      });

    if (error) {
      throw new Error(`Failed to upload avatar: ${error.message}`);
    }

    return filePath; // Clean path sans query params (ex: userId/avatar.jpg)
  }

  /**
   * Supprime un avatar du storage
   */
  async deleteAvatar(avatarPath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.NEW_BUCKET)
      .remove([avatarPath]);

    if (error) {
      throw new Error(`Failed to delete avatar: ${error.message}`);
    }
  }

  /**
   * Récupère l'URL publique d'un avatar
   * Note: Cette méthode est rarement utilisée directement
   * On préfère AvatarUrlService pour les cache-busters
   */
  getPublicUrl(avatarPath: string): string {
    const { data } = this.supabase.storage
      .from(this.NEW_BUCKET)
      .getPublicUrl(avatarPath);

    return data.publicUrl;
  }

  /**
   * Détermine l'extension fichier depuis le MIME type
   */
  private getExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    return extensions[mimeType] || 'jpg';
  }
}
