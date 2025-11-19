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

  if (loadingSession || !session) {
    return null; // Chargement ou redirection en cours
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

