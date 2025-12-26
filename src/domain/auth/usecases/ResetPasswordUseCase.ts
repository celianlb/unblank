/**
 * Use Case pour la réinitialisation de mot de passe
 *
 * Responsabilités:
 * - Vérifier si un utilisateur existe
 * - Détecter si l'utilisateur utilise OAuth (Google, Pinterest, etc.)
 * - Déterminer si l'email de réinitialisation doit être envoyé
 */

export interface UserIdentity {
  email: string;
  identities?: any[];
  app_metadata?: {
    providers?: string[];
  };
}

export interface ResetPasswordResult {
  success: boolean;
  message: string;
  shouldSendEmail: boolean;
  oauthProviders?: string[];
}

export class ResetPasswordUseCase {
  /**
   * Vérifie si un utilisateur utilise OAuth
   * @param user - Les données utilisateur depuis Supabase
   * @returns Liste des providers OAuth (vide si email/password)
   */
  static checkOAuthProviders(user: UserIdentity): string[] {
    const providers = (user.app_metadata?.providers as string[]) || [];
    return providers.filter(p => p !== 'email');
  }

  /**
   * Détermine si l'email de réinitialisation doit être envoyé
   * @param email - L'email de l'utilisateur
   * @param users - Liste des utilisateurs depuis Supabase Admin
   * @returns Résultat indiquant si l'email doit être envoyé et pourquoi
   */
  static shouldSendResetEmail(
    email: string,
    users: UserIdentity[] | null
  ): ResetPasswordResult {
    const genericMessage = 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.';

    // Si pas d'utilisateurs ou liste vide
    if (!users || users.length === 0) {
      return {
        success: true,
        message: genericMessage,
        shouldSendEmail: false,
      };
    }

    // Rechercher l'utilisateur par email (case-insensitive)
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    // Utilisateur non trouvé - Ne pas révéler cette information
    if (!user) {
      return {
        success: true,
        message: genericMessage,
        shouldSendEmail: false,
      };
    }

    // Vérifier si l'utilisateur utilise OAuth
    const oauthProviders = this.checkOAuthProviders(user);

    if (oauthProviders.length > 0) {
      // Utilisateur OAuth - Ne pas envoyer d'email
      return {
        success: true,
        message: genericMessage,
        shouldSendEmail: false,
        oauthProviders,
      };
    }

    // Utilisateur email/password - Envoyer l'email
    return {
      success: true,
      message: genericMessage,
      shouldSendEmail: true,
    };
  }

  /**
   * Construit l'URL de redirection pour l'email de réinitialisation
   * @param baseUrl - URL de base de l'application
   * @returns URL complète de redirection
   */
  static buildRedirectUrl(baseUrl?: string): string {
    const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${appUrl}/reset-password`;
  }
}

