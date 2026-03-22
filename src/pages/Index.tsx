import React, { useState } from "react";
import { useTrackers } from "@/hooks/useTrackers";
import { Tracker } from "@/types/tracker";
import TrackerList from "@/components/TrackerList";
import TrackerView from "@/components/TrackerView";
import StudyCoach from "@/components/StudyCoach";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles } from "lucide-react";

const Index = () => {
  const { trackers, loading, createTracker, deleteTracker, addLog, updateLog, deleteLog, refresh } = useTrackers();
  const { signOut, user } = useAuth();
  const [activeTrackerId, setActiveTrackerId] = useState<string | null>(null);
  const [showCoach, setShowCoach] = useState(false);

  const liveTracker = activeTrackerId
    ? trackers.find((t) => t.id === activeTrackerId) ?? null
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading your trackers...</p>
      </div>
    );
  }

  if (showCoach) {
    return <StudyCoach trackers={trackers} onBack={() => setShowCoach(false)} />;
  }

  if (liveTracker) {
    return (
      <TrackerView
        tracker={liveTracker}
        onBack={() => setActiveTrackerId(null)}
        onAddLog={(log) => addLog(liveTracker.id, log)}
        onUpdateLog={(logId, updates) => updateLog(liveTracker.id, logId, updates)}
        onDeleteLog={(logId) => deleteLog(liveTracker.id, logId)}
      />
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCoach(true)}
          className="gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Study Coach
        </Button>
        <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
        <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
      <TrackerList
        trackers={trackers}
        onSelect={(t) => setActiveTrackerId(t.id)}
        onCreate={async (name, mode, goalHours, subjects) => {
          const t = await createTracker(name, mode, goalHours, subjects);
          if (t) setActiveTrackerId(t.id);
        }}
        onDelete={deleteTracker}
      />
    </div>
  );
};

export default Index;
