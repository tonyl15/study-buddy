import { useState, useCallback } from "react";
import { Tracker, generateId, getMondayOfWeek, StudyLogEntry } from "@/types/tracker";

const STORAGE_KEY = "study-trackers";

function loadTrackers(): Tracker[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTrackers(trackers: Tracker[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trackers));
}

export function useTrackers() {
  const [trackers, setTrackers] = useState<Tracker[]>(loadTrackers);

  const persist = useCallback((next: Tracker[]) => {
    setTrackers(next);
    saveTrackers(next);
  }, []);

  const createTracker = useCallback(
    (
      name: string,
      mode: "standard" | "uni",
      goalHours: number,
      subjects: { name: string; goalHours: number }[]
    ) => {
      const tracker: Tracker = {
        id: generateId(),
        name,
        mode,
        goalHours,
        subjects,
        startDate: getMondayOfWeek(new Date()),
        logs: [],
        createdAt: new Date().toISOString(),
      };
      const next = [...loadTrackers(), tracker];
      persist(next);
      return tracker;
    },
    [persist]
  );

  const deleteTracker = useCallback(
    (id: string) => {
      persist(loadTrackers().filter((t) => t.id !== id));
    },
    [persist]
  );

  const addLog = useCallback(
    (trackerId: string, log: StudyLogEntry) => {
      const all = loadTrackers();
      const next = all.map((t) =>
        t.id === trackerId ? { ...t, logs: [...t.logs, log] } : t
      );
      persist(next);
    },
    [persist]
  );

  const updateLog = useCallback(
    (trackerId: string, logId: string, updates: Partial<Pick<StudyLogEntry, "startTime" | "endTime">>) => {
      const all = loadTrackers();
      const next = all.map((t) =>
        t.id === trackerId
          ? {
              ...t,
              logs: t.logs.map((l) =>
                l.id === logId ? { ...l, ...updates } : l
              ),
            }
          : t
      );
      persist(next);
    },
    [persist]
  );

  const deleteLog = useCallback(
    (trackerId: string, logId: string) => {
      const all = loadTrackers();
      const next = all.map((t) =>
        t.id === trackerId
          ? { ...t, logs: t.logs.filter((l) => l.id !== logId) }
          : t
      );
      persist(next);
    },
    [persist]
  );

  const refresh = useCallback(() => {
    setTrackers(loadTrackers());
  }, []);

  return { trackers, createTracker, deleteTracker, addLog, updateLog, deleteLog, refresh };
}
