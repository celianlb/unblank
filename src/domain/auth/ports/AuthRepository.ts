import { AuthCredentials, User, UserSession, OAuthProvider } from '../models';

/**
 * Port (interface) pour le repository d'authentification
 * Définit le contrat que l'infrastructure doit implémenter
 */
export interface AuthRepository {
  /**
   * Authentifie un utilisateur avec email et mot de passe
   */
  signIn(credentials: AuthCredentials): Promise<UserSession>;

  /**
   * Authentifie un utilisateur via OAuth (Google, Pinterest, etc.)
   */
  signInWithOAuth(provider: OAuthProvider, redirectTo?: string): Promise<void>;

  /**
   * Déconnecte l'utilisateur actuel
   */
  signOut(): Promise<void>;

  /**
   * Récupère la session utilisateur actuelle
   */
  getCurrentSession(): Promise<UserSession | null>;

  /**
   * Récupère l'utilisateur actuellement connecté
   */
  getCurrentUser(): Promise<User | null>;

  /**
   * Rafraîchit le token d'accès
   */
  refreshSession(): Promise<UserSession>;
}

