'use client';

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileMenu({ isOpen, onClose }: ProfileMenuProps) {
  if (!isOpen) return null;

  const handleLogout = () => {
    // TODO: Logique de déconnexion
    console.log('Déconnexion');
    onClose();
  };

  return (
    <>
      {/* Overlay invisible pour fermer le menu */}
      <div
        className="fixed inset-0 z-30"
        onClick={onClose}
      />

      {/* Menu */}
      <div className="absolute top-[calc(100%+8px)] right-0 z-40 flex flex-col items-start p-2 gap-2 w-[220px] bg-[#FEF8EE] border-2 border-black rounded-xl shadow-[4px_4px_0px_#000000]">
        {/* Menu Items */}
        <button className="text-left w-full px-3 py-2.5 text-sm font-medium text-black hover:bg-white hover:bg-opacity-50 transition-colors rounded-lg cursor-pointer">
          Profil
        </button>
        <button className="text-left w-full px-3 py-2.5 text-sm font-medium text-black hover:bg-white hover:bg-opacity-50 transition-colors rounded-lg cursor-pointer">
          Compte & Sécurité
        </button>
        <button className="text-left w-full px-3 py-2.5 text-sm font-medium text-black hover:bg-white hover:bg-opacity-50 transition-colors rounded-lg cursor-pointer">
          Préférences
        </button>
        <button className="text-left w-full px-3 py-2.5 text-sm font-medium text-black hover:bg-white hover:bg-opacity-50 transition-colors rounded-lg cursor-pointer">
          Abonnement & facturation
        </button>
        <button className="text-left w-full px-3 py-2.5 text-sm font-medium text-black hover:bg-white hover:bg-opacity-50 transition-colors rounded-lg cursor-pointer">
          Données & Confidentialité
        </button>
        <button className="text-left w-full px-3 py-2.5 text-sm font-medium text-black hover:bg-white hover:bg-opacity-50 transition-colors rounded-lg cursor-pointer">
          Historique d&apos;activité
        </button>

        {/* Se déconnecter */}
        <button
          onClick={handleLogout}
          className="text-left w-full px-3 py-2.5 text-sm font-medium text-[#FF5070] hover:bg-white hover:bg-opacity-50 transition-colors rounded-lg cursor-pointer"
        >
          Se déconnecter
        </button>
      </div>
    </>
  );
}
