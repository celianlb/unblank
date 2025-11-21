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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { getCurrentSession } = useAuth();

  const fetchSession = async () => {
    try {
      setLoading(true);
      const currentSession = await getCurrentSession();
      setSession(currentSession);
    } catch (error) {
      console.error('Error fetching session:', error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
