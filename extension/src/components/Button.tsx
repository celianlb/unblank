import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-medium transition-all focus:outline-none border-2 border-[#0D0D0D] shadow-[4px_4px_0px_0px_rgba(13,13,13,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(13,13,13,1)]';

  const variantStyles = {
    primary: 'bg-[#FF5070] text-[#0D0D0D] hover:bg-[#FF6080]',
    secondary: 'bg-white text-[#0D0D0D] hover:bg-[#F5F5F5]',
    outline: 'bg-[#FFF5EB] text-[#0D0D0D] hover:bg-[#FFEFD9]',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-base rounded-xl',
    lg: 'px-6 py-3 text-lg rounded-xl',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
