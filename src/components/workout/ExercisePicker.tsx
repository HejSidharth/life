"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ExerciseLibraryItem, ExerciseCategory } from "@/types/workout";

interface ExercisePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exercise: ExerciseLibraryItem) => void;
  exercises: ExerciseLibraryItem[];
  recentExercises?: ExerciseLibraryItem[];
  isLoading?: boolean;
}

const MUSCLE_GROUPS = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Core",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Full Body",
];

const CATEGORIES: { value: ExerciseCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "strength", label: "Strength" },
  { value: "bodyweight", label: "Bodyweight" },
  { value: "machine", label: "Machine" },
  { value: "cardio", label: "Cardio" },
  { value: "olympic", label: "Olympic" },
  { value: "flexibility", label: "Flexibility" },
];

export function ExercisePicker({
  open,
  onOpenChange,
  onSelect,
  exercises,
  recentExercises = [],
  isLoading = false,
}: ExercisePickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | "all">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setSearchQuery("");
      setSelectedMuscle("All");
      setSelectedCategory("all");
    }
  };

  // Filter exercises
  const filteredExercises = exercises.filter((exercise) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!exercise.name.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Muscle group filter
    if (selectedMuscle !== "All") {
      if (
        !exercise.muscleGroups.includes(selectedMuscle) &&
        !exercise.secondaryMuscles?.includes(selectedMuscle)
      ) {
        return false;
      }
    }

    // Category filter
    if (selectedCategory !== "all") {
      if (exercise.category !== selectedCategory) {
        return false;
      }
    }

    return true;
  });

  // Group by first letter for alphabetical sections
  const groupedExercises = filteredExercises.reduce((acc, exercise) => {
    const letter = exercise.name[0].toUpperCase();
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(exercise);
    return acc;
  }, {} as Record<string, ExerciseLibraryItem[]>);

  const sortedLetters = Object.keys(groupedExercises).sort();

  const handleSelect = (exercise: ExerciseLibraryItem) => {
    onSelect(exercise);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col gap-8 p-8">
        <DialogHeader className="p-0">
          <DialogTitle className="text-3xl font-black tracking-tight leading-none">Add Exercise</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Search */}
          <div className="relative">
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library..."
              className="h-14 px-6 rounded-2xl bg-zinc-900 border-0 focus-visible:ring-1 focus-visible:ring-white/20 text-lg"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-300"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={cn(
                    "px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl border transition-all whitespace-nowrap",
                    selectedCategory === cat.value
                      ? "bg-white text-black border-white"
                      : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Muscle Group Filter */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {MUSCLE_GROUPS.map((muscle) => (
                <button
                  key={muscle}
                  type="button"
                  onClick={() => setSelectedMuscle(muscle)}
                  className={cn(
                    "px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl border transition-all whitespace-nowrap",
                    selectedMuscle === muscle
                      ? "bg-zinc-200 text-black border-zinc-200"
                      : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
                  )}
                >
                  {muscle}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4 space-y-8">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-zinc-900/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Recent Exercises */}
              {recentExercises.length > 0 && !searchQuery && selectedMuscle === "All" && selectedCategory === "all" && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-700 px-2">
                    Recently Used
                  </h3>
                  <div className="space-y-2">
                    {recentExercises.slice(0, 5).map((exercise) => (
                      <ExerciseListItem
                        key={exercise._id}
                        exercise={exercise}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Exercises */}
              {filteredExercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">No matching exercises</p>
                  {searchQuery && (
                    <Button
                      variant="link"
                      onClick={() => setSearchQuery("")}
                      className="mt-2 text-zinc-600 font-black uppercase text-[10px] tracking-[0.2em] hover:text-white transition-colors"
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {sortedLetters.map((letter) => (
                    <div key={letter} className="space-y-3">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-700 px-2 sticky top-0 bg-black/95 backdrop-blur-sm py-2 z-10">
                        {letter}
                      </h3>
                      <div className="space-y-2">
                        {groupedExercises[letter].map((exercise) => (
                          <ExerciseListItem
                            key={exercise._id}
                            exercise={exercise}
                            onSelect={handleSelect}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExerciseListItem({
  exercise,
  onSelect,
}: {
  exercise: ExerciseLibraryItem;
  onSelect: (exercise: ExerciseLibraryItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(exercise)}
      className="w-full text-left px-5 py-4 rounded-3xl bg-zinc-900/40 border border-zinc-900 hover:border-white/10 hover:bg-zinc-900 transition-all group"
    >
      <div className="font-bold text-lg text-zinc-100 group-hover:text-white transition-colors leading-tight">{exercise.name}</div>
      <div className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-600 mt-2 flex items-center gap-2">
        <span>{exercise.muscleGroups.join(", ")}</span>
        {exercise.equipment && (
          <>
            <span className="w-1 h-1 rounded-full bg-zinc-800" />
            <span>{exercise.equipment}</span>
          </>
        )}
      </div>
    </button>
  );
}
