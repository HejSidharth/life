"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlowWizard, Step } from "@/components/ui/FlowWizard";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ExerciseLibraryItem } from "@/types/workout";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, Plus, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { useWizard } from "@/context/WizardContext";

interface RoutineWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: ExerciseLibraryItem[];
  onCreate: (data: RoutineData) => Promise<void>;
}

export interface RoutineData {
  name: string;
  days: {
    name: string;
    exercises: {
      exerciseLibraryId: string;
      exerciseName: string;
      targetSets: number;
      targetReps: string;
    }[];
  }[];
}

interface RoutineDay {
  name: string;
  exercises: ExerciseLibraryItem[];
}

interface RoutineExerciseRowProps {
  exercise: ExerciseLibraryItem;
  isSelected: boolean;
  onToggle: (exercise: ExerciseLibraryItem) => void;
}

const INITIAL_VISIBLE_COUNT = 30;
const LOAD_MORE_COUNT = 20;

const RoutineExerciseRow = memo(function RoutineExerciseRow({
  exercise,
  isSelected,
  onToggle,
}: RoutineExerciseRowProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(exercise)}
      className={cn(
        "w-full rounded-2xl border px-4 py-4 text-left transition-colors flex items-center justify-between",
        isSelected
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card hover:bg-secondary"
      )}
    >
      <div className="min-w-0">
        <div
          className={cn(
            "font-black text-base leading-tight",
            isSelected ? "text-background" : "text-foreground"
          )}
        >
          {exercise.name}
        </div>
        <div
          className={cn(
            "text-[10px] font-black uppercase tracking-[0.18em] mt-1",
            isSelected ? "text-background/75" : "text-muted-foreground"
          )}
        >
          {exercise.muscleGroups[0]}
        </div>
      </div>
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center transition-transform border",
          isSelected
            ? "border-background/35 bg-background/15 text-background scale-105"
            : "border-border bg-secondary text-muted-foreground"
        )}
      >
        {isSelected ? (
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        ) : (
          <Plus className="w-3.5 h-3.5" />
        )}
      </div>
    </button>
  );
});

