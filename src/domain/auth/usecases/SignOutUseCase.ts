import { AuthService } from '../services';

/**
 * Use Case: Déconnexion utilisateur
 */
export class SignOutUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(): Promise<void> {
    return await this.authService.signOut();
  }
}

