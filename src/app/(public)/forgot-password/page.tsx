'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { resetPassword, isLoading, error, clearError } = useAuth();

  // Récupérer l'email depuis les query params (passé depuis la page login)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage('');

    // Validation côté client
    if (!email) {
      return;
    }

    const success = await resetPassword(email);
    
    if (success) {
      setSuccessMessage(
        `Un email de réinitialisation a été envoyé à ${email}. Veuillez vérifier votre boîte mail.`
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[#FEF8EE] p-4 md:p-6 lg:p-10 overscroll-none">
      {/* Card principale */}
      <div className="w-full max-w-[570px] bg-white border-4 border-black rounded-[24px] shadow-[6px_6px_0px_#000000] p-2.5">
        {/* Formulaire */}
        <div className="flex flex-col items-center p-4 md:p-8 gap-8">
          {/* Titre */}
          <h1 className="text-3xl md:text-5xl font-extrabold text-[#0D0D0D] text-center w-full leading-tight">
            Mot de passe oublié ?
          </h1>

          <p className="text-base md:text-lg text-[#0D0D0D] text-center opacity-80">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-600 font-medium text-center w-full -mt-4">
              {error}
            </p>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="w-full bg-green-50 border-2 border-green-500 rounded-xl p-4 -mt-4">
              <p className="text-sm text-green-700 font-medium text-center">
                {successMessage}
              </p>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="w-full flex flex-col gap-8">
            {/* Email Input */}
            <div className="w-full">
              <Input
                type="email"
                label="Email"
                placeholder="Votre e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || !!successMessage}
                className="h-[66px] text-lg"
              />
            </div>

            {/* Submit Button */}
            {!successMessage && (
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isLoading}
                className="w-full h-[54px] shadow-[3px_3px_0px_#000000]"
              >
                {isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </Button>
            )}

            {/* Lien retour login */}
            <div className="w-full text-center">
              <p className="text-base md:text-lg text-[#0D0D0D]">
                Vous vous souvenez de votre mot de passe ?{' '}
                <Link
                  href="/login"
                  className="font-medium hover:opacity-70 transition-opacity"
                  style={{ textDecoration: 'underline' }}
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

