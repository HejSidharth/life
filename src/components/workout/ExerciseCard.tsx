"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SetRow } from "./SetRow";
import { WorkoutExercise, WorkoutSet, calculateVolume, SetType } from "@/types/workout";

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  onAddSet: (initialData?: {
    weight?: number;
    reps?: number;
    rpe?: number;
    setType?: SetType;
  }) => Promise<void>;
  onUpdateSet: (setId: string, data: Partial<WorkoutSet>) => void;
  onCompleteSet: (setId: string, data: { weight?: number; reps?: number; rpe?: number; rir?: number }) => Promise<{ isPR?: boolean; prType?: string }>;
  onDeleteSet: (setId: string) => void;
  onRemoveExercise: () => void;
  onStartRest: (seconds: number) => void;
  onViewHistory?: () => void;
  onViewTechnique?: (url: string) => void;
  previousPerformance?: {
    sets: { weight?: number; reps?: number }[];
  };
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  supersetLabel?: string;
  defaultRestSeconds?: number;
}

export function ExerciseCard({
  exercise,
  onAddSet,
  onUpdateSet,
  onCompleteSet,
  onDeleteSet,
  onRemoveExercise,
  onStartRest,
  onViewHistory,
  onViewTechnique,
  previousPerformance,
  isExpanded = true,
  onToggleExpand,
  supersetLabel,
  defaultRestSeconds = 90,
}: ExerciseCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const completedSets = exercise.sets.filter((s) => s.isCompleted);
  const totalVolume = calculateVolume(exercise.sets);
  const prSets = exercise.sets.filter((s) => s.isPR);

  const handleCompleteSet = async (setId: string, data: { weight?: number; reps?: number; rpe?: number; rir?: number }) => {
    const result = await onCompleteSet(setId, data);
    return result;
  };

  const handleRemove = () => {
    if (exercise.sets.some((s) => s.isCompleted)) {
      setIsRemoving(true);
    } else {
      onRemoveExercise();
    }
  };

  return (
    <Card className={cn("relative", showMenu && "z-50")}>
      {/* Superset indicator */}
      {supersetLabel && (
        <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-br rounded-tl-[inherit] z-10">
          {supersetLabel}
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <button
              type="button"
              onClick={onToggleExpand}
              className="text-left w-full group"
            >
              <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
                {exercise.exerciseName}
              </h3>
              {!isExpanded && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {completedSets.length}/{exercise.sets.length} sets
                  {totalVolume > 0 && ` · ${totalVolume.toLocaleString()} vol`}
                  {prSets.length > 0 && (
                    <span className="text-foreground ml-1 font-bold">
                      {prSets.length} PR{prSets.length > 1 ? "s" : ""}
                    </span>
                  )}
                </p>
              )}
            </button>
          </div>

          {/* Overflow menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.25" />
                <circle cx="8" cy="8" r="1.25" />
                <circle cx="8" cy="13" r="1.25" />
              </svg>
            </button>

            {showMenu && (
              <>
                {/* Backdrop to close menu */}
                <button
                  type="button"
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                  aria-label="Close menu"
                />
                <div className="absolute right-0 top-full mt-1 z-50 bg-secondary border border-border rounded-xl shadow-xl py-1 min-w-[140px]">
                  {onViewHistory && (
                    <button
                      type="button"
                      onClick={() => {
                        onViewHistory();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      History
                    </button>
                  )}
                  {exercise.techniqueUrl && onViewTechnique && (
                    <button
                      type="button"
                      onClick={() => {
                        onViewTechnique(exercise.techniqueUrl as string);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Technique
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      handleRemove();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-destructive hover:text-destructive/80 hover:bg-muted transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-1">
          {/* Sets — no column header grid needed */}
          {exercise.sets.map((set, index) => (
            <SetRow
              key={set._id}
              setNumber={set.setNumber}
              setType={set.setType}
              weight={set.weight}
              reps={set.reps}
              rpe={set.rpe}
              rir={set.rir}
              restSeconds={exercise.restSeconds || defaultRestSeconds}
              weightUnit={set.weightUnit}
              isCompleted={set.isCompleted}
              isPR={set.isPR}
              previousWeight={previousPerformance?.sets[index]?.weight}
              previousReps={previousPerformance?.sets[index]?.reps}
              onComplete={(data) => handleCompleteSet(set._id, data)}
              onUpdate={(data) => onUpdateSet(set._id, data as Partial<WorkoutSet>)}
              onDelete={() => onDeleteSet(set._id)}
              onStartRest={onStartRest}
              showRpe={true}
              showSetType={true}
            />
          ))}

          {/* Add Set — inline, no dialog */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const lastSet = exercise.sets[exercise.sets.length - 1];
              void onAddSet(
                lastSet
                  ? {
                      weight: lastSet.weight,
                      reps: lastSet.reps,
                      rpe: lastSet.rpe,
                      setType: lastSet.setType,
                    }
                  : undefined
              );
            }}
            className="w-full mt-3 h-10 rounded-2xl border-border text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
          >
            + Add Set
          </Button>

          {/* Finish Exercise — collapses the card */}
          <Button
            onClick={onToggleExpand}
            className="w-full mt-1 h-10 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
          >
            Finish Exercise
          </Button>

          {/* Stats */}
          {completedSets.length > 0 && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
              <span>{completedSets.length} sets done</span>
              {totalVolume > 0 && <span>{totalVolume.toLocaleString()} vol</span>}
            </div>
          )}
        </CardContent>
      )}

      {/* Confirm remove overlay */}
      {isRemoving && (
        <div className="absolute inset-0 bg-background/95 flex items-center justify-center p-4 z-30 rounded-[inherit]">
          <div className="text-center">
            <p className="text-sm font-medium mb-2">Remove exercise?</p>
            <p className="text-xs text-muted-foreground mb-4">
              This will delete {completedSets.length} completed set{completedSets.length !== 1 ? "s" : ""}.
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRemoving(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onRemoveExercise();
                  setIsRemoving(false);
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
