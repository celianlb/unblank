/**
 * Types d'erreurs d'authentification
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Erreur d'authentification personnalisée
 */
export class AuthError extends Error {
  constructor(
    public readonly type: AuthErrorType,
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'AuthError';
  }

  static invalidCredentials(): AuthError {
    return new AuthError(
      AuthErrorType.INVALID_CREDENTIALS,
      'Email ou mot de passe incorrect'
    );
  }

  static userNotFound(): AuthError {
    return new AuthError(
      AuthErrorType.USER_NOT_FOUND,
      'Aucun compte trouvé avec cet email'
    );
  }

  static emailNotVerified(): AuthError {
    return new AuthError(
      AuthErrorType.EMAIL_NOT_VERIFIED,
      'Veuillez vérifier votre email avant de vous connecter'
    );
  }

  static networkError(error?: unknown): AuthError {
    return new AuthError(
      AuthErrorType.NETWORK_ERROR,
      'Erreur de connexion. Veuillez réessayer.',
      error
    );
  }

  static unknown(error?: unknown): AuthError {
    return new AuthError(
      AuthErrorType.UNKNOWN_ERROR,
      'Une erreur inattendue s\'est produite',
      error
    );
  }
}

