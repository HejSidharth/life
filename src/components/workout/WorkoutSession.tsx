"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExerciseCard } from "./ExerciseCard";
import { ExercisePicker } from "./ExercisePicker";
import { RestTimer, useRestTimer } from "./RestTimer";
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
  formatDuration,
  calculateVolume,
} from "@/types/workout";

interface WorkoutSessionProps {
  workout: Workout;
  exercises: ExerciseLibraryItem[];
  onAddExercise: (exerciseLibraryId: string) => Promise<void>;
  onRemoveExercise: (workoutExerciseId: string) => Promise<void>;
  onAddSet: (workoutExerciseId: string, exerciseLibraryId: string) => Promise<void>;
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
  onSetExerciseSuperset?: (
    workoutExerciseId: string,
    supersetGroup: number | null
  ) => Promise<void>;
  onViewExerciseHistory?: (
    exerciseLibraryId: string,
    exerciseName: string
  ) => void;
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
  onSetExerciseSuperset,
  onViewExerciseHistory,
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
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            <div className="flex items-center gap-1">
              <span>{formatDuration(elapsedSeconds)}</span>
            </div>
            <div>
              <span className="text-zinc-200">{completedSets}</span>
              /{totalSets} sets
            </div>
            {totalVolume > 0 && (
              <div>
                <span className="text-zinc-200">
                  {totalVolume.toLocaleString()}
                </span>{" "}
                vol
              </div>
            )}
            {prCount > 0 && (
              <div className="text-white">
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
            onAddSet={() => onAddSet(exercise._id, exercise.exerciseLibraryId)}
            onUpdateSet={(setId, data) => onUpdateSet(setId, data)}
            onCompleteSet={onCompleteSet}
            onDeleteSet={onDeleteSet}
            onRemoveExercise={() => onRemoveExercise(exercise._id)}
            onStartRest={startRest}
            onSupersetGroupChange={
              onSetExerciseSuperset
                ? (group) => onSetExerciseSuperset(exercise._id, group)
                : undefined
            }
            onViewHistory={
              onViewExerciseHistory
                ? () =>
                    onViewExerciseHistory(
                      exercise.exerciseLibraryId,
                      exercise.exerciseName
                    )
                : undefined
            }
            supersetLabel={
              exercise.supersetGroup
                ? `Superset ${exercise.supersetGroup}`
                : undefined
            }
          />
        ))}
      </div>

      {/* Add Exercise Button */}
      <Button
        variant="outline"
        className="w-full h-14 rounded-2xl border-dashed border-zinc-800 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white"
        onClick={() => setIsExercisePickerOpen(true)}
      >
        Add Exercise
      </Button>

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

      {/* Finish Workout Dialog */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish Workout?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold">{formatDuration(elapsedSeconds)}</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{completedSets}</p>
                <p className="text-xs text-muted-foreground">Sets Completed</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalVolume.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Volume</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
                  {prCount}
                </p>
                <p className="text-xs text-muted-foreground">PRs</p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {onSaveAsTemplate && (
              <Button
                variant="outline"
                onClick={() => {
                  onSaveAsTemplate();
                  setShowFinishDialog(false);
                }}
              >
                Save as Template
              </Button>
            )}
            <Button onClick={handleFinishWorkout}>Finish Workout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Workout Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Workout?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will discard all progress from this workout session.
            {completedSets > 0 && (
              <span className="block mt-2 text-foreground">
                You have completed {completedSets} set{completedSets !== 1 ? "s" : ""}.
              </span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Training
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await onCancelWorkout();
                setShowCancelDialog(false);
              }}
            >
              Cancel Workout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
