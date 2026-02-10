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
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises..."
            className="pr-8"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={cn(
                "px-2 py-1 text-xs rounded-md border transition-colors",
                selectedCategory === cat.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-secondary"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Muscle Group Filter */}
        <div className="flex gap-1 flex-wrap">
          {MUSCLE_GROUPS.map((muscle) => (
            <button
              key={muscle}
              type="button"
              onClick={() => setSelectedMuscle(muscle)}
              className={cn(
                "px-2 py-1 text-xs rounded-md border transition-colors",
                selectedMuscle === muscle
                  ? "bg-secondary text-secondary-foreground border-secondary"
                  : "bg-background border-border hover:bg-muted"
              )}
            >
              {muscle}
            </button>
          ))}
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
          {/* Recent Exercises */}
          {recentExercises.length > 0 && !searchQuery && selectedMuscle === "All" && selectedCategory === "all" && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-muted-foreground mb-2">
                Recent
              </h3>
              <div className="space-y-1">
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
            <div className="text-center py-8 text-muted-foreground">
              <p>No exercises found</p>
              {searchQuery && (
                <Button
                  variant="link"
                  onClick={() => setSearchQuery("")}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedLetters.map((letter) => (
                <div key={letter}>
                  <h3 className="text-xs font-medium text-muted-foreground mb-1 sticky top-0 bg-background py-1">
                    {letter}
                  </h3>
                  <div className="space-y-1">
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
      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors"
    >
      <div className="font-medium text-sm">{exercise.name}</div>
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <span>{exercise.muscleGroups.join(", ")}</span>
        {exercise.equipment && (
          <>
            <span>·</span>
            <span>{exercise.equipment}</span>
          </>
        )}
      </div>
    </button>
  );
}
