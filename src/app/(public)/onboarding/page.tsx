'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/infra/db/supabase';
import { OnboardingFlow } from '@/components/onboarding';

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // Pas connecté, rediriger vers login
          router.push('/login');
          return;
        }

        // Vérifier si l'onboarding est déjà complété
        const { data: userData, error } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('[Onboarding] Error checking status:', error);
          // En cas d'erreur, afficher l'onboarding quand même
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        if (userData?.onboarding_completed) {
          // Onboarding déjà complété, rediriger vers app
          router.push('/app');
          return;
        }

        // Utilisateur authentifié et onboarding non complété
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (err) {
        console.error('[Onboarding] Unexpected error:', err);
        router.push('/login');
      }
    };

    checkAuthAndOnboarding();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-[#FEF8EE]">
        <div className="w-16 h-16 border-4 border-[#202AED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <OnboardingFlow />;
}
