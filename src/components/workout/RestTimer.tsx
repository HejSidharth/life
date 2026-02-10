"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/types/workout";

interface RestTimerProps {
  initialSeconds?: number;
  onComplete?: () => void;
  className?: string;
}

export function RestTimer({
  initialSeconds = 90,
  onComplete,
  className,
}: RestTimerProps) {
  const [isActive, setIsActive] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);

  // Countdown logic
  useEffect(() => {
    if (!isActive || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, secondsRemaining, onComplete]);

  const handleAddTime = useCallback((seconds: number) => {
    setSecondsRemaining((prev) => prev + seconds);
    setTotalSeconds((prev) => prev + seconds);
    if (!isActive) setIsActive(true);
  }, [isActive]);

  const handleSkip = useCallback(() => {
    setIsActive(false);
    setSecondsRemaining(0);
    onComplete?.();
  }, [onComplete]);

  const handlePauseResume = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  const progress = totalSeconds > 0 ? (secondsRemaining / totalSeconds) * 100 : 0;

  if (secondsRemaining <= 0 && !isActive) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
        "bg-card border border-border rounded-lg shadow-lg",
        "px-4 py-3 flex items-center gap-4",
        className
      )}
    >
      {/* Progress Ring */}
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
          {/* Background circle */}
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted"
          />
          {/* Progress circle */}
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${progress} 100`}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-1000",
              secondsRemaining <= 10 ? "text-red-500" : "text-primary"
            )}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-mono font-medium">
          {formatDuration(secondsRemaining)}
        </span>
      </div>

      {/* Label */}
      <div className="flex-1">
        <p className="text-sm font-medium">Rest Timer</p>
        <p className="text-xs text-muted-foreground">
          {isActive ? "Resting..." : "Paused"}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAddTime(15)}
          className="h-8 px-2 text-xs"
        >
          +15s
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAddTime(30)}
          className="h-8 px-2 text-xs"
        >
          +30s
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePauseResume}
          className="h-8 px-2 text-[10px] font-black uppercase tracking-widest"
        >
          {isActive ? "Pause" : "Resume"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="h-8 px-2 text-xs"
        >
          Skip
        </Button>
      </div>
    </div>
  );
}

// Hook for managing rest timer state
export function useRestTimer() {
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [key, setKey] = useState(0);

  const startRest = useCallback((seconds: number) => {
    setRestSeconds(seconds);
    setKey((prev) => prev + 1); // Force re-render to restart timer
  }, []);

  const stopRest = useCallback(() => {
    setRestSeconds(null);
  }, []);

  return {
    restSeconds,
    timerKey: key,
    startRest,
    stopRest,
    isResting: restSeconds !== null && restSeconds > 0,
  };
}
