"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SetType, SET_TYPE_LABELS } from "@/types/workout";

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
const RPE_OPTIONS = ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"];

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
  previousWeight,
  previousReps,
  onComplete,
  onUpdate,
  onDelete,
  onStartRest,
  showRpe = true,
  showRir = false,
}: SetRowProps) {
  const [localWeight, setLocalWeight] = useState(weight?.toString() || "");
  const [localReps, setLocalReps] = useState(reps?.toString() || "");
  const [localRpe, setLocalRpe] = useState(rpe?.toString() || "");
  const [localRir, setLocalRir] = useState(rir?.toString() || "");
  const [isEditing, setIsEditing] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const isEditMode = isCompleted && isEditing;

  const weightStep = weightUnit === "kg" ? 2.5 : 5;

  const adjustWeight = (delta: number) => {
    const current = localWeight ? parseFloat(localWeight) : 0;
    const next = Math.max(0, current + delta);
    setLocalWeight(next.toString());
  };

  const adjustReps = (delta: number) => {
    const current = localReps ? parseInt(localReps) : 0;
    const next = Math.max(0, current + delta);
    setLocalReps(next.toString());
  };

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

  const handleSaveEdits = () => {
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
    setIsEditing(false);
  };

  const handleCancelEdits = () => {
    setLocalWeight(weight?.toString() || "");
    setLocalReps(reps?.toString() || "");
    setLocalRpe(rpe?.toString() || "");
    setLocalRir(rir?.toString() || "");
    setIsEditing(false);
  };

  // -- Completed set: compact summary line --
  if (isCompleted && !isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="w-full flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-secondary transition-colors text-left group"
      >
        <span className="w-6 h-6 rounded-full bg-muted text-[10px] font-bold flex items-center justify-center text-muted-foreground shrink-0">
          {setNumber}
        </span>

        <span className="flex-1 text-sm font-medium text-foreground min-w-0">
          {weight != null && (
            <span className="tabular-nums">{weight} {weightUnit}</span>
          )}
          {weight != null && reps != null && (
            <span className="text-muted-foreground mx-2 text-xs opacity-50">&times;</span>
          )}
          {reps != null && (
            <span className="tabular-nums font-semibold">{reps}</span>
          )}
          {rpe != null && (
            <span className="text-muted-foreground ml-2.5 text-[10px] font-black uppercase tracking-widest">@{rpe}</span>
          )}
          {setType !== "working" && (
            <span className="text-muted-foreground ml-3 text-[9px] font-black uppercase tracking-[0.2em] opacity-40">
              {SET_TYPE_LABELS[setType]}
            </span>
          )}
        </span>

        {isPR ? (
          <span className="text-[10px] font-black text-foreground uppercase tracking-tight bg-muted px-2 py-0.5 rounded-md">
            PR
          </span>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-muted shrink-0" />
        )}

        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
          Edit
        </span>
      </button>
    );
  }

  // -- Active set or editing: focused input card --
  return (
    <div className="rounded-[2rem] bg-secondary border border-border p-6 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center">
            {setNumber}
          </span>

          {/* Set type — tappable to cycle */}
          <button
            type="button"
            onClick={() => setShowTypeSelector(!showTypeSelector)}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-muted-foreground transition-colors"
          >
            {SET_TYPE_LABELS[setType]}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isEditMode ? (
            <button
              type="button"
              onClick={handleCancelEdits}
              className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-muted-foreground transition-colors px-2 py-1"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={onDelete}
              className="text-foreground hover:text-destructive transition-colors p-2"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Set type selector pills */}
      {showTypeSelector && (
        <div className="flex gap-1.5 flex-wrap">
          {SET_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                onUpdate({ setType: type });
                setShowTypeSelector(false);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                setType === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {SET_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      )}

      {/* Weight input */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block">
          Weight
        </label>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => adjustWeight(-weightStep)}
            className="w-11 h-11 rounded-xl bg-muted hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center text-lg font-bold transition-colors active:scale-95 shrink-0"
          >
            &minus;
          </button>
          <div className="flex-1 relative">
            <Input
              type="number"
              inputMode="decimal"
              value={localWeight}
              onChange={(e) => setLocalWeight(e.target.value)}
              placeholder={previousWeight?.toString() || "0"}
              className="h-12 text-center text-lg font-bold bg-muted border-border rounded-xl pr-12 focus-visible:ring-1 focus-visible:ring-primary/20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase">
              {weightUnit}
            </span>
          </div>
          <button
            type="button"
            onClick={() => adjustWeight(weightStep)}
            className="w-11 h-11 rounded-xl bg-muted hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center text-lg font-bold transition-colors active:scale-95 shrink-0"
          >
            +
          </button>
        </div>
        {previousWeight != null && (
          <p className="text-[10px] text-muted-foreground text-center">
            prev: {previousWeight} {weightUnit}
          </p>
        )}
      </div>

      {/* Reps input */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block">
          Reps
        </label>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => adjustReps(-1)}
            className="w-11 h-11 rounded-xl bg-muted hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center text-lg font-bold transition-colors active:scale-95 shrink-0"
          >
            &minus;
          </button>
          <div className="flex-1">
            <Input
              type="number"
              inputMode="numeric"
              value={localReps}
              onChange={(e) => setLocalReps(e.target.value)}
              placeholder={previousReps?.toString() || "0"}
              className="h-12 text-center text-lg font-bold bg-muted border-border rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20"
            />
          </div>
          <button
            type="button"
            onClick={() => adjustReps(1)}
            className="w-11 h-11 rounded-xl bg-muted hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center text-lg font-bold transition-colors active:scale-95 shrink-0"
          >
            +
          </button>
        </div>
        {previousReps != null && (
          <p className="text-[10px] text-muted-foreground text-center">
            prev: {previousReps} reps
          </p>
        )}
      </div>

      {/* RPE pills */}
      {showRpe && (
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block">
            RPE <span className="font-medium normal-case tracking-normal text-muted-foreground">optional</span>
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {RPE_OPTIONS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setLocalRpe(localRpe === val ? "" : val)}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-bold transition-all active:scale-95",
                  localRpe === val
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RIR input (alternative to RPE) */}
      {showRir && !showRpe && (
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block">
            RIR <span className="font-medium normal-case tracking-normal text-muted-foreground">reps in reserve</span>
          </label>
          <div className="flex gap-1.5">
            {["0", "1", "2", "3", "4", "5"].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setLocalRir(localRir === val ? "" : val)}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-bold transition-all flex-1 active:scale-95",
                  localRir === val
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action button */}
      {isEditMode ? (
        <Button
          type="button"
          onClick={handleSaveEdits}
          className="w-full h-12 rounded-xl text-[11px] font-black uppercase tracking-[0.2em]"
        >
          Save Changes
        </Button>
      ) : (
        <Button
          type="button"
          onClick={handleComplete}
          className="w-full h-12 rounded-xl text-[11px] font-black uppercase tracking-[0.2em]"
        >
          Done
        </Button>
      )}
    </div>
  );
}
