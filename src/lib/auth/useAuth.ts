'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthFactory from './authFactory';
import { AuthCredentials, AuthError, UserSession, OAuthProvider, SignUpData, User } from '@/domain/auth/models';

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
        setUser({
          id: currentSession.userId,
          email: currentSession.email,
        });
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
        setUser({
          id: userSession.userId,
          email: userSession.email,
        });

        // Redirection après connexion réussie
        router.push('/dashboard');

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

        // Redirection après inscription réussie (si session complète)
        router.push('/dashboard');

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
        const signInWithOAuthUseCase = AuthFactory.createSignInWithOAuthUseCase();
        await signInWithOAuthUseCase.execute(
          provider,
          `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`
        );
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

      // Redirection après déconnexion
      router.push('/login');
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erreur lors de la déconnexion');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

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
      const resetPasswordUseCase = AuthFactory.createResetPasswordUseCase();
      await resetPasswordUseCase.execute(email);
      return true;
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Erreur lors de l\'envoi de l\'email de réinitialisation');
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
    isLoading,
    error,
    clearError,
    user,
    session,
  };
}

