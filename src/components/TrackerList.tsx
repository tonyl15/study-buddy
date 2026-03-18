import React, { useState } from "react";
import { Plus, Minus, BookOpen, GraduationCap, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tracker } from "@/types/tracker";

const SUBJECT_COLORS = [
  "hsl(var(--subject-1))",
  "hsl(var(--subject-2))",
  "hsl(var(--subject-3))",
  "hsl(var(--subject-4))",
  "hsl(var(--subject-5))",
];

interface TrackerListProps {
  trackers: Tracker[];
  onSelect: (tracker: Tracker) => void;
  onCreate: (
    name: string,
    mode: "standard" | "uni",
    goalHours: number,
    subjects: { name: string; goalHours: number }[]
  ) => void;
  onDelete: (id: string) => void;
}

const TrackerList: React.FC<TrackerListProps> = ({ trackers, onSelect, onCreate, onDelete }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("Semester 1");
  const [mode, setMode] = useState<"standard" | "uni">("standard");
  const [goalHours, setGoalHours] = useState(10);
  const [subjects, setSubjects] = useState([
    { name: "Subject 1", goalHours: 3 },
    { name: "Subject 2", goalHours: 3 },
  ]);

  const handleCreate = () => {
    onCreate(name, mode, goalHours, mode === "uni" ? subjects : []);
    setShowCreate(false);
    setName(`Semester ${trackers.length + 2}`);
  };

  const addSubject = () => {
    if (subjects.length >= 5) return;
    setSubjects([...subjects, { name: `Subject ${subjects.length + 1}`, goalHours: 3 }]);
  };

  const removeSubject = () => {
    if (subjects.length <= 1) return;
    setSubjects(subjects.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Study Tracker</h1>
          <p className="text-muted-foreground text-sm">Track your study hours by semester and week</p>
        </div>

        {/* Existing trackers */}
        {trackers.length > 0 && (
          <div className="space-y-2">
            {trackers.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => onSelect(t)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate">{t.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t.mode === "standard"
                      ? `Standard · ${t.goalHours}h/week`
                      : `Uni · ${t.subjects.length} subjects`}
                    {" · "}{t.logs.length} sessions
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(t.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Create new */}
        {!showCreate ? (
          <Button onClick={() => setShowCreate(true)} className="w-full gap-2" size="lg">
            <Plus className="w-4 h-4" /> New Tracker
          </Button>
        ) : (
          <div className="rounded-lg border border-border bg-card p-5 space-y-5">
            <h2 className="font-semibold text-foreground">Create Tracker</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Semester 1" />
            </div>

            {/* Mode toggle */}
            <div className="flex items-center justify-center">
              <div className="inline-flex rounded-lg bg-muted p-1 gap-1">
                <button
                  onClick={() => setMode("standard")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    mode === "standard"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BookOpen className="w-4 h-4" /> Standard
                </button>
                <button
                  onClick={() => setMode("uni")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    mode === "uni"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" /> Uni Mode
                </button>
              </div>
            </div>

            {mode === "standard" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Weekly goal (hours)</label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={goalHours}
                  onChange={(e) => setGoalHours(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Subjects (hrs/week each)</label>
                  <div className="flex gap-1">
                    <Button size="icon" variant="outline" onClick={removeSubject} disabled={subjects.length <= 1} className="h-7 w-7">
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={addSubject} disabled={subjects.length >= 5} className="h-7 w-7">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {subjects.map((sub, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: SUBJECT_COLORS[i] }} />
                    <Input
                      placeholder="Subject name"
                      value={sub.name}
                      onChange={(e) => {
                        const next = [...subjects];
                        next[i] = { ...next[i], name: e.target.value };
                        setSubjects(next);
                      }}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={1}
                      value={sub.goalHours}
                      onChange={(e) => {
                        const next = [...subjects];
                        next[i] = { ...next[i], goalHours: Math.max(1, parseInt(e.target.value) || 1) };
                        setSubjects(next);
                      }}
                      className="w-20"
                    />
                    <span className="text-xs text-muted-foreground">hrs</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => setShowCreate(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreate} className="flex-1" disabled={!name.trim()}>
                Create
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackerList;
