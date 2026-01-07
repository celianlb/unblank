"use client";

import { ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  content: string;
  disabled?: boolean;
  position?: "top" | "bottom";
  className?: string;
}

export default function Tooltip({
  children,
  content,
  disabled = false,
  position = "top",
  className = "",
}: TooltipProps) {
  if (disabled) {
    return <>{children}</>;
  }

  const isTop = position === "top";

  return (
    <div className={`relative group inline-block ${className}`}>
      {children}
      <div
        className={`absolute ${
          isTop ? "bottom-full mb-2" : "top-full mt-2"
        } left-1/2 -translate-x-1/2 px-3 py-2 bg-black text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 font-[Heebo] max-w-[280px] w-max text-center`}
      >
        {content}
        {/* Arrow */}
        <div
          className={`absolute ${
            isTop ? "top-full" : "bottom-full"
          } left-1/2 -translate-x-1/2 ${isTop ? "-mt-px" : "-mb-px"}`}
        >
          <div
            className={`border-4 border-transparent ${
              isTop ? "border-t-black" : "border-b-black"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
