'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/infra/db/supabase';

/**
 * Page de callback OAuth
 * Gère le retour depuis les providers OAuth (Google, Pinterest, etc.)
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Écoute les changements d'état d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Connexion réussie, redirection vers le dashboard
          router.push('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          // Déconnexion, retour au login
          router.push('/login');
        }
      }
    );

    // Cleanup
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[#FEF8EE]">
      <div className="text-center">
        <div className="mb-8">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#202AED]"></div>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-[#0D0D0D] mb-4">
          Connexion en cours...
        </h2>
        <p className="text-base text-[#0D0D0D] opacity-70">
          Veuillez patienter, vous serez redirigé dans un instant.
        </p>
      </div>
    </div>
  );
}

