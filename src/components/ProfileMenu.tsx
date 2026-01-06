"use client";

import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@/lib/auth";
import { sendLogoutToExtension } from "@/lib/extension/extensionBridge";

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileMenu({ isOpen, onClose }: ProfileMenuProps) {
  const router = useRouter();
  const { refreshSession } = useAuthContext();
  const { signOut } = useAuth();

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      // Send logout signal to extension first
      await sendLogoutToExtension();

      // Then logout from SaaS
      await signOut();

      // Refresh the AuthContext to clear the session
      await refreshSession();

      onClose();

      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <>
      {/* Overlay invisible pour fermer le menu */}
      <div className="fixed inset-0 z-30" onClick={onClose} />

      {/* Menu */}
      <div className="absolute top-[calc(100%+8px)] right-0 z-40 flex flex-col items-start p-2 gap-2 w-[220px] bg-[#FEF8EE] border-2 border-black rounded-xl shadow-[4px_4px_0px_#000000]">
        {/* Menu Items */}
        <button
          onClick={() => handleNavigate("/app")}
          className="text-left px-3 py-2.5 text-sm font-medium text-black hover:bg-[#FFE3E8] transition-colors rounded-lg cursor-pointer w-full"
        >
          Accueil
        </button>
        <button
          onClick={() => handleNavigate("/profile")}
          className="text-left px-3 py-2.5 text-sm font-medium text-black hover:bg-[#FFE3E8] transition-colors rounded-lg cursor-pointer w-full"
        >
          Profil
        </button>
        <button
          onClick={() => handleNavigate("/account-security")}
          className="text-left px-3 py-2.5 text-sm font-medium text-black hover:bg-[#FFE3E8] transition-colors rounded-lg cursor-pointer w-full"
        >
          Compte & Sécurité
        </button>
        <button className="text-left px-3 py-2.5 text-sm font-medium text-black hover:bg-[#FFE3E8] transition-colors rounded-lg cursor-pointer w-full">
          Préférences
        </button>
        <button
          onClick={() => handleNavigate("/pricing")}
          className="text-left px-3 py-2.5 text-sm font-medium text-black hover:bg-[#FFE3E8] transition-colors rounded-lg cursor-pointer w-full"
        >
          Abonnement & facturation
        </button>
        <button className="text-left px-3 py-2.5 text-sm font-medium text-black hover:bg-[#FFE3E8] transition-colors rounded-lg cursor-pointer w-full">
          Données & Confidentialité
        </button>
        <button className="text-left px-3 py-2.5 text-sm font-medium text-black hover:bg-[#FFE3E8] transition-colors rounded-lg cursor-pointer w-full">
          Historique d&apos;activité
        </button>

        {/* Se déconnecter */}
        <button
          onClick={handleLogout}
          className="text-left px-3 py-2.5 text-sm font-medium text-[#FF5070] hover:bg-[#FFE3E8] transition-colors rounded-lg cursor-pointer w-full"
        >
          Se déconnecter
        </button>
      </div>
    </>
  );
}
