import { X } from 'lucide-react';
import { Button } from '../components/Button';

function App() {
  const handleOpenWebApp = () => {
    // TODO: Open web app URL
    window.open('https://unblank.app', '_blank');
  };

  const handleLogin = () => {
    // TODO: Implement login logic
    console.log('Login clicked');
  };

  const handleSignup = () => {
    // TODO: Implement signup logic
    console.log('Signup clicked');
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
          <img
            src="/UnBlznk.svg"
            alt="UnBlank"
            className="h-6"
          />
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
            className="w-6 h-6 flex items-center justify-center transition-colors text-[#0D0D0D] hover:text-[#FF2F2F]"
            aria-label="Close"
          >
            <X className="w-6 h-6" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          variant="primary"
          size="md"
          onClick={handleLogin}
          className="flex-1"
        >
          Se connecter
        </Button>

        <Button
          variant="secondary"
          size="md"
          onClick={handleSignup}
          className="flex-1"
        >
          Créer un compte
        </Button>
      </div>
    </div>
  );
}

export default App;
