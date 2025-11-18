import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`
        bg-white border-4 border-black rounded-[24px] p-[6px]
        shadow-[6px_6px_0px_#000000]
        ${className}
      `}
    >
      {children}
    </div>
  );
};

