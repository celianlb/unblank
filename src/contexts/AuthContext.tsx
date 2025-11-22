'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { UserSession } from '@/domain/auth/models';

interface AuthContextType {
  session: UserSession | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHE_KEY = 'unblank_session_cache';

export function AuthProvider({ children }: { children: ReactNode }) {
  // Toujours initialiser à null pour éviter les erreurs d'hydratation
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { getCurrentSession } = useAuth();

  const fetchSession = async () => {
    try {
      setLoading(true);
      const currentSession = await getCurrentSession();
      setSession(currentSession);

      // Mettre en cache la session
      if (currentSession) {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(currentSession));
      } else {
        sessionStorage.removeItem(CACHE_KEY);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setSession(null);
      sessionStorage.removeItem(CACHE_KEY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Charger depuis le cache d'abord (synchrone, côté client uniquement)
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        setSession(JSON.parse(cached));
      }
    } catch (error) {
      console.error('Error loading cached session:', error);
    }

    // Puis fetcher la vraie session depuis Supabase
    fetchSession();
  }, []);

  const refreshSession = async () => {
    await fetchSession();
  };

  return (
    <AuthContext.Provider value={{ session, loading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
