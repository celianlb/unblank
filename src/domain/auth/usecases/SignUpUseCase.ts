import { AuthService } from '../services';
import { SignUpData, UserSession } from '../models';

/**
 * Use Case: Inscription utilisateur
 * Cas d'usage métier pour créer un nouveau compte
 */
export class SignUpUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(data: SignUpData): Promise<UserSession> {
    return await this.authService.signUp(data);
  }
}

