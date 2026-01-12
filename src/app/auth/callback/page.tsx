'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/infra/db/supabase';
import { isFromExtension, sendSessionToExtension } from '@/lib/extension/extensionBridge';

/**
 * Page de callback OAuth
 * Gère le retour depuis les providers OAuth (Google, Pinterest, etc.)
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const fromExtension = isFromExtension();

  useEffect(() => {
    // Écoute les changements d'état d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Connexion réussie
          if (fromExtension) {
            // Coming from extension: send session and close tab
            // Note: session.expires_at is in seconds, convert to milliseconds
            await sendSessionToExtension({
              accessToken: session.access_token,
              refreshToken: session.refresh_token || '',
              expiresAt: (session.expires_at || 0) * 1000, // Convert to milliseconds
              userId: session.user.id,
              email: session.user.email || '',
            });
          } else {
            // Check if there's a redirect from OAuth flow (share link)
            const oauthRedirect = typeof window !== 'undefined'
              ? localStorage.getItem('oauth_redirect')
              : null;

            if (oauthRedirect) {
              // Clear the stored redirect
              localStorage.removeItem('oauth_redirect');
              // Redirect to the share link
              router.push(oauthRedirect);
            } else {
              // Check if user has completed onboarding
              const { data: userData } = await supabase
                .from('users')
                .select('onboarding_completed')
                .eq('id', session.user.id)
                .single();

              // Redirect to onboarding if not completed, otherwise to app
              if (userData && !userData.onboarding_completed) {
                router.push('/onboarding');
              } else {
                router.push('/app');
              }
            }
          }
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
  }, [router, fromExtension]);

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[#FEF8EE]">
      <h2 className="text-2xl md:text-3xl font-bold text-[#0D0D0D]">
          Connexion en cours...
        </h2>
    </div>
  );
}

