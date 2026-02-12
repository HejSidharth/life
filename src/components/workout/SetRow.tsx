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
        className="w-full flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-zinc-900/50 transition-colors text-left group"
      >
        <span className="w-6 h-6 rounded-full bg-zinc-800 text-[10px] font-bold flex items-center justify-center text-zinc-400 shrink-0">
          {setNumber}
        </span>

        <span className="flex-1 text-sm font-medium text-zinc-200 min-w-0">
          {weight != null && (
            <span>{weight} {weightUnit}</span>
          )}
          {weight != null && reps != null && (
            <span className="text-zinc-600 mx-1.5">&times;</span>
          )}
          {reps != null && (
            <span>{reps}</span>
          )}
          {rpe != null && (
            <span className="text-zinc-500 ml-2 text-xs">@{rpe}</span>
          )}
          {setType !== "working" && (
            <span className="text-zinc-600 ml-2 text-[10px] uppercase tracking-wider">
              {SET_TYPE_LABELS[setType]}
            </span>
          )}
        </span>

        {isPR ? (
          <span className="text-[10px] font-black text-white uppercase tracking-tight bg-zinc-800 px-2 py-0.5 rounded-md">
            PR
          </span>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 shrink-0" />
        )}

        <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
          Edit
        </span>
      </button>
    );
  }

  // -- Active set or editing: focused input card --
  return (
    <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-full bg-white text-black text-xs font-black flex items-center justify-center">
            {setNumber}
          </span>

          {/* Set type — tappable to cycle */}
          <button
            type="button"
            onClick={() => setShowTypeSelector(!showTypeSelector)}
            className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {SET_TYPE_LABELS[setType]}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isEditMode && (
            <button
              type="button"
              onClick={handleCancelEdits}
              className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-300 transition-colors px-2 py-1"
            >
              Cancel
            </button>
          )}
          {!isEditMode && (
            <button
              type="button"
              onClick={onDelete}
              className="text-zinc-700 hover:text-red-400 transition-colors p-1"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
              )}
            >
              {SET_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      )}

      {/* Weight input */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 block">
          Weight
        </label>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => adjustWeight(-weightStep)}
            className="w-11 h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center text-lg font-bold transition-colors active:scale-95 shrink-0"
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
              className="h-12 text-center text-lg font-bold bg-zinc-800/50 border-zinc-700/50 rounded-xl pr-12 focus-visible:ring-1 focus-visible:ring-white/20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-600 uppercase">
              {weightUnit}
            </span>
          </div>
          <button
            type="button"
            onClick={() => adjustWeight(weightStep)}
            className="w-11 h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center text-lg font-bold transition-colors active:scale-95 shrink-0"
          >
            +
          </button>
        </div>
        {previousWeight != null && (
          <p className="text-[10px] text-zinc-600 text-center">
            prev: {previousWeight} {weightUnit}
          </p>
        )}
      </div>

      {/* Reps input */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 block">
          Reps
        </label>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => adjustReps(-1)}
            className="w-11 h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center text-lg font-bold transition-colors active:scale-95 shrink-0"
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
              className="h-12 text-center text-lg font-bold bg-zinc-800/50 border-zinc-700/50 rounded-xl focus-visible:ring-1 focus-visible:ring-white/20"
            />
          </div>
          <button
            type="button"
            onClick={() => adjustReps(1)}
            className="w-11 h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center text-lg font-bold transition-colors active:scale-95 shrink-0"
          >
            +
          </button>
        </div>
        {previousReps != null && (
          <p className="text-[10px] text-zinc-600 text-center">
            prev: {previousReps} reps
          </p>
        )}
      </div>

      {/* RPE pills */}
      {showRpe && (
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 block">
            RPE <span className="font-medium normal-case tracking-normal text-zinc-700">optional</span>
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
                    ? "bg-white text-black"
                    : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
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
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 block">
            RIR <span className="font-medium normal-case tracking-normal text-zinc-700">reps in reserve</span>
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
                    ? "bg-white text-black"
                    : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
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
