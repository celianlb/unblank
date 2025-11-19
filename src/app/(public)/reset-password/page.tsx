"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/infra/db/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const [linkError, setLinkError] = useState("");
  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const { updatePassword, isLoading, error, clearError } = useAuth();

  useEffect(() => {
    // Clear any previous errors when component mounts
    clearError();

    const verifyRecoveryToken = async () => {
      setIsVerifyingToken(true);

      // Check for errors or auth tokens in URL hash (from Supabase redirect)
      const hash = window.location.hash;
      
      // If no hash, check if user has a session
      if (!hash || hash.length <= 1) {
        console.log('[Reset Password] No hash found, checking for existing session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('[Reset Password] No session found, redirecting to forgot-password');
          router.push('/forgot-password');
          return;
        }
        
        console.log('[Reset Password] Session found, allowing password reset');
        setIsVerifyingToken(false);
        return;
      }

      const params = new URLSearchParams(hash.substring(1)); // Remove the '#'
      const errorParam = params.get('error');
      const errorDescription = params.get('error_description');
      const errorCode = params.get('error_code');
      const type = params.get('type');

      if (errorParam) {
        // Map error codes to user-friendly messages
        let errorMessage = "Une erreur s'est produite";

        if (errorCode === 'otp_expired' || errorDescription?.includes('expired')) {
          errorMessage = "Le lien de réinitialisation a expiré. Veuillez demander un nouveau lien.";
        } else if (errorDescription?.includes('invalid')) {
          errorMessage = "Le lien de réinitialisation est invalide. Veuillez demander un nouveau lien.";
        } else if (errorDescription) {
          errorMessage = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
        }

        setLinkError(errorMessage);
        setIsVerifyingToken(false);
        return;
      }

      // If type is recovery, Supabase should have automatically set the session
      if (type === 'recovery') {
        console.log('[Reset Password] Recovery token detected, verifying session...');
        
        // Verify that the session was established
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('[Reset Password] Session not established after recovery');
          setLinkError("Le lien de réinitialisation n'a pas pu être validé. Veuillez réessayer.");
        } else {
          console.log('[Reset Password] Session established successfully');
        }
      }

      setIsVerifyingToken(false);
    };

    verifyRecoveryToken();
  }, [clearError, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Reset Password] Form submitted');
    clearError();
    setLocalError("");
    setSuccessMessage("");

    // Validation côté client
    if (!newPassword || !confirmPassword) {
      console.log('[Reset Password] Validation error: empty fields');
      setLocalError("Veuillez remplir tous les champs");
      return;
    }

    if (newPassword !== confirmPassword) {
      console.log('[Reset Password] Validation error: passwords do not match');
      setLocalError("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 6) {
      console.log('[Reset Password] Validation error: password too short');
      setLocalError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    console.log('[Reset Password] Calling updatePassword...');
    const success = await updatePassword(newPassword);
    console.log('[Reset Password] updatePassword result:', success);

    if (success) {
      console.log('[Reset Password] Password updated successfully');
      setSuccessMessage("Mot de passe mis à jour avec succès !");
      // Redirection après 2 secondes
      setTimeout(() => {
        router.push("/app");
      }, 2000);
    } else {
      console.error('[Reset Password] Password update failed');
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
            Réinitialiser votre mot de passe
          </h1>

          {/* Description */}
          {!linkError && (
            <p className="text-base text-[#0D0D0D] text-center -mt-4">
              {isVerifyingToken 
                ? "Vérification du lien de réinitialisation..."
                : "Choisissez un nouveau mot de passe sécurisé pour votre compte."}
            </p>
          )}

          {/* Link Error Message (from URL) */}
          {linkError && (
            <div className="w-full bg-red-50 border-2 border-red-500 rounded-xl p-4 -mt-4">
              <p className="text-sm text-red-700 font-medium text-center mb-2">
                {linkError}
              </p>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-sm text-red-600 font-semibold hover:opacity-70 transition-opacity underline"
                >
                  Demander un nouveau lien
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {!linkError && (error || localError) && (
            <div className="w-full bg-red-50 border-2 border-red-500 rounded-xl p-4 -mt-4">
              <p className="text-sm text-red-700 font-medium text-center">
                {error || localError}
              </p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="w-full bg-green-50 border-2 border-green-500 rounded-xl p-4 -mt-4">
              <p className="text-sm text-green-700 font-medium text-center">
                {successMessage}
              </p>
              <p className="text-xs text-green-600 text-center mt-1">
                Redirection vers le dashboard...
              </p>
            </div>
          )}

          {/* Formulaire - Affiché uniquement si pas d'erreur de lien et token vérifié */}
          {!linkError && !isVerifyingToken && (
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-8">
              {/* Nouveau mot de passe */}
              <Input
                type="password"
                label="Nouveau mot de passe"
                placeholder="Minimum 6 caractères"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading || !!successMessage}
                className="h-[66px]"
              />

              {/* Confirmer mot de passe */}
              <Input
                type="password"
                label="Confirmer le mot de passe"
                placeholder="Retapez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading || !!successMessage}
                className="h-[66px]"
              />

              {/* Submit Button */}
              <div className="pt-0">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full h-[54px] shadow-[3px_3px_0px_#000000]"
                  disabled={isLoading || !!successMessage}
                >
                  {isLoading
                    ? "Mise à jour..."
                    : successMessage
                    ? "Mot de passe mis à jour ✓"
                    : "Mettre à jour le mot de passe"}
                </Button>
              </div>

              {/* Lien retour connexion */}
              <div className="pt-4 text-center">
                <p className="text-base leading-[23px] tracking-[-0.03em] text-[#0D0D0D]">
                  Vous vous souvenez de votre mot de passe ?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="font-semibold hover:opacity-70 transition-opacity underline"
                    disabled={isLoading}
                  >
                    Se connecter
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

