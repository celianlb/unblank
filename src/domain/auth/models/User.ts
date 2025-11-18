/**
 * User Entity - Domain Model
 * Représente un utilisateur dans le système
 */
export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Credentials pour l'authentification
 */
export interface AuthCredentials {
  email: string;
  password: string;
}

/**
 * Données pour l'inscription
 */
export interface SignUpData {
  email: string;
  password: string;
  username?: string;
}

/**
 * Session utilisateur après authentification
 */
export interface UserSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Providers OAuth supportés
 */
export type OAuthProvider = 'google' | 'pinterest';

/**
 * Options pour l'authentification OAuth
 */
export interface OAuthOptions {
  provider: OAuthProvider;
  redirectTo?: string;
}

