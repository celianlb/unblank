import { AuthService } from '../services';
import { AuthCredentials, UserSession } from '../models';

/**
 * Use Case: Connexion utilisateur
 * Cas d'usage métier pour authentifier un utilisateur
 */
export class SignInUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(credentials: AuthCredentials): Promise<UserSession> {
    return await this.authService.signIn(credentials);
  }
}

