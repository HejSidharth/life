"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExerciseCard } from "./ExerciseCard";
import { ExercisePicker } from "./ExercisePicker";
import { RestTimer, useRestTimer } from "./RestTimer";
import { WorkoutFinishFlow } from "./WorkoutFinishFlow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Workout,
  ExerciseLibraryItem,
  WorkoutSet,
  SetType,
  formatDuration,
  calculateVolume,
} from "@/types/workout";

interface PreviousPerformances {
  [exerciseLibraryId: string]: {
    sets: { weight?: number; reps?: number }[];
  };
}

interface WorkoutSessionProps {
  workout: Workout;
  exercises: ExerciseLibraryItem[];
  onAddExercise: (exerciseLibraryId: string) => Promise<void>;
  onRemoveExercise: (workoutExerciseId: string) => Promise<void>;
  onAddSet: (
    workoutExerciseId: string,
    exerciseLibraryId: string,
    initialData?: { weight?: number; reps?: number; rpe?: number; setType?: SetType }
  ) => Promise<void>;
  onUpdateSet: (setId: string, data: Partial<WorkoutSet>) => Promise<void>;
  onCompleteSet: (
    setId: string,
    data: { weight?: number; reps?: number; rpe?: number; rir?: number }
  ) => Promise<{ isPR?: boolean; prType?: string }>;
  onDeleteSet: (setId: string) => Promise<void>;
  onUpdateWorkoutName: (name: string) => Promise<void>;
  onCompleteWorkout: () => Promise<void>;
  onCancelWorkout: () => Promise<void>;
  onSaveAsTemplate?: () => void;
  isLoadingExercises?: boolean;
  previousPerformances?: PreviousPerformances;
  onViewExerciseHistory?: (
    exerciseLibraryId: string,
    exerciseName: string
  ) => void;
  onViewExerciseTechnique?: (url: string) => void;
}

