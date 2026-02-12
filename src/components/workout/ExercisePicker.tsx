"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ExerciseLibraryItem, ExerciseCategory } from "@/types/workout";
import { Search, Plus } from "lucide-react";

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
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col gap-0 p-0 overflow-hidden border-zinc-900 bg-black sm:rounded-[2.5rem]">
        {/* Header Area */}
        <div className="pt-8 px-6 pb-4 space-y-6 shrink-0 bg-black/50 backdrop-blur-xl border-b border-zinc-900/50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Add Exercise</h2>
            <button 
              onClick={() => onOpenChange(false)}
              className="text-xs font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-300 transition-colors"
            >
              Done
            </button>
          </div>

          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-zinc-400 transition-colors" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercises..."
                className="h-12 pl-11 pr-12 rounded-2xl bg-zinc-900/50 border-zinc-800/50 focus-visible:ring-1 focus-visible:ring-white/20 text-base placeholder:text-zinc-700"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-300"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Muscle Filters */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-6 px-6">
              {MUSCLE_GROUPS.map((muscle) => (
                <button
                  key={muscle}
                  type="button"
                  onClick={() => setSelectedMuscle(muscle)}
                  className={cn(
                    "px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl border transition-all whitespace-nowrap",
                    selectedMuscle === muscle
                      ? "bg-white text-black border-white"
                      : "bg-zinc-900/50 text-zinc-600 border-zinc-800/50 hover:border-zinc-700 hover:text-zinc-400"
                  )}
                >
                  {muscle}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Exercise List Content */}
        <div className="flex-1 overflow-y-auto min-h-0 py-2">
          {isLoading ? (
            <div className="px-6 space-y-3 pt-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-zinc-900/30 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-zinc-900/50">
              {/* Recent Exercises (Only when not searching/filtering) */}
              {!searchQuery && selectedMuscle === "All" && recentExercises.length > 0 && (
                <div className="py-4">
                  <h3 className="px-6 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-700 mb-3">
                    Recently Used
                  </h3>
                  <div className="space-y-1 px-3">
                    {recentExercises.slice(0, 4).map((exercise) => (
                      <ExerciseRowListItem
                        key={`recent-${exercise._id}`}
                        exercise={exercise}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Alphabetical Sections */}
              {sortedLetters.length > 0 ? (
                sortedLetters.map((letter) => (
                  <div key={letter} className="py-2">
                    <h3 className="px-6 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-700 sticky top-0 bg-black/80 backdrop-blur-md z-10">
                      {letter}
                    </h3>
                    <div className="space-y-0.5 px-3">
                      {groupedExercises[letter].map((exercise) => (
                        <ExerciseRowListItem
                          key={exercise._id}
                          exercise={exercise}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <p className="text-zinc-600 font-bold uppercase text-xs tracking-widest">No exercises found</p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedMuscle("All");
                    }}
                    className="mt-2 text-zinc-700 font-black uppercase text-[10px] tracking-[0.2em] hover:text-white transition-colors"
                  >
                    Clear filters
                  </Button>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="px-6 py-8">
                <button 
                  className="w-full h-16 rounded-2xl border border-dashed border-zinc-800 flex items-center justify-center gap-3 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-all group"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Create Custom Exercise</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExerciseRowListItem({
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
      className="w-full text-left px-4 py-4 rounded-2xl hover:bg-white/[0.03] transition-all group flex items-center justify-between"
    >
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-lg text-zinc-300 group-hover:text-white transition-colors leading-snug">
          {exercise.name}
        </div>
        <div className="text-[10px] font-bold text-zinc-600 group-hover:text-zinc-500 mt-1 uppercase tracking-[0.1em] flex items-center gap-2">
          <span>{exercise.muscleGroups.join(", ")}</span>
          {exercise.equipment && (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-zinc-800" />
              <span className="opacity-70">{exercise.equipment}</span>
            </>
          )}
        </div>
      </div>
      <div className="shrink-0 ml-4 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
        <Plus className="w-4 h-4 text-zinc-600" />
      </div>
    </button>
  );
}
