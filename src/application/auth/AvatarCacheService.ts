/**
 * Service de cache pour les URLs signées des avatars
 * Couche Application : contient la logique métier de cache
 * Utilise sessionStorage pour persister entre les refreshes
 */

interface CacheEntry {
  url: string;
  expiresAt: number;
}

export class AvatarCacheService {
  private readonly EXPIRATION_MARGIN_MS = 5 * 60 * 1000; // 5 minutes de marge
  private readonly STORAGE_KEY = 'avatar_url_cache';

  /**
   * Récupère tout le cache depuis sessionStorage
   */
  private getCache(): Map<string, CacheEntry> {
    if (typeof window === 'undefined') {
      return new Map();
    }

    try {
      const cached = sessionStorage.getItem(this.STORAGE_KEY);
      if (!cached) {
        return new Map();
      }

      const parsed = JSON.parse(cached);
      return new Map(Object.entries(parsed));
    } catch (error) {
      console.error('Error reading cache from sessionStorage:', error);
      return new Map();
    }
  }

  /**
   * Sauvegarde tout le cache dans sessionStorage
   */
  private saveCache(cache: Map<string, CacheEntry>): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const obj = Object.fromEntries(cache);
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('Error saving cache to sessionStorage:', error);
    }
  }

  /**
   * Récupère une URL signée depuis le cache si elle est encore valide
   */
  get(avatarPath: string): string | null {
    const cache = this.getCache();
    const entry = cache.get(avatarPath);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (entry.expiresAt <= now) {
      // Entrée expirée, la supprimer
      cache.delete(avatarPath);
      this.saveCache(cache);
      return null;
    }

    return entry.url;
  }

  /**
   * Stocke une URL signée dans le cache
   * @param avatarPath - Le chemin de l'avatar (ex: "user-id/avatar.jpg")
   * @param signedUrl - L'URL signée générée
   * @param expiresInSeconds - Durée de validité en secondes
   */
  set(avatarPath: string, signedUrl: string, expiresInSeconds: number): void {
    const cache = this.getCache();
    const expiresAt = Date.now() + (expiresInSeconds * 1000) - this.EXPIRATION_MARGIN_MS;

    cache.set(avatarPath, {
      url: signedUrl,
      expiresAt,
    });

    this.saveCache(cache);
  }

  /**
   * Vide le cache
   */
  clear(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Supprime une entrée spécifique du cache
   */
  delete(avatarPath: string): void {
    const cache = this.getCache();
    cache.delete(avatarPath);
    this.saveCache(cache);
  }

  /**
   * Nettoie les entrées expirées du cache
   */
  cleanup(): void {
    const cache = this.getCache();
    const now = Date.now();
    let hasChanges = false;

    for (const [path, entry] of cache.entries()) {
      if (entry.expiresAt <= now) {
        cache.delete(path);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.saveCache(cache);
    }
  }
}

// Instance singleton pour partager le cache entre tous les composants
export const avatarCacheService = new AvatarCacheService();
