import React from 'react';
import Image from 'next/image';

interface OAuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  provider: 'google' | 'pinterest';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function OAuthButton({
  provider,
  className = '',
  children,
  style: customStyle,
  ...props
}: OAuthButtonProps) {
  const getStyleObject = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '10px',
      gap: '10px',
      backgroundColor: '#FFFFFF',
      border: '2px solid #000000',
      boxShadow: '4px 4px 0px #000000',
      borderRadius: '12px',
      outline: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'Heebo, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontStyle: 'normal',
      fontWeight: 500,
      fontSize: '16px',
      lineHeight: '23px',
      color: '#0D0D0D',
      ...customStyle,
    };

    return baseStyle;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    target.style.transform = 'translate(2px, 2px)';
    target.style.boxShadow = '2px 2px 0px 0px rgba(13,13,13,1)';
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    target.style.transform = 'translate(0, 0)';
    target.style.boxShadow = '4px 4px 0px 0px rgba(13,13,13,1)';
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    target.style.backgroundColor = '#F5F5F5';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    target.style.transform = 'translate(0, 0)';
    target.style.boxShadow = '4px 4px 0px 0px rgba(13,13,13,1)';
    target.style.backgroundColor = 'white';
  };

  const renderIcon = () => {
    const iconSrc = provider === 'google' ? '/Google.svg' : '/Pinterest.svg';

    return (
      <Image
        src={iconSrc}
        alt={`${provider} icon`}
        width={28}
        height={28}
        draggable={false}
      />
    );
  };

  return (
    <button
      style={getStyleObject()}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      {...props}
    >
      {renderIcon()}
      {children}
    </button>
  );
}
