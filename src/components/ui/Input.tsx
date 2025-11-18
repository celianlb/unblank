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

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block w-full text-base leading-[23px] font-medium text-[#0D0D0D] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative w-full">
        <input
          type={inputType}
          className="
            w-full h-[54px] px-4 py-1.5
            bg-white border-2 border-black rounded-xl
            font-medium text-base leading-[23px]
            text-[#0D0D0D] placeholder:text-[rgba(13,13,13,0.5)]
            outline-none
            focus:ring-2 focus:ring-[#202AED] focus:ring-offset-0
          "
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="
              absolute right-4 top-1/2 -translate-y-1/2
              bg-transparent border-none cursor-pointer p-1
              flex items-center justify-center text-[#0D0D0D]
              hover:opacity-70 transition-opacity
            "
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
      {error && (
        <div className="text-sm text-[#FF2F2F] mt-2">
          {error}
        </div>
      )}
    </div>
  );
}
