import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { Tracker } from "@/types/tracker";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-coach`;

function buildStudyContext(trackers: Tracker[]): string {
  if (!trackers.length) return "No study data available yet.";

  const now = new Date();
  const lines: string[] = ["Here is the student's study data:\n"];

  for (const t of trackers) {
    lines.push(`## Tracker: ${t.name} (${t.mode} mode)`);
    if (t.mode === "standard") {
      lines.push(`Weekly goal: ${t.goalHours}h`);
    } else {
      lines.push(
        `Subjects: ${t.subjects.map((s) => `${s.name} (${s.goalHours}h/week goal)`).join(", ")}`
      );
    }

    if (!t.logs.length) {
      lines.push("No sessions logged yet.\n");
      continue;
    }

    // Last 4 weeks of logs
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const recentLogs = t.logs.filter((l) => new Date(l.startTime) >= fourWeeksAgo);

    if (!recentLogs.length) {
      lines.push("No sessions in the last 4 weeks.\n");
      continue;
    }

    // Summary stats
    const totalSec = recentLogs.reduce(
      (s, l) => s + (new Date(l.endTime).getTime() - new Date(l.startTime).getTime()) / 1000,
      0
    );
    const avgSessionMin =
      recentLogs.length > 0
        ? totalSec / recentLogs.length / 60
        : 0;

    lines.push(`Recent 4 weeks: ${recentLogs.length} sessions, ${(totalSec / 3600).toFixed(1)}h total`);
    lines.push(`Average session: ${avgSessionMin.toFixed(0)} minutes`);

    // Day-of-week distribution
    const dayCount = [0, 0, 0, 0, 0, 0, 0];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    recentLogs.forEach((l) => dayCount[new Date(l.startTime).getDay()]++);
    lines.push(
      `Day distribution: ${dayNames.map((d, i) => `${d}:${dayCount[i]}`).join(", ")}`
    );

    // Per-subject breakdown for uni mode
    if (t.mode === "uni" && t.subjects.length) {
      for (const sub of t.subjects) {
        const subLogs = recentLogs.filter((l) => l.subjectName === sub.name);
        const subSec = subLogs.reduce(
          (s, l) => s + (new Date(l.endTime).getTime() - new Date(l.startTime).getTime()) / 1000,
          0
        );
        lines.push(`  ${sub.name}: ${subLogs.length} sessions, ${(subSec / 3600).toFixed(1)}h (goal: ${sub.goalHours}h/week)`);
      }
    }

    // Session duration distribution
    const durations = recentLogs.map(
      (l) => (new Date(l.endTime).getTime() - new Date(l.startTime).getTime()) / 60000
    );
    const short = durations.filter((d) => d < 15).length;
    const medium = durations.filter((d) => d >= 15 && d <= 60).length;
    const long = durations.filter((d) => d > 60).length;
    lines.push(`Session lengths: <15min: ${short}, 15-60min: ${medium}, >60min: ${long}`);

    lines.push("");
  }

  return lines.join("\n");
}

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ error: "Request failed" }));
    onError(data.error || `Error ${resp.status}`);
    return;
  }

  if (!resp.body) {
    onError("No response body");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") {
        onDone();
        return;
      }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

interface StudyCoachProps {
  trackers: Tracker[];
  onBack: () => void;
}

const StudyCoach: React.FC<StudyCoachProps> = ({ trackers, onBack }) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contextSent = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      setInput("");
      setIsLoading(true);

      // First message includes study data context
      let userContent = text;
      if (!contextSent.current) {
        const ctx = buildStudyContext(trackers);
        userContent = `${ctx}\n\n---\nStudent's question: ${text}`;
        contextSent.current = true;
      }

      const userMsg: Msg = { role: "user", content: userContent };
      const displayMsg: Msg = { role: "user", content: text };

      setMessages((prev) => [...prev, displayMsg]);

      let assistantSoFar = "";
      const allMessages = [...messages, userMsg];

      try {
        await streamChat({
          messages: allMessages,
          onDelta: (chunk) => {
            assistantSoFar += chunk;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantSoFar }];
            });
          },
          onDone: () => setIsLoading(false),
          onError: (err) => {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: `⚠️ ${err}` },
            ]);
            setIsLoading(false);
          },
        });
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "⚠️ Something went wrong. Please try again." },
        ]);
        setIsLoading(false);
      }
    },
    [isLoading, messages, trackers]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-6 pt-8">
      <div className="w-full max-w-2xl flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Study Coach</h1>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-muted-foreground">
              <Sparkles className="w-10 h-10 text-primary/40" />
              <p className="text-sm max-w-sm">
                Hi! I'm your AI Study Coach. Ask me about your study habits, and I'll analyze your
                data to give personalized advice and optimal study/break intervals.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "How am I doing this week?",
                  "What's my optimal study/break ratio?",
                  "Which subjects need more attention?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your study habits..."
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button
            onClick={() => send(input)}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 h-[44px] w-[44px]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudyCoach;
