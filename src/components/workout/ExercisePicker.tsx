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

const DIFFICULTY_LEVELS = ["all", "beginner", "intermediate", "advanced"] as const;

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
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    (typeof DIFFICULTY_LEVELS)[number]
  >("all");
  const [selectedEquipment, setSelectedEquipment] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
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
      setSelectedDifficulty("all");
      setSelectedEquipment("all");
      setShowFilters(false);
    }
  };

  const hasActiveFilters =
    selectedMuscle !== "All" ||
    selectedCategory !== "all" ||
    selectedDifficulty !== "all" ||
    selectedEquipment !== "all";

  const activeFilterCount = [
    selectedMuscle !== "All",
    selectedCategory !== "all",
    selectedDifficulty !== "all",
    selectedEquipment !== "all",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedMuscle("All");
    setSelectedCategory("all");
    setSelectedDifficulty("all");
    setSelectedEquipment("all");
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

    if (selectedDifficulty !== "all") {
      const difficultyTier = exercise.difficultyTier ?? "beginner";
      if (difficultyTier !== selectedDifficulty) {
        return false;
      }
    }

    if (
      selectedEquipment !== "all" &&
      exercise.equipment?.toLowerCase() !== selectedEquipment
    ) {
      return false;
    }

    return true;
  });

  const equipmentOptions = [
    "all",
    ...Array.from(
      new Set(
        exercises
          .map((exercise) => exercise.equipment?.toLowerCase())
          .filter((equipment): equipment is string => Boolean(equipment))
      )
    ).sort(),
  ];

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
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col gap-6 p-6 sm:p-8">
        <DialogHeader className="p-0">
          <DialogTitle className="text-2xl font-black tracking-tight leading-none">Add Exercise</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercises..."
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

          {/* Filter toggle button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all",
                showFilters || hasActiveFilters
                  ? "bg-zinc-800 text-zinc-200 border-zinc-700"
                  : "bg-transparent text-zinc-600 border-zinc-800 hover:border-zinc-700 hover:text-zinc-400"
              )}
            >
              Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[10px] font-bold text-zinc-600 hover:text-zinc-300 transition-colors uppercase tracking-wider"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Collapsible filters */}
          {showFilters && (
            <div className="space-y-3 pb-2">
              {/* Category Filter */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700 px-1">Category</label>
                <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setSelectedCategory(cat.value)}
                      className={cn(
                        "px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.1em] rounded-lg border transition-all whitespace-nowrap",
                        selectedCategory === cat.value
                          ? "bg-white text-black border-white"
                          : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Muscle Group Filter */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700 px-1">Muscle</label>
                <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
                  {MUSCLE_GROUPS.map((muscle) => (
                    <button
                      key={muscle}
                      type="button"
                      onClick={() => setSelectedMuscle(muscle)}
                      className={cn(
                        "px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.1em] rounded-lg border transition-all whitespace-nowrap",
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

              {/* Difficulty Filter */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700 px-1">Difficulty</label>
                <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
                  {DIFFICULTY_LEVELS.map((difficulty) => (
                    <button
                      key={difficulty}
                      type="button"
                      onClick={() => setSelectedDifficulty(difficulty)}
                      className={cn(
                        "px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.1em] rounded-lg border transition-all whitespace-nowrap",
                        selectedDifficulty === difficulty
                          ? "bg-zinc-200 text-black border-zinc-200"
                          : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
                      )}
                    >
                      {difficulty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment Filter */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700 px-1">Equipment</label>
                <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
                  {equipmentOptions.map((equipment) => (
                    <button
                      key={equipment}
                      type="button"
                      onClick={() => setSelectedEquipment(equipment)}
                      className={cn(
                        "px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.1em] rounded-lg border transition-all whitespace-nowrap",
                        selectedEquipment === equipment
                          ? "bg-zinc-200 text-black border-zinc-200"
                          : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
                      )}
                    >
                      {equipment}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4 space-y-6">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-18 rounded-2xl bg-zinc-900/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Recent Exercises */}
              {recentExercises.length > 0 && !searchQuery && !hasActiveFilters && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-700 px-2">
                    Recently Used
                  </h3>
                  <div className="space-y-1.5">
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
                  {(searchQuery || hasActiveFilters) && (
                    <Button
                      variant="link"
                      onClick={() => {
                        setSearchQuery("");
                        clearAllFilters();
                      }}
                      className="mt-2 text-zinc-600 font-black uppercase text-[10px] tracking-[0.2em] hover:text-white transition-colors"
                    >
                      Clear search & filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedLetters.map((letter) => (
                    <div key={letter} className="space-y-1.5">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-700 px-2 sticky top-0 bg-black/95 backdrop-blur-sm py-2 z-10">
                        {letter}
                      </h3>
                      <div className="space-y-1.5">
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
      className="w-full text-left px-5 py-4 rounded-2xl bg-zinc-900/40 border border-zinc-900 hover:border-white/10 hover:bg-zinc-900 transition-all group"
    >
      <div className="font-bold text-base text-zinc-100 group-hover:text-white transition-colors leading-tight">{exercise.name}</div>
      <div className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-600 mt-1.5 flex items-center gap-2">
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
