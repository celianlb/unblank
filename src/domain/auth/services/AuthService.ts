import { AuthRepository } from '../ports';
import { AuthCredentials, UserSession, AuthError, OAuthProvider, SignUpData } from '../models';

/**
 * Service d'authentification - Logique métier pure
 * Orchestre les opérations d'authentification
 */
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  /**
   * Valide les credentials avant l'authentification
   */
  private validateCredentials(credentials: AuthCredentials): void {
    if (!credentials.email || !credentials.email.trim()) {
      throw new AuthError(
        'INVALID_CREDENTIALS' as any,
        'L\'email est requis'
      );
    }

    if (!credentials.password || credentials.password.length < 6) {
      throw new AuthError(
        'INVALID_CREDENTIALS' as any,
        'Le mot de passe doit contenir au moins 6 caractères'
      );
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      throw new AuthError(
        'INVALID_CREDENTIALS' as any,
        'L\'email n\'est pas valide'
      );
    }
  }

  /**
   * Valide les données d'inscription
   */
  private validateSignUpData(data: SignUpData): void {
    // Validation email
    if (!data.email || !data.email.trim()) {
      throw new AuthError(
        'INVALID_CREDENTIALS' as any,
        'L\'email est requis'
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new AuthError(
        'INVALID_CREDENTIALS' as any,
        'L\'email n\'est pas valide'
      );
    }

    // Validation mot de passe
    if (!data.password || data.password.length < 6) {
      throw new AuthError(
        'INVALID_CREDENTIALS' as any,
        'Le mot de passe doit contenir au moins 6 caractères'
      );
    }

    // Validation pseudo (optionnel mais si présent doit être valide)
    if (data.username && data.username.trim().length < 3) {
      throw new AuthError(
        'INVALID_CREDENTIALS' as any,
        'Le pseudo doit contenir au moins 3 caractères'
      );
    }
  }

  /**
   * Authentifie un utilisateur
   */
  async signIn(credentials: AuthCredentials): Promise<UserSession> {
    this.validateCredentials(credentials);
    return await this.authRepository.signIn(credentials);
  }

  /**
   * Inscrit un nouvel utilisateur
   */
  async signUp(data: SignUpData): Promise<UserSession> {
    this.validateSignUpData(data);
    return await this.authRepository.signUp(data);
  }

  /**
   * Authentifie un utilisateur via OAuth
   */
  async signInWithOAuth(provider: OAuthProvider, redirectTo?: string): Promise<void> {
    return await this.authRepository.signInWithOAuth(provider, redirectTo);
  }

  /**
   * Déconnecte l'utilisateur actuel
   */
  async signOut(): Promise<void> {
    return await this.authRepository.signOut();
  }

  /**
   * Vérifie si un utilisateur est connecté
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.authRepository.getCurrentSession();
    return session !== null;
  }

  /**
   * Récupère la session actuelle
   */
  async getCurrentSession(): Promise<UserSession | null> {
    return await this.authRepository.getCurrentSession();
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async resetPassword(email: string): Promise<void> {
    // Validation de l'email
    if (!email || !email.trim()) {
      throw new AuthError(
        'INVALID_CREDENTIALS' as any,
        'L\'email est requis'
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AuthError(
        'INVALID_CREDENTIALS' as any,
        'L\'email n\'est pas valide'
      );
    }

    return await this.authRepository.resetPassword(email);
  }
}

