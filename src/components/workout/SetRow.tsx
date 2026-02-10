"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SetType, SET_TYPE_LABELS, SET_TYPE_COLORS } from "@/types/workout";

interface SetRowProps {
  setNumber: number;
  setType: SetType;
  weight?: number;
  reps?: number;
  rpe?: number;
  rir?: number;
  restSeconds?: number;
  weightUnit: "lbs" | "kg";
  isCompleted: boolean;
  isPR?: boolean;
  prType?: string;
  previousWeight?: number;
  previousReps?: number;
  onComplete: (data: {
    weight?: number;
    reps?: number;
    rpe?: number;
    rir?: number;
  }) => void;
  onUpdate: (data: Partial<{
    weight: number;
    reps: number;
    rpe: number;
    rir: number;
    setType: SetType;
    restSeconds: number;
  }>) => void;
  onDelete: () => void;
  onStartRest?: (seconds: number) => void;
  showRpe?: boolean;
  showRir?: boolean;
  showSetType?: boolean;
}

const SET_TYPES: SetType[] = ["warmup", "working", "drop", "failure", "rest_pause", "backoff"];

export function SetRow({
  setNumber,
  setType,
  weight,
  reps,
  rpe,
  rir,
  restSeconds = 90,
  weightUnit,
  isCompleted,
  isPR,
  prType,
  previousWeight,
  previousReps,
  onComplete,
  onUpdate,
  onDelete,
  onStartRest,
  showRpe = true,
  showRir = false,
  showSetType = true,
}: SetRowProps) {
  const [localWeight, setLocalWeight] = useState(weight?.toString() || "");
  const [localReps, setLocalReps] = useState(reps?.toString() || "");
  const [localRpe, setLocalRpe] = useState(rpe?.toString() || "");
  const [localRir, setLocalRir] = useState(rir?.toString() || "");
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
        setShowTypeMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleComplete = () => {
    const data = {
      weight: localWeight ? parseFloat(localWeight) : undefined,
      reps: localReps ? parseInt(localReps) : undefined,
      rpe: localRpe ? parseFloat(localRpe) : undefined,
      rir: localRir ? parseInt(localRir) : undefined,
    };
    onComplete(data);
    if (onStartRest && restSeconds) {
      onStartRest(restSeconds);
    }
  };

  const handleBlur = () => {
    const updates: Partial<{ weight: number; reps: number; rpe: number; rir: number }> = {};
    
    if (localWeight && parseFloat(localWeight) !== weight) {
      updates.weight = parseFloat(localWeight);
    }
    if (localReps && parseInt(localReps) !== reps) {
      updates.reps = parseInt(localReps);
    }
    if (localRpe && parseFloat(localRpe) !== rpe) {
      updates.rpe = parseFloat(localRpe);
    }
    if (localRir && parseInt(localRir) !== rir) {
      updates.rir = parseInt(localRir);
    }

    if (Object.keys(updates).length > 0) {
      onUpdate(updates);
    }
  };

  const prLabel =
    prType === "1rm"
      ? "1RM"
      : prType === "volume"
      ? "VOL"
      : prType === "weight"
      ? "WT"
      : prType === "reps"
      ? "REP"
      : "PR";

  return (
    <div
      className={cn(
        "grid gap-2 items-center py-2 px-3 rounded-md transition-colors",
        isCompleted
          ? "bg-muted/50"
          : "bg-background hover:bg-muted/30"
      )}
      style={{
        gridTemplateColumns: showSetType
          ? "auto 1fr 80px 60px 60px auto auto"
          : "auto 1fr 80px 60px auto auto",
      }}
    >
      {/* Set Number & Type */}
      <div className="relative" ref={typeMenuRef}>
        <button
          type="button"
          onClick={() => !isCompleted && setShowTypeMenu(!showTypeMenu)}
          className={cn(
            "w-8 h-8 rounded-md text-xs font-medium flex items-center justify-center transition-colors",
            SET_TYPE_COLORS[setType],
            !isCompleted && "cursor-pointer hover:opacity-80"
          )}
          disabled={isCompleted}
        >
          {setNumber}
        </button>
        
        {showTypeMenu && (
          <div className="absolute left-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[120px]">
            {SET_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onUpdate({ setType: type });
                  setShowTypeMenu(false);
                }}
                className={cn(
                  "w-full px-3 py-1.5 text-left text-sm hover:bg-muted transition-colors",
                  setType === type && "bg-muted"
                )}
              >
                {SET_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Set Type Label (if showing) */}
      {showSetType && (
        <span className="text-xs text-muted-foreground truncate">
          {SET_TYPE_LABELS[setType]}
          {previousWeight && previousReps && (
            <span className="ml-2 opacity-60">
              (prev: {previousWeight}×{previousReps})
            </span>
          )}
        </span>
      )}

      {/* Weight */}
      <div className="relative">
        <Input
          type="number"
          value={localWeight}
          onChange={(e) => setLocalWeight(e.target.value)}
          onBlur={handleBlur}
          placeholder="0"
          className="h-8 text-center pr-8"
          disabled={isCompleted}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {weightUnit}
        </span>
      </div>

      {/* Reps */}
      <Input
        type="number"
        value={localReps}
        onChange={(e) => setLocalReps(e.target.value)}
        onBlur={handleBlur}
        placeholder="0"
        className="h-8 text-center"
        disabled={isCompleted}
      />

      {/* RPE (optional) */}
      {showRpe && (
        <Input
          type="number"
          min="1"
          max="10"
          step="0.5"
          value={localRpe}
          onChange={(e) => setLocalRpe(e.target.value)}
          onBlur={handleBlur}
          placeholder="RPE"
          className="h-8 text-center text-xs"
          disabled={isCompleted}
        />
      )}

      {/* RIR (optional, alternative to RPE) */}
      {showRir && !showRpe && (
        <Input
          type="number"
          min="0"
          max="5"
          value={localRir}
          onChange={(e) => setLocalRir(e.target.value)}
          onBlur={handleBlur}
          placeholder="RIR"
          className="h-8 text-center text-xs"
          disabled={isCompleted}
        />
      )}

      {/* Complete Button */}
      {!isCompleted ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleComplete}
          className="h-8 px-3 text-[10px] font-black uppercase tracking-widest"
        >
          Done
        </Button>
      ) : (
        <div className="h-8 w-8 flex items-center justify-center">
          {isPR ? (
            <span className="text-[10px] font-black text-white uppercase tracking-tighter">PR</span>
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
          )}
        </div>
      )}

      {/* Delete Button */}
      {!isCompleted && (
        <button
          type="button"
          onClick={onDelete}
          className="h-8 w-8 flex items-center justify-center text-[10px] font-black text-muted-foreground hover:text-destructive transition-colors uppercase tracking-widest"
        >
          ×
        </button>
      )}
    </div>
  );
}
