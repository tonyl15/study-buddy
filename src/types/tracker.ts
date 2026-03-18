export interface StudyLogEntry {
  id: string;
  subjectName?: string; // undefined for standard mode
  startTime: string; // ISO
  endTime: string; // ISO
}

export interface TrackerSubject {
  name: string;
  goalHours: number; // per week
}

export interface Tracker {
  id: string;
  name: string;
  mode: "standard" | "uni";
  goalHours: number; // per week, for standard mode
  subjects: TrackerSubject[];
  startDate: string; // ISO date string for week 1 Monday
  logs: StudyLogEntry[];
  createdAt: string;
}

export function getWeekNumber(startDate: string, date: Date): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1);
}

export function getWeekDateRange(startDate: string, weekNumber: number): { start: Date; end: Date } {
  const base = new Date(startDate);
  base.setHours(0, 0, 0, 0);
  const weekStart = new Date(base.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  return { start: weekStart, end: weekEnd };
}

export function getLogsForWeek(logs: StudyLogEntry[], startDate: string, weekNumber: number): StudyLogEntry[] {
  const { start, end } = getWeekDateRange(startDate, weekNumber);
  return logs.filter((log) => {
    const logStart = new Date(log.startTime);
    return logStart >= start && logStart <= end;
  });
}

export function getElapsedForWeek(
  logs: StudyLogEntry[],
  startDate: string,
  weekNumber: number,
  subjectName?: string
): number {
  const weekLogs = getLogsForWeek(logs, startDate, weekNumber);
  const filtered = subjectName
    ? weekLogs.filter((l) => l.subjectName === subjectName)
    : weekLogs;
  return filtered.reduce((sum, log) => {
    return sum + (new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 1000;
  }, 0);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
