'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui';
import { UserSession } from '@/domain/auth/models';
import { sendLogoutToExtension } from '@/lib/extension/extensionBridge';

export default function DashboardPage() {
  const router = useRouter();
  const { signOut, getCurrentSession, isLoading } = useAuth();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      setLoadingSession(true);
      const currentSession = await getCurrentSession();
      
      if (!currentSession) {
        // Pas de session, redirection vers login
        router.push('/login');
      } else {
        setSession(currentSession);
      }
      setLoadingSession(false);
    };

    fetchSession();
  }, [getCurrentSession, router]);

  const handleLogout = async () => {
    // Send logout signal to extension first
    await sendLogoutToExtension();
    
    // Then logout from SaaS
    await signOut();
  };

  if (loadingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-[#FEF8EE]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#202AED] mb-4"></div>
          <p className="text-lg text-[#0D0D0D]">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Redirection en cours
  }

  return (
    <div className="min-h-screen w-full bg-[#FEF8EE] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white border-4 border-black rounded-[24px] p-8 shadow-[6px_6px_0px_#000000] mb-8">
          <h1 className="text-4xl font-extrabold text-[#0D0D0D] mb-2">
            Dashboard
          </h1>
          <p className="text-lg text-[#0D0D0D] opacity-70">
            Bienvenue sur votre espace personnel
          </p>
        </div>

        {/* État de connexion */}
        <div className="bg-white border-4 border-black rounded-[24px] p-8 shadow-[6px_6px_0px_#000000] mb-8">
          <h2 className="text-2xl font-bold text-[#0D0D0D] mb-6">
            État de connexion
          </h2>

          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-lg font-medium text-[#0D0D0D]">
                Connecté
              </span>
            </div>

            {/* Email */}
            <div className="bg-[#FEF8EE] border-2 border-black rounded-xl p-4">
              <p className="text-sm font-medium text-[#0D0D0D] opacity-70 mb-1">
                Email
              </p>
              <p className="text-lg font-medium text-[#0D0D0D]">
                {session.user.email}
              </p>
            </div>

            {/* User ID */}
            <div className="bg-[#FEF8EE] border-2 border-black rounded-xl p-4">
              <p className="text-sm font-medium text-[#0D0D0D] opacity-70 mb-1">
                ID Utilisateur
              </p>
              <p className="text-sm font-mono text-[#0D0D0D] break-all">
                {session.user.id}
              </p>
            </div>

            {/* Date de création */}
            <div className="bg-[#FEF8EE] border-2 border-black rounded-xl p-4">
              <p className="text-sm font-medium text-[#0D0D0D] opacity-70 mb-1">
                Compte créé le
              </p>
              <p className="text-lg font-medium text-[#0D0D0D]">
                {new Date(session.user.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {/* Token expiration */}
            <div className="bg-[#FEF8EE] border-2 border-black rounded-xl p-4">
              <p className="text-sm font-medium text-[#0D0D0D] opacity-70 mb-1">
                Session expire le
              </p>
              <p className="text-lg font-medium text-[#0D0D0D]">
                {new Date(session.expiresAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white border-4 border-black rounded-[24px] p-8 shadow-[6px_6px_0px_#000000]">
          <h2 className="text-2xl font-bold text-[#0D0D0D] mb-6">Actions</h2>
          
          <Button
            variant="primary"
            size="md"
            onClick={handleLogout}
            disabled={isLoading}
            className="shadow-[3px_3px_0px_#000000]"
          >
            {isLoading ? 'Déconnexion...' : 'Se déconnecter'}
          </Button>
        </div>
      </div>
    </div>
  );
}

