import { SupabaseClient } from '@supabase/supabase-js';
import { avatarCacheService } from './AvatarCacheService';

/**
 * Use Case: Récupérer l'URL signée d'un avatar
 * Couche Application : orchestre le cache et l'infrastructure
 */
export class GetUserAvatarUrlUseCase {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Récupère l'URL signée d'un avatar, en utilisant le cache si disponible
   * @param avatarPath - Le chemin de l'avatar stocké dans public.users.avatar_url
   * @returns L'URL signée ou undefined en cas d'erreur
   */
  async execute(avatarPath: string): Promise<string | undefined> {
    try {
      // Si c'est déjà une URL complète (http/https), la retourner telle quelle
      if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
        return avatarPath;
      }

      // Vérifier le cache d'abord
      const cachedUrl = avatarCacheService.get(avatarPath);
      if (cachedUrl) {
        console.log('[CACHE HIT] Avatar URL from cache:', avatarPath);
        return cachedUrl;
      }

      console.log('[CACHE MISS] Generating new signed URL for:', avatarPath);
      // Générer une nouvelle signed URL depuis Storage
      const expiresIn = 3600; // 1 heure
      const { data, error } = await this.supabase.storage
        .from('avatars')
        .createSignedUrl(avatarPath, expiresIn);

      if (error) {
        console.error('Error creating signed URL for avatar:', error);
        return undefined;
      }

      // Mettre en cache
      avatarCacheService.set(avatarPath, data.signedUrl, expiresIn);

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting avatar signed URL:', error);
      return undefined;
    }
  }
}
