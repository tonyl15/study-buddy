import React, { useState, useRef, useCallback, useEffect } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Play, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProgressRing from "@/components/ProgressRing";
import StopwatchDisplay from "@/components/StopwatchDisplay";
import SubjectCard from "@/components/SubjectCard";
import StudyLogTable from "@/components/StudyLogTable";
import {
  Tracker,
  StudyLogEntry,
  getWeekNumber,
  getLogsForWeek,
  getElapsedForWeek,
  getWeekDateRange,
  generateId,
} from "@/types/tracker";

const SUBJECT_COLORS = [
  "hsl(var(--subject-1))",
  "hsl(var(--subject-2))",
  "hsl(var(--subject-3))",
  "hsl(var(--subject-4))",
  "hsl(var(--subject-5))",
];

interface TrackerViewProps {
  tracker: Tracker;
  onBack: () => void;
  onAddLog: (log: StudyLogEntry) => void;
  onUpdateLog: (logId: string, updates: Partial<Pick<StudyLogEntry, "startTime" | "endTime">>) => void;
  onDeleteLog: (logId: string) => void;
  readOnly?: boolean;
}

const TrackerView: React.FC<TrackerViewProps> = ({
  tracker,
  onBack,
  onAddLog,
  onUpdateLog,
  onDeleteLog,
  readOnly = false,
}) => {
  const currentWeek = getWeekNumber(tracker.startDate, new Date());
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const isCurrentWeek = selectedWeek === currentWeek;

  // Stopwatch state for standard mode
  const [stdRunning, setStdRunning] = useState(false);
  const [stdElapsed, setStdElapsed] = useState(0);
  const stdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stdStartRef = useRef(0);
  const stdAccRef = useRef(0);
  const stdLogStartRef = useRef<string>("");

  // Subject stopwatch state for uni mode
  const [subRunning, setSubRunning] = useState<Map<number, boolean>>(new Map());
  const [subElapsed, setSubElapsed] = useState<Map<number, number>>(new Map());
  const subIntervalRefs = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map());
  const subStartRefs = useRef<Map<number, number>>(new Map());
  const subAccRefs = useRef<Map<number, number>>(new Map());
  const subLogStartRefs = useRef<Map<number, string>>(new Map());

  // Standard mode controls
  const startStd = useCallback(() => {
    if (stdRunning) return;
    setStdRunning(true);
    stdStartRef.current = Date.now();
    stdLogStartRef.current = new Date().toISOString();
    stdIntervalRef.current = setInterval(() => {
      setStdElapsed(stdAccRef.current + (Date.now() - stdStartRef.current) / 1000);
    }, 100);
  }, [stdRunning]);

  const stopStd = useCallback(() => {
    if (!stdRunning) return;
    setStdRunning(false);
    const sessionTime = (Date.now() - stdStartRef.current) / 1000;
    stdAccRef.current += sessionTime;
    if (stdIntervalRef.current) clearInterval(stdIntervalRef.current);

    // Create log entry
    onAddLog({
      id: generateId(),
      startTime: stdLogStartRef.current,
      endTime: new Date().toISOString(),
    });
  }, [stdRunning, onAddLog]);

  const resetStd = useCallback(() => {
    if (stdRunning) stopStd();
    setStdElapsed(0);
    stdAccRef.current = 0;
    if (stdIntervalRef.current) clearInterval(stdIntervalRef.current);
  }, [stdRunning, stopStd]);

  // Subject controls for uni mode
  const startSubject = useCallback(
    (index: number) => {
      if (subRunning.get(index)) return;
      setSubRunning((prev) => new Map(prev).set(index, true));
      subStartRefs.current.set(index, Date.now());
      subLogStartRefs.current.set(index, new Date().toISOString());
      if (!subAccRefs.current.has(index)) subAccRefs.current.set(index, 0);

      const interval = setInterval(() => {
        const acc = subAccRefs.current.get(index) ?? 0;
        const start = subStartRefs.current.get(index) ?? Date.now();
        setSubElapsed((prev) => new Map(prev).set(index, acc + (Date.now() - start) / 1000));
      }, 100);
      subIntervalRefs.current.set(index, interval);
    },
    [subRunning]
  );

  const stopSubject = useCallback(
    (index: number) => {
      if (!subRunning.get(index)) return;
      const acc = subAccRefs.current.get(index) ?? 0;
      const start = subStartRefs.current.get(index) ?? Date.now();
      const newAcc = acc + (Date.now() - start) / 1000;
      subAccRefs.current.set(index, newAcc);
      setSubRunning((prev) => new Map(prev).set(index, false));
      setSubElapsed((prev) => new Map(prev).set(index, newAcc));

      const interval = subIntervalRefs.current.get(index);
      if (interval) clearInterval(interval);
      subIntervalRefs.current.delete(index);

      // Create log
      onAddLog({
        id: generateId(),
        subjectName: tracker.subjects[index]?.name,
        startTime: subLogStartRefs.current.get(index) ?? new Date().toISOString(),
        endTime: new Date().toISOString(),
      });
    },
    [subRunning, onAddLog, tracker.subjects]
  );

  const resetSubject = useCallback(
    (index: number) => {
      if (subRunning.get(index)) stopSubject(index);
      subAccRefs.current.set(index, 0);
      setSubElapsed((prev) => new Map(prev).set(index, 0));
    },
    [subRunning, stopSubject]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (stdIntervalRef.current) clearInterval(stdIntervalRef.current);
      subIntervalRefs.current.forEach((i) => clearInterval(i));
    };
  }, []);

  // Week data
  const weekLogs = getLogsForWeek(tracker.logs, tracker.startDate, selectedWeek);
  const { start: weekStart, end: weekEnd } = getWeekDateRange(tracker.startDate, selectedWeek);
  const formatDate = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  // Build ring data from logged time for selected week
  const ringSegments =
    tracker.mode === "standard"
      ? [
          {
            value:
              tracker.goalHours > 0
                ? (getElapsedForWeek(tracker.logs, tracker.startDate, selectedWeek) +
                    (isCurrentWeek ? stdElapsed : 0)) /
                  (tracker.goalHours * 3600)
                : 0,
            color: "hsl(var(--primary))",
          },
        ]
      : tracker.subjects.map((s, i) => ({
          value:
            s.goalHours > 0
              ? (getElapsedForWeek(tracker.logs, tracker.startDate, selectedWeek, s.name) +
                  (isCurrentWeek ? subElapsed.get(i) ?? 0 : 0)) /
                (s.goalHours * 3600)
              : 0,
          color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
        }));

  const totalElapsed =
    tracker.mode === "standard"
      ? getElapsedForWeek(tracker.logs, tracker.startDate, selectedWeek) +
        (isCurrentWeek ? stdElapsed : 0)
      : tracker.subjects.reduce(
          (sum, s, i) =>
            sum +
            getElapsedForWeek(tracker.logs, tracker.startDate, selectedWeek, s.name) +
            (isCurrentWeek ? subElapsed.get(i) ?? 0 : 0),
          0
        );

  const totalGoal =
    tracker.mode === "standard"
      ? tracker.goalHours
      : tracker.subjects.reduce((sum, s) => sum + s.goalHours, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-6 pt-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{tracker.name}</h1>
            <p className="text-sm text-muted-foreground">
              {tracker.mode === "standard" ? `${tracker.goalHours}h/week goal` : `${tracker.subjects.length} subjects`}
            </p>
          </div>
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedWeek((w) => Math.max(1, w - 1))}
            disabled={selectedWeek <= 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Week {selectedWeek}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(weekStart)} – {formatDate(weekEnd)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedWeek((w) => w + 1)}
            disabled={selectedWeek >= currentWeek}
            className="h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Ring + timer */}
        <div className="flex flex-col items-center space-y-4">
          <ProgressRing segments={ringSegments} size={240} strokeWidth={10}>
            <div className="text-center">
              <StopwatchDisplay elapsed={totalElapsed} className="text-3xl text-foreground" />
              <p className="text-sm text-muted-foreground mt-1">of {totalGoal}h goal</p>
            </div>
          </ProgressRing>

          {/* Standard mode controls — only on current week */}
          {tracker.mode === "standard" && isCurrentWeek && !readOnly && (
            <div className="flex items-center gap-3">
              {stdRunning ? (
                <Button onClick={stopStd} size="lg" variant="outline" className="gap-2">
                  <Square className="w-4 h-4" /> Stop
                </Button>
              ) : (
                <Button onClick={startStd} size="lg" className="gap-2">
                  <Play className="w-4 h-4" /> Start
                </Button>
              )}
              <Button onClick={resetStd} size="lg" variant="ghost">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Uni mode subject cards — only on current week */}
        {tracker.mode === "uni" && isCurrentWeek && !readOnly && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tracker.subjects.map((sub, i) => (
              <SubjectCard
                key={i}
                name={sub.name}
                color={SUBJECT_COLORS[i % SUBJECT_COLORS.length]}
                goalHours={sub.goalHours}
                elapsed={
                  getElapsedForWeek(tracker.logs, tracker.startDate, selectedWeek, sub.name) +
                  (subElapsed.get(i) ?? 0)
                }
                isRunning={subRunning.get(i) ?? false}
                onStart={() => startSubject(i)}
                onStop={() => stopSubject(i)}
                onReset={() => resetSubject(i)}
              />
            ))}
          </div>
        )}

        {/* Uni legend */}
        {tracker.mode === "uni" && (
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            {tracker.subjects.map((sub, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }} />
                {sub.name}
              </div>
            ))}
          </div>
        )}

        {/* Study Log */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Session Log — Week {selectedWeek}</h2>
          <StudyLogTable
            logs={weekLogs}
            subjectColors={
              tracker.mode === "uni"
                ? Object.fromEntries(tracker.subjects.map((s, i) => [s.name, SUBJECT_COLORS[i % SUBJECT_COLORS.length]]))
                : {}
            }
            onUpdate={onUpdateLog}
            onDelete={onDeleteLog}
          />
        </div>
      </div>
    </div>
  );
};

export default TrackerView;
