import React from "react";

interface StopwatchDisplayProps {
  elapsed: number; // seconds
  className?: string;
}

export const formatTime = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const StopwatchDisplay: React.FC<StopwatchDisplayProps> = ({ elapsed, className = "" }) => {
  return (
    <span className={`font-semibold tabular-nums tracking-tight ${className}`}>
      {formatTime(elapsed)}
    </span>
  );
};

export default StopwatchDisplay;
