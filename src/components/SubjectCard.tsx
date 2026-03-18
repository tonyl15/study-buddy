import React from "react";
import { Play, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import StopwatchDisplay, { formatTime } from "./StopwatchDisplay";

interface SubjectCardProps {
  name: string;
  color: string;
  goalHours: number;
  elapsed: number;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({
  name,
  color,
  goalHours,
  elapsed,
  isRunning,
  onStart,
  onStop,
  onReset,
}) => {
  const progress = goalHours > 0 ? elapsed / (goalHours * 3600) : 0;
  const percentage = Math.min(Math.round(progress * 100), 100);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <h3 className="font-semibold text-sm text-foreground truncate">{name}</h3>
      </div>

      <div className="text-center">
        <StopwatchDisplay elapsed={elapsed} className="text-2xl text-foreground" />
        <p className="text-xs text-muted-foreground mt-1">
          Goal: {goalHours}h · {percentage}%
        </p>
      </div>

      {/* Mini progress bar */}
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        {isRunning ? (
          <Button size="sm" variant="outline" onClick={onStop} className="gap-1.5">
            <Square className="w-3 h-3" /> Stop
          </Button>
        ) : (
          <Button size="sm" onClick={onStart} className="gap-1.5">
            <Play className="w-3 h-3" /> Start
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onReset}>
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default SubjectCard;
