'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/infra/db/supabase';
import { Button } from '@/components/ui';

export default function ConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Parse URL hash for auth tokens
        const hash = window.location.hash;
        
        if (!hash || hash.length <= 1) {
          setStatus('error');
          setErrorMessage('Lien de confirmation invalide');
          return;
        }

        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        console.log('[Confirm] URL params:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type,
          error,
        });

        // Check for errors in URL
        if (error) {
          setStatus('error');
          setErrorMessage(
            errorDescription 
              ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
              : 'Une erreur est survenue lors de la confirmation'
          );
          return;
        }

        // Verify this is a signup confirmation
        if (type !== 'signup') {
          console.warn('[Confirm] Unexpected type:', type);
        }

        // Supabase should have automatically set the session from the hash
        // Let's verify it
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[Confirm] Session error:', sessionError);
          setStatus('error');
          setErrorMessage('Erreur lors de la vérification de la session');
          return;
        }

        if (!session) {
          console.error('[Confirm] No session found');
          setStatus('error');
          setErrorMessage('Session non trouvée. Veuillez vous reconnecter.');
          return;
        }

        console.log('[Confirm] Session established successfully:', {
          userId: session.user.id,
          email: session.user.email,
        });

        setStatus('success');

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/app');
        }, 3000);

      } catch (err) {
        console.error('[Confirm] Unexpected error:', err);
        setStatus('error');
        setErrorMessage('Une erreur inattendue s\'est produite');
      }
    };

    handleEmailConfirmation();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[#FEF8EE] p-4 md:p-6 lg:p-10 overscroll-none">
      {/* Card principale */}
      <div className="w-full max-w-[570px] bg-white border-4 border-black rounded-[24px] shadow-[6px_6px_0px_#000000] p-2.5">
        <div className="flex flex-col items-center p-4 md:p-8 gap-8">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 border-4 border-[#202AED] border-t-transparent rounded-full animate-spin" />
              <h1 className="text-2xl md:text-4xl font-extrabold text-[#0D0D0D] text-center">
                Vérification de votre compte...
              </h1>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h1 className="text-2xl md:text-4xl font-extrabold text-[#0D0D0D] text-center">
                Compte validé avec succès !
              </h1>

              <p className="text-base md:text-lg text-[#0D0D0D] text-center opacity-80">
                Votre adresse email a été confirmée. Vous allez être redirigé vers votre tableau de bord...
              </p>

              <Button
                variant="primary"
                size="md"
                onClick={() => router.push('/app')}
                className="w-full h-[54px] shadow-[3px_3px_0px_#000000]"
              >
                Accéder à l&apos;application
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>

              <h1 className="text-2xl md:text-4xl font-extrabold text-[#0D0D0D] text-center">
                Erreur de confirmation
              </h1>

              <p className="text-base md:text-lg text-red-600 text-center font-medium">
                {errorMessage}
              </p>

              <div className="w-full flex flex-col gap-4">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => router.push('/register')}
                  className="w-full h-[54px] shadow-[3px_3px_0px_#000000]"
                >
                  Retour à l'inscription
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => router.push('/login')}
                  className="w-full h-[54px] shadow-[3px_3px_0px_#000000]"
                >
                  Se connecter
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