export function RoutineWizard({ open, onOpenChange, exercises, onCreate }: RoutineWizardProps) {
  const [routineName, setRoutineName] = useState("");
  const [frequency, setFrequency] = useState(3);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [showCelebration, setShowCelebration] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { setWizardOpen } = useWizard();

  // Track wizard open state for dock visibility
  useEffect(() => {
    if (!open) return;
    setWizardOpen(true);
    return () => setWizardOpen(false);
  }, [open, setWizardOpen]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setRoutineName("");
      setFrequency(3);
      setCurrentDayIndex(0);
      setVisibleCount(INITIAL_VISIBLE_COUNT);
      setShowCelebration(false);
    }
  }, [open]);

  useEffect(() => {
    setDays(
      Array.from({ length: frequency }, (_, i) => ({
        name: `Workout ${i + 1}`,
        exercises: [],
      }))
    );
  }, [frequency]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filteredExercises = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return exercises;
    }

    return exercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(normalizedQuery)
    );
  }, [exercises, searchQuery]);

  const visibleExercises = useMemo(
    () => filteredExercises.slice(0, visibleCount),
    [filteredExercises, visibleCount]
  );

  const selectedExerciseIdsByDay = useMemo(
    () => days.map((day) => new Set(day.exercises.map((exercise) => exercise._id))),
    [days]
  );

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) =>
      Math.min(filteredExercises.length, prev + LOAD_MORE_COUNT)
    );
  }, [filteredExercises.length]);

  useEffect(() => {
    if (!open || visibleCount >= filteredExercises.length) {
      return;
    }

    const root = scrollContainerRef.current;
    const target = sentinelRef.current;

    if (!root || !target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          handleLoadMore();
        }
      },
      {
        root,
        rootMargin: "120px 0px",
        threshold: 0.1,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [open, visibleCount, filteredExercises.length, handleLoadMore, currentDayIndex]);

  const toggleExercise = useCallback((exercise: ExerciseLibraryItem) => {
    setDays(prev => {
      const newDays = [...prev];
      const currentDay = { ...newDays[currentDayIndex] };
      const exists = currentDay.exercises.find(ex => ex._id === exercise._id);
      
      if (exists) {
        currentDay.exercises = currentDay.exercises.filter(ex => ex._id !== exercise._id);
      } else {
        currentDay.exercises = [...currentDay.exercises, exercise];
      }
      
      newDays[currentDayIndex] = currentDay;
      return newDays;
    });
  }, [currentDayIndex]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      setVisibleCount(INITIAL_VISIBLE_COUNT);
    },
    []
  );

  const steps: Step[] = [
    {
      id: "welcome",
      title: "Welcome",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
          <div className="flow-prompt-card space-y-4">
            <h1 className="text-4xl font-display font-black tracking-tight leading-tight flow-text">
              Build your perfect <br />
              <span className="flow-muted">training routine</span>
            </h1>
            <p className="flow-muted text-lg font-medium max-w-xs mx-auto leading-relaxed">
              Customized workouts that match your goals and schedule.
            </p>
          </div>
        </div>
      ),
      nextLabel: "Let's Go"
    },
    {
      id: "name",
      title: "Routine Name",
      isNextDisabled: !routineName,
      content: (
        <div className="space-y-8 py-10">
          <div className="flow-prompt-card space-y-2 text-center">
            <h2 className="text-3xl font-display font-black tracking-tight flow-text">Name your routine</h2>
            <p className="flow-muted font-medium italic">What should we call this program?</p>
          </div>
          <Input
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            placeholder="e.g. Hypertrophy Split"
            className="h-16 rounded-2xl px-6 text-2xl font-bold flow-surface flow-outline flow-text focus-visible:ring-[var(--flow-progress)]/20"
            autoFocus
          />
        </div>
      )
    },
    {
      id: "frequency",
      title: "Frequency",
      content: (
        <div className="space-y-8 py-10">
          <div className="flow-prompt-card space-y-2 text-center">
            <h2 className="text-3xl font-display font-black tracking-tight flow-text">Weekly Frequency</h2>
            <p className="flow-muted font-medium">How many unique workouts per routine?</p>
          </div>

          <div className="mx-auto flex w-full max-w-[15rem] flex-col gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <button
                key={num}
                onClick={() => setFrequency(num)}
                className={cn(
                  "h-14 rounded-2xl border text-2xl font-display font-black transition-all active:scale-95",
                  frequency === num
                    ? "flow-cta text-white border-transparent"
                    : "flow-surface flow-outline flow-text"
                )}
              >
                {num}
              </button>
            ))}
            <p className="pt-2 text-center text-sm flow-muted">{frequency} workouts per week selected</p>
          </div>
        </div>
      )
    },
    // Dynamic steps for workouts
    ...days.map((day, index) => ({
      id: `workout-${index}`,
      title: `Workout ${index + 1}`,
      onEnter: () => {
        setCurrentDayIndex(index);
        setVisibleCount(INITIAL_VISIBLE_COUNT);
      },
      isNextDisabled: days[index]?.exercises.length === 0,
      content: (
        <div className="flex-1 flex flex-col gap-6 min-h-0">
          <div className="flow-prompt-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                Workout {index + 1} of {frequency}
              </span>
              <span className="rounded-md border border-border bg-secondary px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
                {day.exercises.length} Selected
              </span>
            </div>
            <Input
              value={day.name}
              onChange={(e) => {
                const newDays = [...days];
                newDays[index].name = e.target.value;
                setDays(newDays);
              }}
              className="h-12 rounded-xl border border-border bg-secondary px-4 text-lg font-bold text-foreground focus-visible:ring-1 focus-visible:ring-primary/20"
              placeholder="Name this workout (e.g. Push Day)"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search exercises..."
              className="h-12 rounded-2xl border-border bg-secondary pl-11 text-foreground focus-visible:ring-1 focus-visible:ring-primary/20"
            />
          </div>

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4 space-y-2"
          >
            {visibleExercises.map((exercise) => (
              <RoutineExerciseRow
                key={exercise._id}
                exercise={exercise}
                isSelected={selectedExerciseIdsByDay[index]?.has(exercise._id) ?? false}
                onToggle={toggleExercise}
              />
            ))}

            {filteredExercises.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-secondary px-4 py-10 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  No exercises found
                </p>
              </div>
            )}

            {filteredExercises.length > 0 && (
              <p className="pt-1 text-center text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                Showing {visibleExercises.length} of {filteredExercises.length}
              </p>
            )}

            {visibleCount < filteredExercises.length && (
              <div className="space-y-2 pb-1">
                <div ref={sentinelRef} className="h-2 w-full" aria-hidden />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLoadMore}
                  className="w-full rounded-2xl border-border bg-card text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        </div>
      )
    }))
  ];

  // Handle skip - close wizard immediately
  const handleSkip = () => {
    onOpenChange(false);
  };

  if (showCelebration) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flow-theme flow-bg w-screen h-[100dvh] max-w-lg mx-auto rounded-none bg-background flex flex-col gap-0 p-0 overflow-hidden">
          {/* Exit Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full flow-surface border flow-outline flex items-center justify-center flow-muted hover:opacity-90 transition-all active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="w-32 h-32 flow-cta rounded-full flex items-center justify-center "
            >
              <Check className="w-16 h-16 text-white stroke-[4]" />
            </motion.div>
            <div className="flow-prompt-card space-y-4">
              <h1 className="text-4xl font-display font-black tracking-tight leading-tight flow-text">
                Ready to roll!
              </h1>
              <p className="flow-muted text-lg font-medium max-w-xs mx-auto leading-relaxed">
                Your routine is saved and ready for your first session.
              </p>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              variant="pillPrimary"
              size="pill"
              className="font-display w-full max-w-[20rem]"
            >
              Go to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <FlowWizard
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      className="w-screen h-[100dvh] max-w-lg mx-auto rounded-none"
      showCloseButton={true}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      onSkip={handleSkip}
      skipLabel="Skip"
      onComplete={async () => {
        await onCreate({
          name: routineName,
          days: days.map(day => ({
            name: day.name,
            exercises: day.exercises.map(ex => ({
              exerciseLibraryId: ex._id,
              exerciseName: ex.name,
              targetSets: 3,
              targetReps: "8-12",
            }))
          }))
        });
        setShowCelebration(true);
      }}
      completeLabel="Finish Routine"
    />
  );
}
