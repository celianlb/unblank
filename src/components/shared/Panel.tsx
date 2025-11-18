import React from "react";

interface PanelProps {
  children: React.ReactNode;
  variant?: "blue" | "white";
  className?: string;
  style?: React.CSSProperties;
}

export const Panel: React.FC<PanelProps> = ({
  children,
  variant = "white",
  className = "",
  style,
}) => {
  const bgColor = variant === "blue" ? "bg-[#202AED]" : "bg-white";

  return (
    <div
      className={`
        ${bgColor} rounded-[14px]
        flex flex-col items-center
        ${className}
      `}
      style={style}
    >
      {children}
    </div>
  );
};
