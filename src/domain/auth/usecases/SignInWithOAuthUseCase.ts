import { AuthService } from '../services';
import { OAuthProvider } from '../models';

/**
 * Use Case: Connexion via OAuth (Google, Pinterest, etc.)
 */
export class SignInWithOAuthUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(provider: OAuthProvider, redirectTo?: string): Promise<void> {
    return await this.authService.signInWithOAuth(provider, redirectTo);
  }
}

