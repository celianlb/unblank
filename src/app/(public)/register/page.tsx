"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import {
  isFromExtension,
  sendSessionToExtension,
} from "@/lib/extension/extensionBridge";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { signUp, isLoading, error, clearError, user, session } = useAuth();
  const fromExtension = isFromExtension();

  // Check if user is already authenticated
  useEffect(() => {
    if (user && session && session.accessToken) {
      if (fromExtension) {
        // Coming from extension: send session and close tab
        sendSessionToExtension({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          expiresAt: session.expiresAt,
          userId: user.id,
          email: user.email,
        });
      } else {
        // Regular access: redirect to dashboard
        router.push("/dashboard");
      }
    }
  }, [fromExtension, user, session, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage("");

    // Validation côté client
    if (!email || !password) {
      return;
    }

    const userSession = await signUp({
      email,
      password,
      username: username || undefined,
    });

    // Si pas de token, c'est que l'email de confirmation est requis
    if (userSession && !userSession.accessToken) {
      setSuccessMessage(
        `Compte créé avec succès ! Un email de confirmation a été envoyé à ${email}. Veuillez vérifier votre boîte mail.`
      );
    } else if (userSession && fromExtension) {
      // If registration successful with immediate session and coming from extension, send session
      sendSessionToExtension({
        accessToken: userSession.accessToken,
        refreshToken: userSession.refreshToken,
        expiresAt: userSession.expiresAt,
        userId: userSession.user.id,
        email: userSession.user.email,
      });
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
            Créer votre compte
          </h1>

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

          <form
            onSubmit={handleRegister}
            className="w-full flex flex-col gap-8"
          >
            {/* Pseudo Input */}
            <div className="w-full">
              <Input
                type="text"
                label="Pseudo"
                placeholder="Votre pseudo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="h-[66px] text-lg"
              />
            </div>

            {/* Email Input */}
            <div className="w-full">
              <Input
                type="email"
                label="Email"
                placeholder="Votre e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-[66px] text-lg"
              />
            </div>

            {/* Password Input */}
            <div className="w-full">
              <Input
                type="password"
                label="Mot de passe"
                placeholder="***********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-[66px] text-lg"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading}
              className="w-full h-[54px] shadow-[3px_3px_0px_#000000] bg-[#FF6B6B] hover:bg-[#FF5252] border-2 border-black"
            >
              {isLoading ? "Création du compte..." : "Créer mon compte"}
            </Button>

            {/* Lien vers login */}
            <div className="w-full text-center pt-4">
              <p className="text-base md:text-lg text-[#0D0D0D]">
                Vous avez déjà un compte ?{" "}
                <Link
                  href="/login"
                  className="font-medium hover:opacity-70 transition-opacity"
                  style={{ textDecoration: "underline" }}
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
