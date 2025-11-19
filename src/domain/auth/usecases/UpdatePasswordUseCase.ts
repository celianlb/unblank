import { AuthRepository } from '../ports';
import { AuthService } from '../services';

/**
 * Use Case : Mise à jour du mot de passe
 * Met à jour le mot de passe de l'utilisateur actuellement connecté
 */
export class UpdatePasswordUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authService: AuthService
  ) {}

  async execute(newPassword: string): Promise<void> {
    // Validation du nouveau mot de passe
    this.authService.validatePassword(newPassword);

    // Mise à jour du mot de passe via le repository
    await this.authRepository.updatePassword(newPassword);
  }
}

