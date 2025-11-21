import { AuthRepository } from '../ports';
import { UpdateProfileData, User } from '../models';
import { AuthError } from '../models/AuthError';

/**
 * Use Case: Mise à jour du profil utilisateur
 * 
 * Business Rules:
 * - L'utilisateur doit être authentifié
 * - Les données de profil sont validées
 * - Le username doit être unique si fourni
 */
export class UpdateProfileUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(data: UpdateProfileData): Promise<User> {
    try {
      // Vérifier que l'utilisateur est connecté
      const currentUser = await this.authRepository.getCurrentUser();
      
      if (!currentUser) {
        throw AuthError.unknown(
          new Error('Vous devez être connecté pour modifier votre profil')
        );
      }

      // Valider les données
      if (data.username !== undefined && data.username.trim() === '') {
        throw AuthError.unknown(
          new Error('Le pseudo ne peut pas être vide')
        );
      }

      // Mettre à jour le profil
      const updatedUser = await this.authRepository.updateProfile(data);
      
      return updatedUser;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw AuthError.unknown(error as Error);
    }
  }
}

