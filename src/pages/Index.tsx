import React, { useState } from "react";
import { useTrackers } from "@/hooks/useTrackers";
import { Tracker } from "@/types/tracker";
import TrackerList from "@/components/TrackerList";
import TrackerView from "@/components/TrackerView";

const Index = () => {
  const { trackers, createTracker, deleteTracker, addLog, updateLog, deleteLog, refresh } = useTrackers();
  const [activeTracker, setActiveTracker] = useState<Tracker | null>(null);

  // Keep activeTracker in sync with stored data
  const liveTracker = activeTracker
    ? trackers.find((t) => t.id === activeTracker.id) ?? null
    : null;

  if (liveTracker) {
    return (
      <TrackerView
        tracker={liveTracker}
        onBack={() => setActiveTracker(null)}
        onAddLog={(log) => {
          addLog(liveTracker.id, log);
          refresh();
        }}
        onUpdateLog={(logId, updates) => {
          updateLog(liveTracker.id, logId, updates);
          refresh();
        }}
        onDeleteLog={(logId) => {
          deleteLog(liveTracker.id, logId);
          refresh();
        }}
      />
    );
  }

  return (
    <TrackerList
      trackers={trackers}
      onSelect={(t) => setActiveTracker(t)}
      onCreate={(name, mode, goalHours, subjects) => {
        const t = createTracker(name, mode, goalHours, subjects);
        setActiveTracker(t);
      }}
      onDelete={deleteTracker}
    />
  );
};

export default Index;
