import { useState, useRef, useCallback } from "react";

export const useStopwatch = () => {
  const [elapsed, setElapsed] = useState(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const total = accumulatedRef.current + (now - startTimeRef.current) / 1000;
      setElapsed(total);
    }, 100);
  }, [isRunning]);

  const stop = useCallback(() => {
    if (!isRunning) return;
    setIsRunning(false);
    accumulatedRef.current += (Date.now() - startTimeRef.current) / 1000;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [isRunning]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
    accumulatedRef.current = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  return { elapsed, isRunning, start, stop, reset };
};
