import { SupabaseClient } from '@supabase/supabase-js';
import { AuthRepository } from '@/domain/auth/ports';
import {
  AuthCredentials,
  User,
  UserSession,
  AuthError,
  AuthErrorType,
  OAuthProvider,
  SignUpData,
  UpdateProfileData,
} from '@/domain/auth/models';

/**
 * Implémentation Supabase du repository d'authentification
 * Adapter entre Supabase et notre domaine métier
 */
export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Convertit un user Supabase en User du domaine
   */
  private mapSupabaseUserToDomain(supabaseUser: any): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      username: supabaseUser.user_metadata?.username || undefined,
      avatarUrl: supabaseUser.user_metadata?.avatar_url || undefined,
      createdAt: new Date(supabaseUser.created_at),
      updatedAt: supabaseUser.updated_at
        ? new Date(supabaseUser.updated_at)
        : undefined,
    };
  }

  /**
   * Convertit une session Supabase en UserSession du domaine
   */
  private mapSupabaseSessionToDomain(supabaseSession: any): UserSession {
    return {
      user: this.mapSupabaseUserToDomain(supabaseSession.user),
      accessToken: supabaseSession.access_token,
      refreshToken: supabaseSession.refresh_token,
      expiresAt: (supabaseSession.expires_at || 0) * 1000, // Convert seconds to milliseconds
    };
  }

  /**
   * Gère les erreurs Supabase et les convertit en AuthError
   */
  private handleSupabaseError(error: any): never {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('invalid') || message.includes('credentials')) {
      throw AuthError.invalidCredentials();
    }

    if (message.includes('not found') || message.includes('user')) {
      throw AuthError.userNotFound();
    }

    if (message.includes('email') && message.includes('confirm')) {
      throw AuthError.emailNotVerified();
    }

    if (message.includes('network') || message.includes('fetch')) {
      throw AuthError.networkError(error);
    }

    throw AuthError.unknown(error);
  }

  async signIn(credentials: AuthCredentials): Promise<UserSession> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        this.handleSupabaseError(error);
      }

      if (!data.session || !data.user) {
        throw AuthError.unknown(new Error('No session returned from Supabase'));
      }

      return this.mapSupabaseSessionToDomain(data.session);
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      this.handleSupabaseError(error);
    }
  }

  async signUp(signUpData: SignUpData): Promise<UserSession> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' 
            ? `${window.location.origin}/confirm`
            : undefined,
          data: {
            username: signUpData.username || '',
          },
        },
      });

      if (error) {
        this.handleSupabaseError(error);
      }

      if (!data.user) {
        throw AuthError.unknown(
          new Error('Erreur lors de la création du compte')
        );
      }

      // Si pas de session (email confirmation requise)
      if (!data.session) {
        // Créer une session temporaire pour afficher un message
        return {
          user: this.mapSupabaseUserToDomain(data.user),
          accessToken: '',
          refreshToken: '',
          expiresAt: 0,
        };
      }

      return this.mapSupabaseSessionToDomain(data.session);
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      this.handleSupabaseError(error);
    }
  }

  async signInWithOAuth(provider: OAuthProvider, redirectTo?: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: redirectTo || `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        this.handleSupabaseError(error);
      }

      // Supabase redirige automatiquement vers le provider OAuth
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      this.handleSupabaseError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        this.handleSupabaseError(error);
      }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      this.handleSupabaseError(error);
    }
  }

  async getCurrentSession(): Promise<UserSession | null> {
    try {
      const { data, error } = await this.supabase.auth.getSession();

      if (error) {
        this.handleSupabaseError(error);
      }

      if (!data.session) {
        return null;
      }

      return this.mapSupabaseSessionToDomain(data.session);
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      this.handleSupabaseError(error);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data, error } = await this.supabase.auth.getUser();

      if (error) {
        this.handleSupabaseError(error);
      }

      if (!data.user) {
        return null;
      }

      return this.mapSupabaseUserToDomain(data.user);
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      this.handleSupabaseError(error);
    }
  }

  async refreshSession(): Promise<UserSession> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();

      if (error) {
        this.handleSupabaseError(error);
      }

      if (!data.session) {
        throw AuthError.unknown(
          new Error('No session returned after refresh')
        );
      }

      return this.mapSupabaseSessionToDomain(data.session);
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      this.handleSupabaseError(error);
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
      });

      if (error) {
        this.handleSupabaseError(error);
      }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      this.handleSupabaseError(error);
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    try {
      console.log('[SupabaseAuthRepository] updatePassword called');
      console.log('[SupabaseAuthRepository] Calling supabase.auth.updateUser...');
      
      const { data, error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      console.log('[SupabaseAuthRepository] updateUser response:', { data, error });

      if (error) {
        console.error('[SupabaseAuthRepository] updateUser error:', error);
        this.handleSupabaseError(error);
      }
      
      console.log('[SupabaseAuthRepository] Password updated successfully');
    } catch (error) {
      console.error('[SupabaseAuthRepository] updatePassword catch error:', error);
      if (error instanceof AuthError) {
        throw error;
      }
      this.handleSupabaseError(error);
    }
  }

  async updateProfile(data: UpdateProfileData): Promise<User> {
    try {
      // Préparer les données pour Supabase
      const updateData: any = {};

      if (data.username !== undefined) {
        updateData.username = data.username;
      }

      if (data.avatarUrl !== undefined) {
        updateData.avatar_url = data.avatarUrl;
      }

      const { data: userData, error } = await this.supabase.auth.updateUser({
        data: updateData,
      });

      if (error) {
        this.handleSupabaseError(error);
      }

      if (!userData.user) {
        throw AuthError.unknown(
          new Error('No user returned after profile update')
        );
      }

      return this.mapSupabaseUserToDomain(userData.user);
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      this.handleSupabaseError(error);
    }
  }

  async deleteAccount(): Promise<void> {
    try {
      // Récupérer l'utilisateur actuel
      const { data: { user }, error: getUserError } = await this.supabase.auth.getUser();

      if (getUserError) {
        this.handleSupabaseError(getUserError);
      }

      if (!user) {
        throw AuthError.userNotFound();
      }

      // Supprimer l'utilisateur via l'admin API
      // Note: Supabase ne permet pas de supprimer directement depuis le client
      // Il faut utiliser une fonction serveur ou l'API admin
      const { error } = await this.supabase.rpc('delete_user');

      if (error) {
        this.handleSupabaseError(error);
      }

      // Déconnexion après suppression
      await this.signOut();
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      this.handleSupabaseError(error);
    }
  }
}

