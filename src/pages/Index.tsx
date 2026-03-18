import React, { useState, useRef, useCallback, useEffect } from "react";
import { Play, Square, RotateCcw, BookOpen, GraduationCap, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProgressRing from "@/components/ProgressRing";
import StopwatchDisplay from "@/components/StopwatchDisplay";
import SubjectCard from "@/components/SubjectCard";

const SUBJECT_COLORS = [
  "hsl(var(--subject-1))",
  "hsl(var(--subject-2))",
  "hsl(var(--subject-3))",
  "hsl(var(--subject-4))",
  "hsl(var(--subject-5))",
];

interface SubjectData {
  name: string;
  goalHours: number;
  elapsed: number;
  isRunning: boolean;
}

// Stopwatch logic as a custom hook for standard mode
function useStopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const accRef = useRef(0);

  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setElapsed(accRef.current + (Date.now() - startTimeRef.current) / 1000);
    }, 100);
  }, [isRunning]);

  const stop = useCallback(() => {
    if (!isRunning) return;
    setIsRunning(false);
    accRef.current += (Date.now() - startTimeRef.current) / 1000;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [isRunning]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
    accRef.current = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  return { elapsed, isRunning, start, stop, reset };
}

const Index = () => {
  const [mode, setMode] = useState<"standard" | "uni">("standard");
  const [goalHours, setGoalHours] = useState(2);
  const [isSetup, setIsSetup] = useState(false);

  // Standard mode
  const sw = useStopwatch();

  // Uni mode
  const [subjects, setSubjects] = useState<SubjectData[]>([
    { name: "Subject 1", goalHours: 3, elapsed: 0, isRunning: false },
    { name: "Subject 2", goalHours: 3, elapsed: 0, isRunning: false },
  ]);
  const subjectIntervalsRef = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map());
  const subjectStartTimesRef = useRef<Map<number, number>>(new Map());
  const subjectAccRef = useRef<Map<number, number>>(new Map());

  // Setup state for uni mode
  const [setupSubjects, setSetupSubjects] = useState([
    { name: "Subject 1", goalHours: 3 },
    { name: "Subject 2", goalHours: 3 },
  ]);

  const handleStartSetup = () => {
    if (mode === "uni") {
      const newSubjects = setupSubjects.map((s) => ({
        ...s,
        elapsed: 0,
        isRunning: false,
      }));
      setSubjects(newSubjects);
      // Init refs
      subjectAccRef.current = new Map();
      newSubjects.forEach((_, i) => subjectAccRef.current.set(i, 0));
    }
    setIsSetup(true);
  };

  const handleBack = () => {
    // Stop all
    sw.reset();
    subjectIntervalsRef.current.forEach((interval) => clearInterval(interval));
    subjectIntervalsRef.current.clear();
    setIsSetup(false);
  };

  const addSubject = () => {
    if (setupSubjects.length >= 5) return;
    setSetupSubjects([
      ...setupSubjects,
      { name: `Subject ${setupSubjects.length + 1}`, goalHours: 3 },
    ]);
  };

  const removeSubject = () => {
    if (setupSubjects.length <= 1) return;
    setSetupSubjects(setupSubjects.slice(0, -1));
  };

  const startSubject = (index: number) => {
    setSubjects((prev) => {
      const next = [...prev];
      if (next[index].isRunning) return next;
      next[index] = { ...next[index], isRunning: true };
      return next;
    });
    subjectStartTimesRef.current.set(index, Date.now());
    if (!subjectAccRef.current.has(index)) subjectAccRef.current.set(index, 0);
    const interval = setInterval(() => {
      const acc = subjectAccRef.current.get(index) ?? 0;
      const start = subjectStartTimesRef.current.get(index) ?? Date.now();
      setSubjects((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], elapsed: acc + (Date.now() - start) / 1000 };
        return next;
      });
    }, 100);
    subjectIntervalsRef.current.set(index, interval);
  };

  const stopSubject = (index: number) => {
    setSubjects((prev) => {
      const next = [...prev];
      if (!next[index].isRunning) return next;
      const acc = subjectAccRef.current.get(index) ?? 0;
      const start = subjectStartTimesRef.current.get(index) ?? Date.now();
      const newAcc = acc + (Date.now() - start) / 1000;
      subjectAccRef.current.set(index, newAcc);
      next[index] = { ...next[index], isRunning: false, elapsed: newAcc };
      return next;
    });
    const interval = subjectIntervalsRef.current.get(index);
    if (interval) clearInterval(interval);
    subjectIntervalsRef.current.delete(index);
  };

  const resetSubject = (index: number) => {
    stopSubject(index);
    subjectAccRef.current.set(index, 0);
    setSubjects((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], elapsed: 0 };
      return next;
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subjectIntervalsRef.current.forEach((i) => clearInterval(i));
    };
  }, []);

  // Build ring segments
  const ringSegments =
    mode === "standard"
      ? [{ value: goalHours > 0 ? sw.elapsed / (goalHours * 3600) : 0, color: "hsl(var(--primary))" }]
      : subjects.map((s, i) => ({
          value: s.goalHours > 0 ? s.elapsed / (s.goalHours * 3600) : 0,
          color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
        }));

  const totalElapsedUni = subjects.reduce((sum, s) => sum + s.elapsed, 0);
  const totalGoalUni = subjects.reduce((sum, s) => sum + s.goalHours, 0);

  // Setup screen
  if (!isSetup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Study Tracker</h1>
            <p className="text-muted-foreground text-sm">Set your goals and start tracking</p>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center justify-center">
            <div className="inline-flex rounded-lg bg-muted p-1 gap-1">
              <button
                onClick={() => setMode("standard")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  mode === "standard"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="w-4 h-4" /> Standard
              </button>
              <button
                onClick={() => setMode("uni")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  mode === "uni"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <GraduationCap className="w-4 h-4" /> Uni Mode
              </button>
            </div>
          </div>

          {mode === "standard" ? (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-foreground">
                Study goal (hours)
              </label>
              <Input
                type="number"
                min={0.5}
                step={0.5}
                value={goalHours}
                onChange={(e) => setGoalHours(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Subjects</label>
                <div className="flex gap-1">
                  <Button size="icon" variant="outline" onClick={removeSubject} disabled={setupSubjects.length <= 1} className="h-7 w-7">
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={addSubject} disabled={setupSubjects.length >= 5} className="h-7 w-7">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {setupSubjects.map((sub, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }}
                    />
                    <Input
                      placeholder="Subject name"
                      value={sub.name}
                      onChange={(e) => {
                        const next = [...setupSubjects];
                        next[i] = { ...next[i], name: e.target.value };
                        setSetupSubjects(next);
                      }}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={1}
                      value={sub.goalHours}
                      onChange={(e) => {
                        const next = [...setupSubjects];
                        next[i] = { ...next[i], goalHours: Math.max(1, parseInt(e.target.value) || 1) };
                        setSetupSubjects(next);
                      }}
                      className="w-20"
                    />
                    <span className="text-xs text-muted-foreground">hrs</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleStartSetup} className="w-full" size="lg">
            Start Tracking
          </Button>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-6 pt-10">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Study Tracker</h1>
            <p className="text-sm text-muted-foreground">
              {mode === "standard" ? "Standard Mode" : "Uni Mode"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleBack}>
            Change Goal
          </Button>
        </div>

        {/* Ring + main timer */}
        <div className="flex flex-col items-center space-y-4">
          <ProgressRing segments={ringSegments} size={280} strokeWidth={10}>
            <div className="text-center">
              <StopwatchDisplay
                elapsed={mode === "standard" ? sw.elapsed : totalElapsedUni}
                className="text-4xl text-foreground"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "standard"
                  ? `Goal: ${goalHours}h`
                  : `Total: ${totalGoalUni}h goal`}
              </p>
            </div>
          </ProgressRing>

          {/* Standard mode controls */}
          {mode === "standard" && (
            <div className="flex items-center gap-3">
              {sw.isRunning ? (
                <Button onClick={sw.stop} size="lg" variant="outline" className="gap-2">
                  <Square className="w-4 h-4" /> Stop
                </Button>
              ) : (
                <Button onClick={sw.start} size="lg" className="gap-2">
                  <Play className="w-4 h-4" /> Start
                </Button>
              )}
              <Button onClick={sw.reset} size="lg" variant="ghost">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Uni mode subject cards */}
        {mode === "uni" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjects.map((sub, i) => (
              <SubjectCard
                key={i}
                name={sub.name}
                color={SUBJECT_COLORS[i % SUBJECT_COLORS.length]}
                goalHours={sub.goalHours}
                elapsed={sub.elapsed}
                isRunning={sub.isRunning}
                onStart={() => startSubject(i)}
                onStop={() => stopSubject(i)}
                onReset={() => resetSubject(i)}
              />
            ))}
          </div>
        )}

        {/* Legend for uni mode */}
        {mode === "uni" && (
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            {subjects.map((sub, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }}
                />
                {sub.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
