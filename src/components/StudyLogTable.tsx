import React, { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StudyLogEntry } from "@/types/tracker";
import { formatTime } from "@/components/StopwatchDisplay";

interface StudyLogTableProps {
  logs: StudyLogEntry[];
  subjectColors?: Record<string, string>;
  onUpdate: (logId: string, updates: Partial<Pick<StudyLogEntry, "startTime" | "endTime">>) => void;
  onDelete: (logId: string) => void;
}

function toLocalDatetimeStr(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDisplay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const StudyLogTable: React.FC<StudyLogTableProps> = ({ logs, subjectColors = {}, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  const startEdit = (log: StudyLogEntry) => {
    setEditingId(log.id);
    setEditStart(toLocalDatetimeStr(log.startTime));
    setEditEnd(toLocalDatetimeStr(log.endTime));
  };

  const saveEdit = (logId: string) => {
    const startTime = new Date(editStart).toISOString();
    const endTime = new Date(editEnd).toISOString();
    if (new Date(endTime) > new Date(startTime)) {
      onUpdate(logId, { startTime, endTime });
    }
    setEditingId(null);
  };

  if (logs.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-6">
        No study sessions logged this week yet.
      </p>
    );
  }

  const sorted = [...logs].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return (
    <div className="space-y-2">
      {sorted.map((log) => {
        const duration = (new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 1000;
        const isEditing = editingId === log.id;

        return (
          <div key={log.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
            {isEditing ? (
              <>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-muted-foreground">Start</label>
                    <Input
                      type="datetime-local"
                      value={editStart}
                      onChange={(e) => setEditStart(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-muted-foreground">End</label>
                    <Input
                      type="datetime-local"
                      value={editEnd}
                      onChange={(e) => setEditEnd(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-1 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 gap-1 text-xs">
                    <X className="w-3 h-3" /> Cancel
                  </Button>
                  <Button size="sm" onClick={() => saveEdit(log.id)} className="h-7 gap-1 text-xs">
                    <Check className="w-3 h-3" /> Save
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  {log.subjectName && (
                    <span className="text-xs font-medium text-primary">{log.subjectName} · </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDisplay(log.startTime)} → {formatDisplay(log.endTime)}
                  </span>
                  <span className="text-xs font-semibold text-foreground ml-2">
                    {formatTime(Math.max(0, duration))}
                  </span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(log)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(log.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StudyLogTable;
