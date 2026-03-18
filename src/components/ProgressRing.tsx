import React from "react";

interface Segment {
  value: number; // 0-1 fraction
  color: string;
}

interface ProgressRingProps {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  segments,
  size = 280,
  strokeWidth = 8,
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // For single segment (standard mode)
  if (segments.length <= 1) {
    const progress = Math.min(segments[0]?.value ?? 0, 1);
    const offset = circumference * (1 - progress);

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={segments[0]?.color ?? "hsl(var(--primary))"}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      </div>
    );
  }

  // Multi-segment (uni mode)
  const totalGoal = segments.reduce((sum, s) => sum + 1, 0); // each segment gets equal arc
  const gapAngle = 0.02; // small gap between segments
  const totalGap = gapAngle * segments.length;
  const availableFraction = 1 - totalGap;
  const segmentFraction = availableFraction / segments.length;

  let currentOffset = 0;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
        />
        {segments.map((seg, i) => {
          const segLength = segmentFraction * circumference;
          const fillLength = segLength * Math.min(seg.value, 1);
          const dashOffset = circumference * currentOffset;
          currentOffset += segmentFraction + gapAngle;

          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${fillLength} ${circumference - fillLength}`}
              strokeDashoffset={-dashOffset}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default ProgressRing;
