import { AvatarUrlService } from './AvatarUrlService';

/**
 * Use Case: Récupérer l'URL d'un avatar
 * Couche Application : délègue la génération d'URL à AvatarUrlService
 */
export class GetUserAvatarUrlUseCase {
  constructor(private readonly avatarUrlService: AvatarUrlService) {}

  /**
   * Récupère l'URL d'un avatar (publique ou externe)
   * Plus de cache sessionStorage, logique déléguée à AvatarUrlService
   * @param avatarPath - Le chemin de l'avatar stocké dans public.users.avatar_url
   * @returns L'URL publique ou undefined
   */
  async execute(avatarPath: string | undefined): Promise<string | undefined> {
    return this.avatarUrlService.getAvatarUrl(avatarPath);
  }
}
