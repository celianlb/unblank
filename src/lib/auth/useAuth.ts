'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthFactory from './authFactory';
import { AuthCredentials, AuthError, UserSession, OAuthProvider, SignUpData, User, UpdateProfileData } from '@/domain/auth/models';

/**
 * Hook personnalisé pour l'authentification
 * Encapsule la logique d'authentification pour React
 */
export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Load current session on mount
  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const getCurrentSessionUseCase = AuthFactory.createGetCurrentSessionUseCase();
      const currentSession = await getCurrentSessionUseCase.execute();
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
      }
    } catch (err) {
      console.error('Error loading session:', err);
    }
  };

  /**
   * Connecte un utilisateur
   */
  const signIn = useCallback(
    async (credentials: AuthCredentials): Promise<UserSession | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const signInUseCase = AuthFactory.createSignInUseCase();
        const userSession = await signInUseCase.execute(credentials);

        // Update state
        setSession(userSession);
        setUser(userSession.user);

        // Note: Redirection is now handled by the calling component
        // via useAuthContext and useEffect monitoring session state

        return userSession;
      } catch (err) {
        if (err instanceof AuthError) {
          setError(err.message);
        } else {
          setError('Une erreur inattendue s\'est produite');
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * Inscrit un nouvel utilisateur
   */
  const signUp = useCallback(
    async (data: SignUpData): Promise<UserSession | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const signUpUseCase = AuthFactory.createSignUpUseCase();
        const session = await signUpUseCase.execute(data);

        // Si pas de token d'accès, c'est que la confirmation d'email est requise
        if (!session.accessToken) {
          // Ne pas rediriger, juste retourner la session
          // La page d'inscription affichera un message
          return session;
        }

        // Note: Redirection is now handled by the calling component
        // via useAuthContext and useEffect monitoring session state

        return session;
      } catch (err) {
        if (err instanceof AuthError) {
          setError(err.message);
        } else {
          setError('Une erreur inattendue s\'est produite lors de l\'inscription');
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * Connecte un utilisateur via OAuth
   */
  const signInWithOAuth = useCallback(
    async (provider: OAuthProvider): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        // Check if coming from extension to preserve ext=true in callback
        const isFromExt = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('ext') === 'true';
        const callbackUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback${isFromExt ? '?ext=true' : ''}`;

        const signInWithOAuthUseCase = AuthFactory.createSignInWithOAuthUseCase();
        await signInWithOAuthUseCase.execute(provider, callbackUrl);
        // La redirection vers le provider OAuth se fait automatiquement
      } catch (err) {
        if (err instanceof AuthError) {
          setError(err.message);
        } else {
          setError(`Erreur lors de la connexion avec ${provider}`);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Déconnecte l'utilisateur
   */
  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const signOutUseCase = AuthFactory.createSignOutUseCase();
      await signOutUseCase.execute();

      // Clear state
      setSession(null);
      setUser(null);

      // Note: Redirection is now handled by the calling component
      // via useAuthContext refresh and useEffect monitoring session state
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erreur lors de la déconnexion');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Récupère la session actuelle
   */
  const getCurrentSession = useCallback(async (): Promise<UserSession | null> => {
    try {
      const getCurrentSessionUseCase =
        AuthFactory.createGetCurrentSessionUseCase();
      return await getCurrentSessionUseCase.execute();
    } catch (err) {
      return null;
    }
  }, []);

  /**
   * Réinitialise l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi de l\'email de réinitialisation');
      }

      return true;
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erreur lors de l\'envoi de l\'email de réinitialisation');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Met à jour le mot de passe de l'utilisateur
   */
  const updatePassword = useCallback(async (newPassword: string): Promise<boolean> => {
    console.log('[useAuth] updatePassword called');
    setIsLoading(true);
    setError(null);

    try {
      console.log('[useAuth] Creating updatePasswordUseCase...');
      const updatePasswordUseCase = AuthFactory.createUpdatePasswordUseCase();
      console.log('[useAuth] Executing updatePasswordUseCase...');
      await updatePasswordUseCase.execute(newPassword);
      console.log('[useAuth] updatePasswordUseCase executed successfully');
      return true;
    } catch (err) {
      console.error('[useAuth] updatePassword error:', err);
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erreur lors de la mise à jour du mot de passe');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Met à jour le profil de l'utilisateur
   */
  const updateProfile = useCallback(async (data: UpdateProfileData): Promise<User | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const updateProfileUseCase = AuthFactory.createUpdateProfileUseCase();
      const updatedUser = await updateProfileUseCase.execute(data);

      // Mettre à jour le state local
      setUser(updatedUser);

      return updatedUser;
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erreur lors de la mise à jour du profil');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Supprime le compte de l'utilisateur
   */
  const deleteAccount = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const deleteAccountUseCase = AuthFactory.createDeleteAccountUseCase();
      await deleteAccountUseCase.execute();

      // Clear state
      setSession(null);
      setUser(null);

      // Note: Redirection is now handled by the calling component
      // via useAuthContext refresh and useEffect monitoring session state

      return true;
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erreur lors de la suppression du compte');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    getCurrentSession,
    resetPassword,
    updatePassword,
    updateProfile,
    deleteAccount,
    isLoading,
    error,
    clearError,
    user,
    session,
  };
}

