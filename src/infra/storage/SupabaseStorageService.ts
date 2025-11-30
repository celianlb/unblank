import { supabase } from '@/infra/db/supabase';

export class SupabaseStorageService {
  private static AVATARS_BUCKET = 'avatars';

  /**
   * Upload un avatar vers Supabase Storage
   * @param file Le fichier image à uploader
   * @param userId L'ID de l'utilisateur (pour nommer le fichier)
   * @returns Le path de l'avatar (à stocker en DB, pas la signed URL)
   */
  static async uploadAvatar(file: File, userId: string): Promise<string> {
    // Déterminer l'extension du fichier
    const fileType = file.type;
    let extension = 'jpg';
    if (fileType.includes('png')) extension = 'png';
    else if (fileType.includes('webp')) extension = 'webp';
    else if (fileType.includes('gif')) extension = 'gif';
    else if (fileType.includes('jpeg')) extension = 'jpg';

    // Structure cohérente avec l'Edge Function : userId/avatar.extension
    const filePath = `${userId}/avatar.${extension}`;

    // Upload du fichier avec upsert pour écraser l'ancien
    const { error } = await supabase.storage
      .from(this.AVATARS_BUCKET)
      .upload(filePath, file, {
        contentType: fileType,
        cacheControl: '3600',
        upsert: true, // Écrase l'ancien avatar
      });

    if (error) {
      console.error('Erreur upload avatar:', error);
      throw new Error(`Échec de l'upload: ${error.message}`);
    }

    // Retourner juste le path (pas la signed URL)
    // La signed URL sera générée côté backend à la demande
    return filePath;
  }

  /**
   * Génère une signed URL depuis un path stocké en DB
   * @param avatarPath Le path de l'avatar (ex: "userId/avatar.jpg")
   * @returns La signed URL valide 1 an
   */
  static async getSignedUrl(avatarPath: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(this.AVATARS_BUCKET)
        .createSignedUrl(avatarPath, 60 * 60 * 24 * 365); // 1 an

      if (error || !data?.signedUrl) {
        console.error('Erreur génération signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Erreur génération signed URL:', error);
      return null;
    }
  }

  /**
   * Supprime un avatar
   * @param avatarPath Le path de l'avatar (ex: "userId/avatar.jpg")
   */
  static async deleteAvatar(avatarPath: string): Promise<void> {
    try {
      if (!avatarPath) return;

      await supabase.storage
        .from(this.AVATARS_BUCKET)
        .remove([avatarPath]);
    } catch (error) {
      console.error('Erreur suppression avatar:', error);
      // On ne throw pas car ce n'est pas critique
    }
  }
}
