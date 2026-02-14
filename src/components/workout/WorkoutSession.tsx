"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
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
  formatDuration,
  calculateVolume,
} from "@/types/workout";

// Floating cloud animation styles
const cloudStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) translateX(0px); }
    50% { transform: translateY(-8px) translateX(4px); }
  }
  @keyframes float-delayed {
    0%, 100% { transform: translateY(0px) translateX(0px); }
    50% { transform: translateY(-6px) translateX(-3px); }
  }
  @keyframes float-slow {
    0%, 100% { transform: translateY(0px) translateX(0px); }
    50% { transform: translateY(-10px) translateX(2px); }
  }
  .cloud-float {
    animation: float 6s ease-in-out infinite;
  }
  .cloud-float-delayed {
    animation: float-delayed 8s ease-in-out infinite;
    animation-delay: 2s;
  }
  .cloud-float-slow {
    animation: float-slow 10s ease-in-out infinite;
    animation-delay: 1s;
  }
`;

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
    initialData?: { weight?: number; reps?: number; rpe?: number; setType?: string }
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
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(0);
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

  const handleFinishWorkout = async () => {
    await onCompleteWorkout();
    setShowFinishDialog(false);
  };

  const hasExercises = workout.exercises.length > 0;
  const activeExerciseIndex = hasExercises
    ? Math.min(currentExerciseIndex, workout.exercises.length - 1)
    : 0;
  const currentExercise = workout.exercises[activeExerciseIndex];

  // Swipe handlers
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50; // Low resistance - easy to swipe
    if (info.offset.x < -threshold && activeExerciseIndex < workout.exercises.length - 1) {
      // Swipe left - next exercise
      setSwipeDirection(1);
      setCurrentExerciseIndex((prev) => Math.min(prev + 1, workout.exercises.length - 1));
    } else if (info.offset.x > threshold && activeExerciseIndex > 0) {
      // Swipe right - previous exercise
      setSwipeDirection(-1);
      setCurrentExerciseIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  const goToExercise = (index: number) => {
    setSwipeDirection(index > activeExerciseIndex ? 1 : -1);
    setCurrentExerciseIndex(index);
  };

  // Calculate exercise completion for auto-collapse
  const isExerciseCompleted = (exercise: typeof currentExercise) => {
    if (!exercise) return false;
    const total = exercise.sets.length;
    const completed = exercise.sets.filter((s) => s.isCompleted).length;
    return total > 0 && completed === total;
  };

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col gap-4 pb-2">
      <style>{cloudStyles}</style>

      {/* Workout Header */}
      <Card className="rounded-[2rem] border border-border bg-card relative overflow-hidden">
        {/* Floating clouds for header */}
        <div className="absolute -left-4 top-2 w-16 h-8 bg-gradient-to-br from-white/30 to-white/10 rounded-full blur-sm cloud-float" />
        <div className="absolute right-8 top-4 w-12 h-6 bg-gradient-to-br from-white/20 to-white/5 rounded-full blur-sm cloud-float-delayed" />
        
        <CardHeader className="p-5 pb-3 relative z-10">
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
        <CardContent className="px-5 pb-5 pt-0 relative z-10">
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
          </div>
        </CardContent>
      </Card>

      {/* Exercise Pager with Dots */}
      {hasExercises ? (
        <>
          {/* Dot Indicators */}
          <div className="flex items-center justify-center gap-2 px-4">
            {workout.exercises.map((_, index) => (
              <button
                key={index}
                onClick={() => goToExercise(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === activeExerciseIndex
                    ? "bg-primary w-6"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to exercise ${index + 1}`}
              />
            ))}
          </div>

          {/* Swipeable Exercise Area */}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence initial={false} custom={swipeDirection} mode="wait">
              <motion.div
                key={activeExerciseIndex}
                custom={swipeDirection}
                initial={{ x: swipeDirection > 0 ? 300 : -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: swipeDirection > 0 ? -300 : 300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                className="h-full"
              >
                {currentExercise && (
                  <ExerciseCard
                    key={currentExercise._id}
                    exercise={currentExercise}
                    exerciseNumber={activeExerciseIndex + 1}
                    totalExercises={workout.exercises.length}
                    isCollapsed={isExerciseCompleted(currentExercise)}
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
                )}
              </motion.div>
            </AnimatePresence>

            {/* Swipe Hints */}
            {workout.exercises.length > 1 && (
              <>
                {activeExerciseIndex > 0 && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center shadow-sm">
                    <span className="text-xs">←</span>
                  </div>
                )}
                {activeExerciseIndex < workout.exercises.length - 1 && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center shadow-sm">
                    <span className="text-xs">→</span>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <Card className="rounded-[2rem] border border-dashed border-border bg-card flex-1">
          <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
            <p className="text-lg font-black text-foreground">No exercises yet</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              Add an exercise to begin this workout.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Bottom Actions */}
      <div className="mt-auto pb-[calc(env(safe-area-inset-bottom)+0.75rem)] px-4">
        <div className="space-y-3 rounded-[2rem] border border-border bg-card p-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsExercisePickerOpen(true)}
            className="h-14 w-full rounded-full border-border bg-secondary text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
          >
            + Add Exercise
          </Button>
          {hasExercises && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Swipe to navigate</span>
            </div>
          )}
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
