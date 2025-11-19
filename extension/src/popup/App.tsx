import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../components/Button';
import { isAuthenticated } from '../utils/auth';
import ConnectedView from './ConnectedView';

const SAAS_URL = 'http://localhost:3000'; // TODO: Change to production URL

function App() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuthentication();

    // Listen for auth updates from background script
    const handleMessage = (message: any) => {
      if (message.type === 'AUTH_SUCCESS') {
        setIsAuth(true);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const checkAuthentication = async () => {
    try {
      const authenticated = await isAuthenticated();
      setIsAuth(authenticated);
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuth(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleOpenWebApp = () => {
    window.open(SAAS_URL, '_blank');
  };

  const handleLogin = async () => {
    // Open SaaS login page
    const loginUrl = `${SAAS_URL}/login?ext=true`;
    const tab = await chrome.tabs.create({ url: loginUrl });

    // Listen for auth completion
    const checkInterval = setInterval(async () => {
      try {
        const authenticated = await isAuthenticated();
        if (authenticated) {
          clearInterval(checkInterval);
          setIsAuth(true);
          // Close the login tab if still open
          if (tab.id) {
            chrome.tabs.remove(tab.id).catch(() => {});
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    }, 1000);

    // Stop checking after 5 minutes
    setTimeout(() => clearInterval(checkInterval), 5 * 60 * 1000);
  };

  const handleSignup = async () => {
    // Open SaaS signup page
    const signupUrl = `${SAAS_URL}/register?ext=true`;
    const tab = await chrome.tabs.create({ url: signupUrl });

    // Listen for auth completion
    const checkInterval = setInterval(async () => {
      try {
        const authenticated = await isAuthenticated();
        if (authenticated) {
          clearInterval(checkInterval);
          setIsAuth(true);
          // Close the signup tab if still open
          if (tab.id) {
            chrome.tabs.remove(tab.id).catch(() => {});
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    }, 1000);

    // Stop checking after 5 minutes
    setTimeout(() => clearInterval(checkInterval), 5 * 60 * 1000);
  };

  const handleLogout = () => {
    setIsAuth(false);
  };

  const handleClose = () => {
    window.close();
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="w-[420px] bg-[#FFF5EB] p-6 rounded-2xl border-2 border-[#0D0D0D] shadow-[8px_8px_0px_0px_rgba(13,13,13,1)] flex items-center justify-center">
        <p className="text-[#0D0D0D]">Chargement...</p>
      </div>
    );
  }

  // Show connected view if authenticated
  if (isAuth) {
    return <ConnectedView onLogout={handleLogout} />;
  }

  // Show login/signup view if not authenticated
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
            className="w-6 h-6 flex items-center justify-center transition-colors text-[#0D0D0D] hover:text-[#FF2F2F] cursor-pointer"
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
