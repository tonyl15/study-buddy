import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tracker, StudyLogEntry, getMondayOfWeek } from "@/types/tracker";

export function useTrackers() {
  const { user } = useAuth();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrackers = useCallback(async () => {
    if (!user) { setTrackers([]); setLoading(false); return; }

    const { data: trackersData } = await supabase
      .from("trackers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!trackersData) { setLoading(false); return; }

    const { data: logsData } = await supabase
      .from("study_logs")
      .select("*")
      .eq("user_id", user.id);

    const logs = logsData ?? [];

    const mapped: Tracker[] = trackersData.map((t: any) => ({
      id: t.id,
      name: t.name,
      mode: t.mode as "standard" | "uni",
      goalHours: Number(t.goal_hours),
      subjects: (t.subjects as any[]) ?? [],
      startDate: t.start_date,
      logs: logs
        .filter((l: any) => l.tracker_id === t.id)
        .map((l: any) => ({
          id: l.id,
          subjectName: l.subject_name ?? undefined,
          startTime: l.start_time,
          endTime: l.end_time,
        })),
      createdAt: t.created_at,
    }));

    setTrackers(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTrackers(); }, [fetchTrackers]);

  const createTracker = useCallback(
    async (
      name: string,
      mode: "standard" | "uni",
      goalHours: number,
      subjects: { name: string; goalHours: number }[]
    ) => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("trackers")
        .insert({
          user_id: user.id,
          name,
          mode,
          goal_hours: goalHours,
          subjects: mode === "uni" ? subjects : [],
          start_date: getMondayOfWeek(new Date()),
        })
        .select()
        .single();

      if (error || !data) return null;

      const tracker: Tracker = {
        id: data.id,
        name: data.name,
        mode: data.mode as "standard" | "uni",
        goalHours: Number(data.goal_hours),
        subjects: (data.subjects as any[]) ?? [],
        startDate: data.start_date,
        logs: [],
        createdAt: data.created_at,
      };
      setTrackers((prev) => [tracker, ...prev]);
      return tracker;
    },
    [user]
  );

  const deleteTracker = useCallback(
    async (id: string) => {
      await supabase.from("trackers").delete().eq("id", id);
      setTrackers((prev) => prev.filter((t) => t.id !== id));
    },
    []
  );

  const addLog = useCallback(
    async (trackerId: string, log: StudyLogEntry) => {
      if (!user) return;
      const { data } = await supabase
        .from("study_logs")
        .insert({
          tracker_id: trackerId,
          user_id: user.id,
          subject_name: log.subjectName ?? null,
          start_time: log.startTime,
          end_time: log.endTime,
        })
        .select()
        .single();

      if (data) {
        const newLog: StudyLogEntry = {
          id: data.id,
          subjectName: data.subject_name ?? undefined,
          startTime: data.start_time,
          endTime: data.end_time,
        };
        setTrackers((prev) =>
          prev.map((t) =>
            t.id === trackerId ? { ...t, logs: [...t.logs, newLog] } : t
          )
        );
      }
    },
    [user]
  );

  const updateLog = useCallback(
    async (trackerId: string, logId: string, updates: Partial<Pick<StudyLogEntry, "startTime" | "endTime">>) => {
      const dbUpdates: any = {};
      if (updates.startTime) dbUpdates.start_time = updates.startTime;
      if (updates.endTime) dbUpdates.end_time = updates.endTime;

      await supabase.from("study_logs").update(dbUpdates).eq("id", logId);

      setTrackers((prev) =>
        prev.map((t) =>
          t.id === trackerId
            ? { ...t, logs: t.logs.map((l) => (l.id === logId ? { ...l, ...updates } : l)) }
            : t
        )
      );
    },
    []
  );

  const deleteLog = useCallback(
    async (trackerId: string, logId: string) => {
      await supabase.from("study_logs").delete().eq("id", logId);
      setTrackers((prev) =>
        prev.map((t) =>
          t.id === trackerId ? { ...t, logs: t.logs.filter((l) => l.id !== logId) } : t
        )
      );
    },
    []
  );

  const refresh = useCallback(() => { fetchTrackers(); }, [fetchTrackers]);

  return { trackers, loading, createTracker, deleteTracker, addLog, updateLog, deleteLog, refresh };
}
