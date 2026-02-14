"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SetType, SET_TYPE_LABELS } from "@/types/workout";
import { Check, X, ChevronDown } from "lucide-react";

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

// Set type color schemes (matching plan page aesthetic)
const setTypeColors: Record<SetType, { bg: string; text: string; border: string }> = {
  warmup: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  working: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  drop: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  failure: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
  },
  rest_pause: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  backoff: {
    bg: "bg-teal-100",
    text: "text-teal-700",
    border: "border-teal-200",
  },
};

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
  const [showDetails, setShowDetails] = useState(false);

  const isEditMode = isCompleted && isEditing;
  const colors = setTypeColors[setType];

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

  // -- Completed set: compact row design --
  if (isCompleted && !isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="w-full flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-secondary transition-colors text-left group border-b border-border/50 last:border-0"
      >
        {/* Set number */}
        <span className="w-7 h-7 rounded-full bg-muted text-[10px] font-bold flex items-center justify-center text-muted-foreground shrink-0">
          {setNumber}
        </span>

        {/* Set type badge */}
        <span className={cn(
          "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0",
          colors.bg,
          colors.text
        )}>
          {SET_TYPE_LABELS[setType]}
        </span>

        {/* Weight × Reps */}
        <span className="flex-1 text-sm font-medium text-foreground min-w-0">
          {weight != null && (
            <span className="tabular-nums font-semibold">{weight} {weightUnit}</span>
          )}
          {weight != null && reps != null && (
            <span className="text-muted-foreground mx-1.5">×</span>
          )}
          {reps != null && (
            <span className="tabular-nums">{reps}</span>
          )}
          {rpe != null && (
            <span className="text-muted-foreground ml-1.5 text-[10px] font-bold">@{rpe}</span>
          )}
        </span>

        {/* PR indicator */}
        {isPR ? (
          <span className="text-[10px] font-black text-yellow-600 uppercase tracking-tight bg-yellow-100 px-2 py-0.5 rounded-md shrink-0">
            PR
          </span>
        ) : (
          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <Check className="h-3 w-3 text-green-600" />
          </div>
        )}

        {/* Edit hint */}
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          Edit
        </span>
      </button>
    );
  }

  // -- Active set or editing: expanded input card --
  return (
    <div className={cn(
      "rounded-2xl border p-4 space-y-4",
      isCompleted ? "bg-muted/30 border-border" : "bg-card border-border"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center">
            {setNumber}
          </span>

          {/* Set type selector */}
          <button
            type="button"
            onClick={() => setShowTypeSelector(!showTypeSelector)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1",
              colors.bg,
              colors.text
            )}
          >
            {SET_TYPE_LABELS[setType]}
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {isEditMode ? (
            <button
              type="button"
              onClick={handleCancelEdits}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={onDelete}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Set type selector pills */}
      {showTypeSelector && (
        <div className="flex gap-1.5 flex-wrap">
          {SET_TYPES.map((type) => {
            const typeColors = setTypeColors[type];
            return (
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
                    ? `${typeColors.bg} ${typeColors.text} ring-1 ring-offset-1 ${typeColors.border}`
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {SET_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>
      )}

      {/* Weight & Reps Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Weight input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block">
            Weight
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => adjustWeight(-weightStep)}
              className="h-10 w-10 shrink-0 rounded-lg bg-muted text-base font-bold text-muted-foreground transition-colors active:scale-95 hover:text-foreground"
            >
              −
            </button>
            <div className="flex-1 relative">
              <Input
                type="number"
                inputMode="decimal"
                value={localWeight}
                onChange={(e) => setLocalWeight(e.target.value)}
                placeholder={previousWeight?.toString() || "0"}
                className="h-10 text-center text-base font-bold bg-muted border-border rounded-lg pr-10"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase">
                {weightUnit}
              </span>
            </div>
            <button
              type="button"
              onClick={() => adjustWeight(weightStep)}
              className="h-10 w-10 shrink-0 rounded-lg bg-muted text-base font-bold text-muted-foreground transition-colors active:scale-95 hover:text-foreground"
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
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block">
            Reps
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => adjustReps(-1)}
              className="h-10 w-10 shrink-0 rounded-lg bg-muted text-base font-bold text-muted-foreground transition-colors active:scale-95 hover:text-foreground"
            >
              −
            </button>
            <div className="flex-1">
              <Input
                type="number"
                inputMode="numeric"
                value={localReps}
                onChange={(e) => setLocalReps(e.target.value)}
                placeholder={previousReps?.toString() || "0"}
                className="h-10 text-center text-base font-bold bg-muted border-border rounded-lg"
              />
            </div>
            <button
              type="button"
              onClick={() => adjustReps(1)}
              className="h-10 w-10 shrink-0 rounded-lg bg-muted text-base font-bold text-muted-foreground transition-colors active:scale-95 hover:text-foreground"
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
      </div>

      {/* Expandable details */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="w-full py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
      >
        {showDetails ? "Hide" : "More"} Options
        <ChevronDown className={cn("h-3 w-3 transition-transform", showDetails && "rotate-180")} />
      </button>

      {showDetails && (
        <div className="space-y-3 pt-2">
          {/* RPE pills */}
          {showRpe && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block">
                RPE
              </label>
              <div className="flex gap-1 flex-wrap">
                {RPE_OPTIONS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setLocalRpe(localRpe === val ? "" : val)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95",
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

          {/* RIR input */}
          {showRir && !showRpe && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block">
                RIR
              </label>
              <div className="flex gap-1">
                {["0", "1", "2", "3", "4", "5"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setLocalRir(localRir === val ? "" : val)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 active:scale-95",
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
        </div>
      )}

      {/* Action button */}
      {isEditMode ? (
        <Button
          type="button"
          onClick={handleSaveEdits}
          className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-[0.2em]"
        >
          Save Changes
        </Button>
      ) : (
        <Button
          type="button"
          onClick={handleComplete}
          className="w-full h-11 rounded-xl text-xs font-black uppercase tracking-[0.2em]"
        >
          Done
        </Button>
      )}
    </div>
  );
}
