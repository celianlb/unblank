import { AvatarStoragePort } from './ports/AvatarStoragePort';
import { AvatarUrlService } from './AvatarUrlService';

/**
 * Use Case: Upload avatar avec URL publique
 * Couche Application : orchestre storage + génération URL
 */
export class UploadAvatarUseCase {
  constructor(
    private readonly avatarStoragePort: AvatarStoragePort,
    private readonly avatarUrlService: AvatarUrlService
  ) {}

  /**
   * Upload avatar et retourne path + URL avec cache-buster
   * @param file - Fichier image à uploader
   * @param userId - ID de l'utilisateur propriétaire
   * @returns { path: string, url: string }
   * - path: chemin clean pour stockage DB (ex: userId/avatar.jpg)
   * - url: URL temporaire avec cache-buster timestamp pour affichage immédiat
   */
  async execute(file: File, userId: string): Promise<{ path: string; url: string }> {
    // 1. Upload fichier (upsert = remplace ancien avatar automatiquement)
    const path = await this.avatarStoragePort.uploadAvatar(file, userId);

    // 2. Générer URL avec cache-buster timestamp (force refresh navigateur)
    const url = this.avatarUrlService.getUploadedAvatarUrl(path);

    return { path, url };
  }
}
