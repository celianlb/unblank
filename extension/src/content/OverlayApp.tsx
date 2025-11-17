import { X } from 'lucide-react';
import { Button } from '../components/Button';

interface OverlayAppProps {
  onClose: () => void;
}

function OverlayApp({ onClose }: OverlayAppProps) {
  const handleOpenWebApp = () => {
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
    onClose();
  };

  // Prevent clicks inside the card from closing the overlay
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Inline styles for complete isolation from page styles
  const cardStyle: React.CSSProperties = {
    width: '420px',
    backgroundColor: '#FEF8EE',
    padding: '24px',
    borderRadius: '16px',
    border: '2px solid #0D0D0D',
    boxShadow: '8px 8px 0px 0px rgba(13,13,13,1)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    boxSizing: 'border-box',
    pointerEvents: 'auto', // Re-enable pointer events for the card
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '44px',
  };

  const headerLeftStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  };

  const headerRightStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  };

  const logoStyle: React.CSSProperties = {
    height: '24px',
    display: 'block',
  };

  const closeButtonStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
    color: '#0D0D0D',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    padding: '0',
  };

  const buttonsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
  };

  const buttonWrapperStyle: React.CSSProperties = {
    flex: 1,
  };

  return (
    <div style={cardStyle} onClick={handleCardClick}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={headerLeftStyle}>
          {/* Logo */}
          <img
            src={chrome.runtime.getURL('UnBlznk.svg')}
            alt="UnBlank"
            style={logoStyle}
          />
        </div>

        <div style={headerRightStyle}>
          {/* Open Web App Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenWebApp}
          >
            Ouvrir l'app web
          </Button>

          {/* Close Button */}
          <button
            onClick={handleClose}
            style={closeButtonStyle}
            aria-label="Close"
            onMouseEnter={(e) => e.currentTarget.style.color = '#FF2F2F'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#0D0D0D'}
          >
            <X style={{ width: '24px', height: '24px' }} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={buttonsContainerStyle}>
        <div style={buttonWrapperStyle}>
          <Button
            variant="primary"
            size="md"
            onClick={handleLogin}
          >
            Se connecter
          </Button>
        </div>

        <div style={buttonWrapperStyle}>
          <Button
            variant="secondary"
            size="md"
            onClick={handleSignup}
          >
            Créer un compte
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OverlayApp;
