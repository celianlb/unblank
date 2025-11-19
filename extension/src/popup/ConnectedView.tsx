import { useState, useEffect } from "react";
import { X, LogOut } from "lucide-react";
import { Button } from "../components/Button";
import { getSession, clearSession } from "../utils/auth";

interface ConnectedViewProps {
  onLogout: () => void;
}

function ConnectedView({ onLogout }: ConnectedViewProps) {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    const session = await getSession();
    if (session) {
      setEmail(session.email);
    }
  };

  const handleOpenWebApp = () => {
    window.open("http://localhost:3000/dashboard", "_blank");
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await clearSession();
      onLogout();
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    window.close();
  };

  return (
    <div className="w-[420px] bg-[#FFF5EB] p-6 rounded-2xl border-2 border-[#0D0D0D] shadow-[8px_8px_0px_0px_rgba(13,13,13,1)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-11">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <img src="/UnBlznk.svg" alt="UnBlank" className="h-6" />
        </div>

        <div className="flex items-center gap-4">
          {/* Open Web App Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenWebApp}
            className="whitespace-nowrap"
          >
            Ouvrir l'app web
          </Button>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="w-6 h-6 flex items-center justify-center transition-colors text-[#0D0D0D] hover:text-[#FF2F2F] cursor-pointer"
            aria-label="Close"
          >
            <X className="w-6 h-6" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="mb-6">
        <p className="text-base font-medium text-[#0D0D0D] mb-2">
          Connecté en tant que
        </p>
        <p className="text-sm text-[#0D0D0D]/70">{email}</p>
      </div>

      {/* Logout Button */}
      <Button
        variant="secondary"
        size="md"
        onClick={handleLogout}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        {loading ? "Déconnexion..." : "Se déconnecter"}
      </Button>
    </div>
  );
}

export default ConnectedView;
