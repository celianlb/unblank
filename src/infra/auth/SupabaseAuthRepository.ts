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
   * Récupère les données depuis la table public.users
   */
  private async mapSupabaseUserToDomain(supabaseUser: any): Promise<User> {
    // Récupérer les données depuis public.users
    const { data: publicUser, error } = await this.supabase
      .from('users')
      .select('username, avatar_url, created_at, updated_at')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user from public.users:', error);
    }

    // Si l'utilisateur n'existe pas dans public.users, utiliser user_metadata comme fallback
    // Le trigger SQL devrait créer l'entrée automatiquement lors de l'inscription
    if (!publicUser) {
      console.warn('User not found in public.users, falling back to user_metadata. This might indicate the trigger did not run.');
      return {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        username: supabaseUser.user_metadata?.username || undefined,
        avatarUrl: supabaseUser.user_metadata?.avatar_url || undefined,
        createdAt: new Date(supabaseUser.created_at),
        updatedAt: supabaseUser.updated_at ? new Date(supabaseUser.updated_at) : undefined,
      };
    }

    return {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      username: publicUser.username || undefined,
      avatarUrl: publicUser.avatar_url || undefined,
      createdAt: publicUser.created_at ? new Date(publicUser.created_at) : new Date(supabaseUser.created_at),
      updatedAt: publicUser.updated_at ? new Date(publicUser.updated_at) : undefined,
    };
  }

  /**
   * Convertit une session Supabase en UserSession du domaine
   */
  private async mapSupabaseSessionToDomain(supabaseSession: any): Promise<UserSession> {
    return {
      user: await this.mapSupabaseUserToDomain(supabaseSession.user),
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

      return await this.mapSupabaseSessionToDomain(data.session);
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
          user: await this.mapSupabaseUserToDomain(data.user),
          accessToken: '',
          refreshToken: '',
          expiresAt: 0,
        };
      }

      return await this.mapSupabaseSessionToDomain(data.session);
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

      return await this.mapSupabaseSessionToDomain(data.session);
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

      return await this.mapSupabaseUserToDomain(data.user);
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

      return await this.mapSupabaseSessionToDomain(data.session);
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
      // Récupérer l'utilisateur actuel
      const { data: { user }, error: getUserError } = await this.supabase.auth.getUser();

      if (getUserError) {
        this.handleSupabaseError(getUserError);
      }

      if (!user) {
        throw AuthError.userNotFound();
      }

      // Préparer les données pour la table public.users
      const updateData: {
        updated_at: string;
        username?: string;
        avatar_url?: string;
      } = {
        updated_at: new Date().toISOString(),
      };

      if (data.username !== undefined) {
        updateData.username = data.username;
      }

      if (data.avatarUrl !== undefined) {
        updateData.avatar_url = data.avatarUrl;
      }

      // Mettre à jour dans public.users
      const { error: updateError } = await this.supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        this.handleSupabaseError(updateError);
      }

      // Retourner l'utilisateur mis à jour
      return await this.mapSupabaseUserToDomain(user);
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

