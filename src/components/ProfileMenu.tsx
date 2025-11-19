"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { sendLogoutToExtension } from "@/lib/extension/extensionBridge";

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileMenu({ isOpen, onClose }: ProfileMenuProps) {
  const router = useRouter();
  const { signOut } = useAuth();

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      // Send logout signal to extension first
      await sendLogoutToExtension();

      // Then logout from SaaS
      await signOut();

      onClose();
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
          onClick={() => handleNavigate("/profile")}
          className="text-left px-3 py-2.5 text-sm font-medium text-black hover:bg-[#FFE3E8] transition-colors rounded-lg cursor-pointer w-fit"
        >
          Profil
        </button>
        <button className="text-left px-3 py-2.5 text-sm font-medium text-black hover:bg-[#FFE3E8] transition-colors rounded-lg cursor-pointer w-fit">
          Compte & Sécurité
        </button>
        <button className="text-left px-3 py-2.5 text-sm font-medium text-black hover:bg-[#FFE3E8] transition-colors rounded-lg cursor-pointer w-fit">
          Préférences
        </button>
        <button className="text-left px-3 py-2.5 text-sm font-medium text-black hover:bg-[#FFE3E8] transition-colors rounded-lg cursor-pointer w-fit">
          Abonnement & facturation
        </button>
        <button className="text-left px-3 py-2.5 text-sm font-medium text-black hover:bg-[#FFE3E8] transition-colors rounded-lg cursor-pointer w-fit">
          Données & Confidentialité
        </button>
        <button className="text-left px-3 py-2.5 text-sm font-medium text-black hover:bg-[#FFE3E8] transition-colors rounded-lg cursor-pointer w-fit">
          Historique d&apos;activité
        </button>

        {/* Se déconnecter */}
        <button
          onClick={handleLogout}
          className="text-left px-3 py-2.5 text-sm font-medium text-[#FF5070] hover:bg-[#FFE3E8] transition-colors rounded-lg cursor-pointer w-fit"
        >
          Se déconnecter
        </button>
      </div>
    </>
  );
}
