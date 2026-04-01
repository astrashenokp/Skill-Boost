import React from "react";

export function Progress({
  value = 0,
  className = "",
  style,
}: {
  value?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={style}
    >
      <div
        className="h-full w-full flex-1 transition-all"
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          backgroundColor: "var(--progress-foreground, currentColor)",
        }}
      />
    </div>
  );
}
