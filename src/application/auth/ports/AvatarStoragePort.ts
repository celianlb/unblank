/**
 * Port pour l'accès au storage d'avatars
 * Abstraction Clean Architecture (Hexagonal Architecture)
 * L'implémentation sera fournie par la couche Infrastructure
 */
export interface AvatarStoragePort {
  /**
   * Upload un avatar pour un utilisateur
   * @param file - Fichier image à uploader
   * @param userId - ID de l'utilisateur propriétaire
   * @returns Le chemin relatif du fichier uploadé (ex: userId/avatar.jpg)
   */
  uploadAvatar(file: File, userId: string): Promise<string>;

  /**
   * Supprime un avatar
   * @param avatarPath - Chemin relatif de l'avatar à supprimer
   */
  deleteAvatar(avatarPath: string): Promise<void>;

  /**
   * Récupère l'URL publique d'un avatar
   * @param avatarPath - Chemin relatif de l'avatar
   * @returns L'URL publique complète
   */
  getPublicUrl(avatarPath: string): string;
}
