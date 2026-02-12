"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDuration } from "@/types/workout";

interface WorkoutDetailSet {
  setNumber: number;
  weight?: number;
  reps?: number;
  rpe?: number;
  weightUnit: string;
  setType: string;
  isCompleted: boolean;
  isPR?: boolean;
}

interface WorkoutDetailExercise {
  _id: string;
  exerciseName: string;
  order: number;
  sets: WorkoutDetailSet[];
}

interface WorkoutDetail {
  _id: string;
  name?: string;
  startedAt: number;
  completedAt?: number;
  duration?: number;
  exercises: WorkoutDetailExercise[];
}

interface WorkoutDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: WorkoutDetail | null | undefined;
  isLoading?: boolean;
}

export function WorkoutDetailDialog({
  open,
  onOpenChange,
  workout,
  isLoading,
}: WorkoutDetailDialogProps) {
  const completedSets = workout?.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.isCompleted).length,
    0
  ) ?? 0;

  const totalVolume = workout?.exercises.reduce(
    (acc, ex) =>
      acc +
      ex.sets
        .filter((s) => s.isCompleted && s.weight && s.reps)
        .reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0),
    0
  ) ?? 0;

  const prCount = workout?.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.isPR).length,
    0
  ) ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {workout?.name || "Workout"}
          </DialogTitle>
          {workout && (
            <p className="text-xs text-zinc-500 mt-1">
              {new Date(workout.startedAt).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
              {workout.duration != null && ` · ${formatDuration(workout.duration * 60)}`}
            </p>
          )}
        </DialogHeader>

        {isLoading || !workout ? (
          <div className="space-y-4 py-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-zinc-900/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-5 mt-2">
            {/* Summary stats */}
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              <span>
                <span className="text-zinc-200">{completedSets}</span> sets
              </span>
              {totalVolume > 0 && (
                <span>
                  <span className="text-zinc-200">{totalVolume.toLocaleString()}</span> vol
                </span>
              )}
              {prCount > 0 && (
                <span className="text-white">
                  {prCount} PR{prCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Exercises */}
            {workout.exercises
              .sort((a, b) => a.order - b.order)
              .map((exercise) => {
                const exCompletedSets = exercise.sets.filter((s) => s.isCompleted);
                if (exCompletedSets.length === 0) return null;

                return (
                  <div key={exercise._id} className="space-y-2">
                    <h3 className="font-semibold text-sm text-zinc-100">
                      {exercise.exerciseName}
                    </h3>
                    <div className="space-y-1">
                      {exCompletedSets.map((set) => (
                        <div
                          key={`${exercise._id}-${set.setNumber}`}
                          className="flex items-center gap-3 py-1.5 px-3 rounded-lg"
                        >
                          <span className="w-5 h-5 rounded-full bg-zinc-800 text-[9px] font-bold flex items-center justify-center text-zinc-500 shrink-0">
                            {set.setNumber}
                          </span>
                          <span className="text-sm text-zinc-300 flex-1">
                            {set.weight != null && (
                              <span className="font-medium">{set.weight} {set.weightUnit}</span>
                            )}
                            {set.weight != null && set.reps != null && (
                              <span className="text-zinc-600 mx-1">&times;</span>
                            )}
                            {set.reps != null && (
                              <span className="font-medium">{set.reps}</span>
                            )}
                            {set.rpe != null && (
                              <span className="text-zinc-600 ml-1.5 text-xs">@{set.rpe}</span>
                            )}
                          </span>
                          {set.isPR && (
                            <span className="text-[9px] font-black text-white uppercase tracking-tight bg-zinc-800 px-1.5 py-0.5 rounded">
                              PR
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
