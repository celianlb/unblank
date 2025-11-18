import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className = '',
  type,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;

  const getStyleObject = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: '6px 16px',
      gap: '10px',
      width: '560.5px',
      height: '54px',
      backgroundColor: '#FFFFFF',
      border: '2px solid #000000',
      borderRadius: '12px',
      fontFamily: 'Heebo, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontStyle: 'normal',
      fontWeight: 500,
      fontSize: '16px',
      lineHeight: '23px',
      color: 'rgba(13, 13, 13, 0.5)',
      outline: 'none',
      flex: 'none',
      order: 1,
      alignSelf: 'stretch',
      flexGrow: 0,
    };

    return baseStyle;
  };

  const labelStyle: React.CSSProperties = {
    width: '560.5px',
    height: '23px',
    fontFamily: 'Heebo, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontStyle: 'normal',
    fontWeight: 500,
    fontSize: '16px',
    lineHeight: '23px',
    color: '#0D0D0D',
    flex: 'none',
    order: 0,
    alignSelf: 'stretch',
    flexGrow: 0,
  };

  const errorStyle: React.CSSProperties = {
    fontFamily: 'Heebo, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: 400,
    fontSize: '14px',
    color: '#FF2F2F',
    marginTop: '8px',
  };

  const inputWrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
  };

  const eyeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0D0D0D',
  };

  return (
    <div className={className}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={inputWrapperStyle}>
        <input
          type={inputType}
          style={getStyleObject()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={eyeButtonStyle}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff size={24} strokeWidth={2} />
            ) : (
              <Eye size={24} strokeWidth={2} />
            )}
          </button>
        )}
      </div>
      {error && <div style={errorStyle}>{error}</div>}
    </div>
  );
}
