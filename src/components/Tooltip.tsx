"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

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
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const isTop = position === "top";

      setTooltipPosition({
        top: isTop ? rect.top - 8 : rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    }
  };

  const handleMouseEnter = () => {
    updatePosition();
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  if (disabled) {
    return <>{children}</>;
  }

  const isTop = position === "top";

  const tooltipContent = mounted && isVisible ? createPortal(
    <div
      style={{
        position: "fixed",
        top: tooltipPosition.top,
        left: tooltipPosition.left,
        transform: `translate(-50%, ${isTop ? "-100%" : "0"})`,
        zIndex: 9999,
      }}
      className="px-3 py-2 bg-black text-white text-sm rounded-lg pointer-events-none font-[Heebo] max-w-[280px] w-max text-center"
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
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        className={`inline-block ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {tooltipContent}
    </>
  );
}
