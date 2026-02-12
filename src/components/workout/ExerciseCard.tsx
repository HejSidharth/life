"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SetRow } from "./SetRow";
import { WorkoutExercise, WorkoutSet, calculateVolume } from "@/types/workout";

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  onAddSet: () => void;
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
    <Card className="relative overflow-hidden">
      {/* Superset indicator */}
      {supersetLabel && (
        <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-br">
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
                  {exercise.difficultyTier && ` · ${exercise.difficultyTier}`}
                  {totalVolume > 0 && ` · ${totalVolume.toLocaleString()} vol`}
                  {prSets.length > 0 && (
                    <span className="text-white ml-1 font-bold">
                      {prSets.length} PR{prSets.length > 1 ? "s" : ""}
                    </span>
                  )}
                </p>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onViewHistory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewHistory}
                className="h-8 px-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white"
                title="View history"
              >
                History
              </Button>
            )}
            {exercise.techniqueUrl && onViewTechnique && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewTechnique(exercise.techniqueUrl as string)}
                className="h-8 px-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white"
                title="View technique"
              >
                Technique
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-8 px-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-destructive"
              title="Remove exercise"
            >
              Remove
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Column Headers */}
          <div
            className="grid gap-2 items-center px-3 py-1 text-xs text-muted-foreground"
            style={{ gridTemplateColumns: "auto 1fr 80px 60px 60px auto auto" }}
          >
            <div className="w-8 text-center">Set</div>
            <div>Type</div>
            <div className="text-center">Weight</div>
            <div className="text-center">Reps</div>
            <div className="text-center">RPE</div>
            <div className="w-8"></div>
            <div className="w-8"></div>
          </div>

          {/* Sets */}
          <div className="space-y-1">
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
          </div>

          {/* Add Set Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onAddSet}
            className="w-full mt-3 h-10 rounded-2xl border-zinc-800 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white"
          >
            Add Set
          </Button>

          {/* Stats */}
          {completedSets.length > 0 && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
              <span>{completedSets.length} sets completed</span>
              {totalVolume > 0 && <span>{totalVolume.toLocaleString()} total volume</span>}
            </div>
          )}
        </CardContent>
      )}

      {/* Confirm remove dialog */}
      {isRemoving && (
        <div className="absolute inset-0 bg-background/95 flex items-center justify-center p-4">
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
