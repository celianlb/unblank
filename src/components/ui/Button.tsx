import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  style: customStyle,
  ...props
}: ButtonProps) {
  const getStyleObject = () => {
    const baseStyle: React.CSSProperties = {
      fontFamily: 'Heebo, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontWeight: 600,
      fontSize: '16px',
      transition: 'all 0.2s',
      outline: 'none',
      border: '2px solid #0D0D0D',
      boxShadow: '4px 4px 0px 0px rgba(13,13,13,1)',
      cursor: 'pointer',
      width: '100%',
      boxSizing: 'border-box',
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        backgroundColor: '#FF506F',
        color: '#0D0D0D',
      },
      secondary: {
        backgroundColor: 'white',
        color: '#0D0D0D',
      },
      outline: {
        backgroundColor: '#FEF8EE',
        color: '#0D0D0D',
      },
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: {
        padding: '8px 16px',
        borderRadius: '8px',
      },
      md: {
        padding: '10px 16px',
        borderRadius: '12px',
      },
      lg: {
        padding: '12px 24px',
        borderRadius: '12px',
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...customStyle,
    };
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
    if (variant === 'primary') {
      target.style.backgroundColor = '#FF6080';
    } else if (variant === 'secondary') {
      target.style.backgroundColor = '#F5F5F5';
    } else if (variant === 'outline') {
      target.style.backgroundColor = '#FFE3E8';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    target.style.transform = 'translate(0, 0)';
    target.style.boxShadow = '4px 4px 0px 0px rgba(13,13,13,1)';

    if (variant === 'primary') {
      target.style.backgroundColor = '#FF506F';
    } else if (variant === 'secondary') {
      target.style.backgroundColor = 'white';
    } else if (variant === 'outline') {
      target.style.backgroundColor = '#FEF8EE';
    }
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
      {children}
    </button>
  );
}