export function WorkoutSession({
  workout,
  exercises,
  onAddExercise,
  onRemoveExercise,
  onAddSet,
  onUpdateSet,
  onCompleteSet,
  onDeleteSet,
  onUpdateWorkoutName,
  onCompleteWorkout,
  onCancelWorkout,
  onSaveAsTemplate,
  isLoadingExercises,
  previousPerformances,
  onViewExerciseHistory,
  onViewExerciseTechnique,
}: WorkoutSessionProps) {
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [workoutName, setWorkoutName] = useState(workout.name || "Workout");
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [now, setNow] = useState(workout.startedAt);
  const [collapsedExercises, setCollapsedExercises] = useState<Set<string>>(new Set());

  const { restSeconds, timerKey, startRest, stopRest, isResting } = useRestTimer();

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate workout stats
  const elapsedSeconds = Math.floor((now - workout.startedAt) / 1000);
  const totalSets = workout.exercises.reduce((acc, e) => acc + e.sets.length, 0);
  const completedSets = workout.exercises.reduce(
    (acc, e) => acc + e.sets.filter((s) => s.isCompleted).length,
    0
  );
  const totalVolume = workout.exercises.reduce(
    (acc, e) => acc + calculateVolume(e.sets),
    0
  );
  const prCount = workout.exercises.reduce(
    (acc, e) => acc + e.sets.filter((s) => s.isPR).length,
    0
  );

  const handleSelectExercise = async (exercise: ExerciseLibraryItem) => {
    await onAddExercise(exercise._id);
  };

  const handleSaveName = async () => {
    if (workoutName !== workout.name) {
      await onUpdateWorkoutName(workoutName);
    }
    setIsEditingName(false);
  };

  const toggleExerciseExpand = (exerciseId: string) => {
    setCollapsedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  const handleFinishWorkout = async () => {
    await onCompleteWorkout();
    setShowFinishDialog(false);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Workout Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            {isEditingName ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  className="h-8 text-lg font-semibold"
                  autoFocus
                  onBlur={handleSaveName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") {
                      setWorkoutName(workout.name || "Workout");
                      setIsEditingName(false);
                    }
                  }}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="text-lg font-semibold hover:text-primary transition-colors"
              >
                {workout.name || "Workout"}
              </button>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={() => setShowFinishDialog(true)}>
                Finish
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>{formatDuration(elapsedSeconds)}</span>
            </div>
            <div>
              <span className="text-foreground">{completedSets}</span>
              /{totalSets} sets
            </div>
            {totalVolume > 0 && (
              <div>
                <span className="text-foreground">
                  {totalVolume.toLocaleString()}
                </span>{" "}
                vol
              </div>
            )}
            {prCount > 0 && (
              <div className="text-foreground">
                {prCount} PR{prCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exercise List */}
      <div className="space-y-4">
        {workout.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise._id}
            exercise={exercise}
            isExpanded={!collapsedExercises.has(exercise._id)}
            onToggleExpand={() => toggleExerciseExpand(exercise._id)}
            onAddSet={(initialData) =>
              onAddSet(exercise._id, exercise.exerciseLibraryId, initialData)
            }
            onUpdateSet={(setId, data) => onUpdateSet(setId, data)}
            onCompleteSet={onCompleteSet}
            onDeleteSet={onDeleteSet}
            onRemoveExercise={() => onRemoveExercise(exercise._id)}
            onStartRest={startRest}
            previousPerformance={previousPerformances?.[exercise.exerciseLibraryId]}
            onViewHistory={
              onViewExerciseHistory
                ? () =>
                    onViewExerciseHistory(
                      exercise.exerciseLibraryId,
                      exercise.exerciseName
                    )
                : undefined
            }
            onViewTechnique={onViewExerciseTechnique}
            supersetLabel={
              exercise.supersetGroup
                ? `Superset ${exercise.supersetGroup}`
                : undefined
            }
          />
        ))}
      </div>

      {/* Add Exercise Button */}
      <button
        className="w-full h-20 rounded-[2.5rem] bg-secondary border border-border hover:bg-secondary hover:border-border transition-all flex flex-col items-center justify-center gap-2 group"
        onClick={() => setIsExercisePickerOpen(true)}
      >
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border group-hover:border-border group-hover:scale-110 transition-all">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted-foreground group-hover:text-foreground">
            <path d="M7 3v8M3 7h8" />
          </svg>
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-hover:text-foreground">
          Add Exercise
        </span>
      </button>

      {/* Exercise Picker */}
      <ExercisePicker
        open={isExercisePickerOpen}
        onOpenChange={setIsExercisePickerOpen}
        onSelect={handleSelectExercise}
        exercises={exercises}
        isLoading={isLoadingExercises}
      />

      {/* Rest Timer */}
      {isResting && restSeconds && (
        <RestTimer
          key={timerKey}
          initialSeconds={restSeconds}
          onComplete={stopRest}
        />
      )}

      <WorkoutFinishFlow
        open={showFinishDialog}
        onOpenChange={setShowFinishDialog}
        onComplete={handleFinishWorkout}
        onSaveAsTemplate={onSaveAsTemplate ? () => {
          onSaveAsTemplate();
          setShowFinishDialog(false);
        } : undefined}
        stats={{
          duration: elapsedSeconds,
          sets: completedSets,
          volume: totalVolume,
          prs: prCount
        }}
      />

      {/* Cancel Workout Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="rounded-[2.5rem] border-border bg-secondary p-8 sm:p-10 max-w-sm mx-auto">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-2xl font-bold text-center">Cancel Workout?</DialogTitle>
            <p className="text-sm text-muted-foreground text-center px-2">
              This will discard all progress from this workout session.
              {completedSets > 0 && (
                <span className="block mt-2 text-muted-foreground font-medium">
                  You have completed {completedSets} set{completedSets !== 1 ? "s" : ""}.
                </span>
              )}
            </p>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 mt-8">
            <Button
              variant="destructive"
              onClick={async () => {
                await onCancelWorkout();
                setShowCancelDialog(false);
              }}
              className="h-14 rounded-full text-base font-bold transition-all active:scale-95"
            >
              Cancel Workout
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowCancelDialog(false)}
              className="h-14 rounded-full text-base font-bold bg-secondary text-foreground hover:bg-muted transition-all active:scale-95"
            >
              Keep Training
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
