import { AuthService } from '../services';

/**
 * Use Case: Réinitialisation du mot de passe
 * Envoie un email de réinitialisation
 */
export class ResetPasswordUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(email: string): Promise<void> {
    return await this.authService.resetPassword(email);
  }
}

