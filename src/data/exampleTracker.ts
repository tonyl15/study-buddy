import { Tracker, StudyLogEntry, getMondayOfWeek } from "@/types/tracker";

function daysAgo(days: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function session(daysBack: number, startHour: number, startMin: number, durationMin: number, subject?: string): StudyLogEntry {
  const start = daysAgo(daysBack, startHour, startMin);
  const end = new Date(new Date(start).getTime() + durationMin * 60000).toISOString();
  return {
    id: `example-${daysBack}-${startHour}-${subject ?? "std"}`,
    subjectName: subject,
    startTime: start,
    endTime: end,
  };
}

// 5 weeks of realistic uni study data
const exampleLogs: StudyLogEntry[] = [
  // Week 1 (4-5 weeks ago)
  session(35, 9, 0, 45, "Mathematics"),
  session(35, 14, 0, 60, "Physics"),
  session(34, 10, 0, 50, "Computer Science"),
  session(33, 9, 30, 40, "Mathematics"),
  session(33, 14, 0, 55, "Physics"),
  session(32, 11, 0, 35, "Computer Science"),
  session(31, 9, 0, 45, "Mathematics"),

  // Week 2 (3-4 weeks ago)
  session(28, 9, 0, 50, "Mathematics"),
  session(28, 14, 30, 70, "Physics"),
  session(27, 10, 0, 45, "Computer Science"),
  session(27, 15, 0, 30, "Mathematics"),
  session(26, 9, 0, 60, "Physics"),
  session(25, 11, 0, 55, "Computer Science"),
  session(25, 16, 0, 40, "Mathematics"),
  session(24, 9, 0, 35, "Physics"),

  // Week 3 (2-3 weeks ago)
  session(21, 9, 0, 55, "Mathematics"),
  session(21, 14, 0, 65, "Physics"),
  session(20, 10, 0, 50, "Computer Science"),
  session(19, 9, 30, 45, "Mathematics"),
  session(19, 14, 0, 40, "Physics"),
  session(18, 11, 0, 60, "Computer Science"),
  session(18, 16, 0, 30, "Mathematics"),
  session(17, 10, 0, 50, "Physics"),
  session(17, 15, 0, 45, "Computer Science"),

  // Week 4 (1-2 weeks ago)
  session(14, 9, 0, 60, "Mathematics"),
  session(14, 14, 0, 75, "Physics"),
  session(13, 10, 0, 40, "Computer Science"),
  session(12, 9, 0, 50, "Mathematics"),
  session(12, 14, 30, 55, "Physics"),
  session(11, 11, 0, 65, "Computer Science"),
  session(10, 9, 0, 45, "Mathematics"),
  session(10, 15, 0, 35, "Physics"),

  // Week 5 (this week)
  session(6, 9, 0, 50, "Mathematics"),
  session(6, 14, 0, 60, "Physics"),
  session(5, 10, 0, 55, "Computer Science"),
  session(4, 9, 30, 40, "Mathematics"),
  session(3, 14, 0, 45, "Physics"),
  session(2, 11, 0, 50, "Computer Science"),
  session(1, 9, 0, 35, "Mathematics"),
];

const startDate = new Date();
startDate.setDate(startDate.getDate() - 35);

export const exampleTracker: Tracker = {
  id: "example-tracker",
  name: "📚 Example — Semester 1",
  mode: "uni",
  goalHours: 15,
  subjects: [
    { name: "Mathematics", goalHours: 5 },
    { name: "Physics", goalHours: 5 },
    { name: "Computer Science", goalHours: 5 },
  ],
  startDate: getMondayOfWeek(startDate),
  logs: exampleLogs,
  createdAt: startDate.toISOString(),
};
