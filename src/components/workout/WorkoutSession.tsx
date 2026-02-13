"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExerciseCard } from "./ExerciseCard";
import { ExercisePicker } from "./ExercisePicker";
import { RestTimer, useRestTimer } from "./RestTimer";
import { WorkoutFinishFlow } from "./WorkoutFinishFlow";
import { useWizard } from "@/context/WizardContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const { setWizardOpen } = useWizard();

  const { restSeconds, timerKey, startRest, stopRest, isResting } = useRestTimer();

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setWizardOpen(true);
    return () => setWizardOpen(false);
  }, [setWizardOpen]);

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
    if (workout.exercises.length === 0) {
      setCurrentExerciseIndex(0);
    }
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

  const hasExercises = workout.exercises.length > 0;
  const activeExerciseIndex = hasExercises
    ? Math.min(currentExerciseIndex, workout.exercises.length - 1)
    : 0;
  const currentExercise = workout.exercises[activeExerciseIndex];
  const isLastExercise = hasExercises && activeExerciseIndex === workout.exercises.length - 1;

  const goToNextExercise = () => {
    if (!hasExercises) return;
    if (isLastExercise) {
      setShowFinishDialog(true);
      return;
    }
    setCurrentExerciseIndex((prev) => Math.min(prev + 1, workout.exercises.length - 1));
  };

  const goToPreviousExercise = () => {
    setCurrentExerciseIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col gap-4 pb-2">
      {/* Workout Header */}
      <Card className="rounded-[2rem] border border-border bg-card">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-start justify-between gap-4">
            {isEditingName ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  className="h-10 rounded-xl border-border bg-secondary text-xl font-black text-foreground"
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
                className="text-3xl font-black tracking-tight text-foreground transition-colors hover:opacity-80"
              >
                {workout.name || "Workout"}
              </button>
            )}
            <Button
              size="sm"
              onClick={() => setShowFinishDialog(true)}
              className="h-11 rounded-full px-6 text-base font-black"
            >
              Finish
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <div className="flex flex-wrap items-center gap-4 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
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
            <div>
              <span className="text-foreground">{hasExercises ? activeExerciseIndex + 1 : 0}</span>
              /{workout.exercises.length} exercise
              {workout.exercises.length !== 1 ? "s" : ""}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Exercise */}
      <div className="flex-1 space-y-4">
        {hasExercises && currentExercise ? (
          <ExerciseCard
            key={currentExercise._id}
            exercise={currentExercise}
            isExpanded={!collapsedExercises.has(currentExercise._id)}
            onToggleExpand={() => toggleExerciseExpand(currentExercise._id)}
            onAddSet={(initialData) =>
              onAddSet(currentExercise._id, currentExercise.exerciseLibraryId, initialData)
            }
            onUpdateSet={(setId, data) => onUpdateSet(setId, data)}
            onCompleteSet={onCompleteSet}
            onDeleteSet={onDeleteSet}
            onRemoveExercise={async () => {
              const nextCount = workout.exercises.length - 1;
              await onRemoveExercise(currentExercise._id);
              if (nextCount <= 0) {
                setCurrentExerciseIndex(0);
                return;
              }
              setCurrentExerciseIndex((prev) => Math.min(prev, nextCount - 1));
            }}
            onStartRest={startRest}
            previousPerformance={previousPerformances?.[currentExercise.exerciseLibraryId]}
            onViewHistory={
              onViewExerciseHistory
                ? () =>
                    onViewExerciseHistory(
                      currentExercise.exerciseLibraryId,
                      currentExercise.exerciseName
                    )
                : undefined
            }
            onViewTechnique={onViewExerciseTechnique}
            supersetLabel={
              currentExercise.supersetGroup
                ? `Superset ${currentExercise.supersetGroup}`
                : undefined
            }
          />
        ) : (
          <Card className="rounded-[2rem] border border-dashed border-border bg-card">
            <CardContent className="p-8 text-center">
              <p className="text-lg font-black text-foreground">No exercises yet</p>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                Add an exercise to begin this workout.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pager Actions */}
      <div className="mt-auto pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="space-y-3 rounded-[2rem] border border-border bg-card p-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExercisePickerOpen(true)}
          className="h-14 w-full rounded-full border-border bg-secondary text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
        >
          Add Exercise
        </Button>
        <Button
          type="button"
          onClick={goToNextExercise}
          disabled={!hasExercises}
          className="h-16 w-full rounded-full text-[11px] font-black uppercase tracking-[0.22em]"
        >
          {isLastExercise ? "Finish Workout" : "Next Exercise"}
        </Button>
        </div>
      </div>

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
            {hasExercises && (
              <Button
                variant="outline"
                onClick={() => {
                  goToPreviousExercise();
                  setShowCancelDialog(false);
                }}
                className="h-12 rounded-full border-border bg-card text-sm font-black uppercase tracking-[0.15em]"
              >
                Previous Exercise
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
