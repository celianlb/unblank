"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, OAuthButton } from "@/components/ui";
import { Card, Panel } from "@/components/shared";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@/lib/auth";
import { isFromExtension, sendSessionToExtension } from "@/lib/extension/extensionBridge";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Session depuis le Context (source de vérité unique)
  const { session, loading, refreshSession } = useAuthContext();

  // Actions depuis useAuth
  const { signIn, signInWithOAuth, isLoading, error, clearError } = useAuth();

  const fromExtension = isFromExtension();

  // Get redirect parameter (for share links)
  const redirectTo = searchParams.get("redirect");

  // Check if user is already authenticated
  useEffect(() => {
    if (!loading && session) {
      if (fromExtension) {
        // Coming from extension: send session and close tab
        sendSessionToExtension({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          expiresAt: session.expiresAt,
          userId: session.user.id,
          email: session.user.email,
        });
      } else {
        // Regular access: redirect to app or to the share link
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.push('/app');
        }
      }
    }
  }, [loading, session, fromExtension, redirectTo, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validation côté client
    if (!email || !password) {
      return;
    }

    const result = await signIn({ email, password });

    // If login successful, refresh the AuthContext
    if (result) {
      await refreshSession();

      // If coming from extension, send session
      if (fromExtension) {
        sendSessionToExtension({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresAt: result.expiresAt,
          userId: result.user.id,
          email: result.user.email,
        });
      }
      // Note: Redirection (including share redirect) is handled by useEffect monitoring session
    }
  };

  const handleRegisterClick = () => {
    router.push("/register");
  };

  const handleGoogleLogin = async () => {
    clearError();
    // If there's a redirect parameter, store it in localStorage for OAuth callback
    if (redirectTo) {
      localStorage.setItem("oauth_redirect", redirectTo);
    }
    await signInWithOAuth("google");
  };

  const handlePinterestLogin = async () => {
    clearError();
    // If there's a redirect parameter, store it in localStorage for OAuth callback
    if (redirectTo) {
      localStorage.setItem("oauth_redirect", redirectTo);
    }
    await signInWithOAuth("pinterest");
  };

  const handleForgotPassword = () => {
    // Passer l'email en query param si renseigné (UX cool!)
    if (email) {
      router.push(`/forgot-password?email=${encodeURIComponent(email)}`);
    } else {
      router.push("/forgot-password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-[#FEF8EE] p-4 md:p-6 lg:p-10 overscroll-none">
      <Card className="w-full max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-2.5">
        {/* Left Panel - Blue with Logo and Mascot */}
          <Panel
            variant="blue"
            className="w-full lg:w-1/2 py-8 lg:py-[50px] px-2.5 gap-4 lg:gap-2.5 min-h-[400px] lg:min-h-[702px] relative isolate"
          >
          {/* Logo UnBlank */}
            <div className="w-full max-w-[412px] mx-auto">
          <Image
            src="/unblank-white.svg"
            alt="UnBlank"
                width={412}
            height={72}
            priority
            draggable={false}
                className="w-full h-auto"
          />
            </div>

          {/* Mascot */}
            <div className="flex-1 flex items-end justify-center w-full max-w-[384px] mx-auto mt-8 lg:mt-[95px]">
          <Image
            src="/mascott.svg"
            alt="UnBlank Mascot"
            width={384}
            height={460}
            priority
            draggable={false}
                className="w-full h-auto max-h-[460px] object-contain"
          />
        </div>
          </Panel>

        {/* Right Panel - Login Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-6 lg:p-8">
            <div className="w-full max-w-[560px] flex flex-col gap-6 md:gap-8">
              {/* Title */}
              <h1 className="text-3xl md:text-[42px] font-extrabold leading-[0.9] text-[#0D0D0D] font-['Area_Inktrap',_Heebo,_sans-serif] text-center">
                Bienvenue sur UnBlank
              </h1>

            {/* Email Input */}
              <div className="flex flex-col gap-1.5">
              <Input
                type="email"
                label="Email"
                placeholder="Votre e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                  disabled={isLoading}
              />
            </div>

            {/* Password Input + Forgot Password */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                <Input
                  type="password"
                  label="Mot de passe"
                  placeholder="***********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                    disabled={isLoading}
                />
                  {error && (
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  )}
              </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-base leading-[23px] tracking-[-0.03em] text-[#0D0D0D] hover:opacity-70 transition-opacity w-fit cursor-pointer bg-transparent border-none p-0"
                  style={{ textDecoration: "underline" }}
                >
                Mot de passe oublié ?
                </button>
            </div>

            {/* Login Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                onClick={handleLogin}
                className="w-full h-[54px] shadow-[3px_3px_0px_#000000]"
                disabled={isLoading}
              >
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </Button>

            {/* Divider */}
              <div className="flex items-center justify-center gap-8 w-full">
                <div className="flex-1 h-0 border-t border-black" />
                <span className="text-base leading-[23px] tracking-[-0.03em] text-[#0D0D0D]">
                  ou
                </span>
                <div className="flex-1 h-0 border-t border-black" />
            </div>

            {/* OAuth Buttons */}
              <div className="flex flex-col gap-3.5 w-full">
                {/* Sign Up Button */}
              <Button
                variant="outline"
                size="md"
                  onClick={handleRegisterClick}
                  className="w-full h-[54px] bg-[#FEF8EE] shadow-[3px_3px_0px_#000000]"
                  disabled={isLoading}
              >
                  S&apos;inscrire
              </Button>

                {/* OAuth Buttons Row */}
                <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                <OAuthButton
                  provider="google"
                  onClick={handleGoogleLogin}
                    className="flex-1 min-h-[90px]"
                  >
                    <span className="hidden sm:inline">
                  Continuer avec Google
                    </span>
                    <span className="sm:hidden">Google</span>
                </OAuthButton>

                <OAuthButton
                  provider="pinterest"
                  onClick={handlePinterestLogin}
                    className="flex-1 min-h-[90px]"
                  >
                    <span className="hidden sm:inline">
                  Se connecter avec Pinterest
                    </span>
                    <span className="sm:hidden">Pinterest</span>
                </OAuthButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
