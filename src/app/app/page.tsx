"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Header from "@/components/Header";
import { UserSession } from "@/domain/auth/models";

export default function AppPage() {
  const router = useRouter();
  const { getCurrentSession } = useAuth();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      setLoadingSession(true);
      const currentSession = await getCurrentSession();

      if (!currentSession) {
        // Pas de session, redirection vers login
        router.push("/login");
      } else {
        setSession(currentSession);
      }
      setLoadingSession(false);
    };

    fetchSession();
  }, [getCurrentSession, router]);

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
    <div className="min-h-screen w-full bg-white">
      <Header />

      <main className="w-full p-8">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard content à venir */}
        </div>
      </main>
    </div>
  );
}

