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

  const handleSelect = (exercise: ExerciseLibraryItem) => {
    onSelect(exercise);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col gap-0 p-0 overflow-hidden border-border bg-background sm:rounded-[2.5rem]">
        {/* Header Area */}
        <div className="pt-8 px-6 pb-4 space-y-6 shrink-0 bg-background/50 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Add Exercise</h2>
            <button 
              onClick={() => onOpenChange(false)}
              className="text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
            >
              Done
            </button>
          </div>

          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-muted-foreground transition-colors" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercises..."
                className="h-12 pl-11 pr-12 rounded-2xl bg-secondary border-border focus-visible:ring-1 focus-visible:ring-primary/20 text-base placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
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
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-muted-foreground border-border hover:border-border hover:text-muted-foreground"
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
                <div key={i} className="h-16 rounded-2xl bg-secondary animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              {/* Recent Exercises (Only when not searching/filtering) */}
              {!searchQuery && selectedMuscle === "All" && recentExercises.length > 0 && (
                <div className="py-4">
                  <h3 className="px-6 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-3">
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

              {/* All Exercises List */}
              <div className="py-2">
                {!searchQuery && selectedMuscle === "All" && (
                  <h3 className="px-6 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                    All Exercises
                  </h3>
                )}
                <div className="space-y-0.5 px-3">
                  {filteredExercises.length > 0 ? (
                    filteredExercises.map((exercise) => (
                      <ExerciseRowListItem
                        key={exercise._id}
                        exercise={exercise}
                        onSelect={handleSelect}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                      <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">No exercises found</p>
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedMuscle("All");
                        }}
                        className="mt-2 text-muted-foreground font-black uppercase text-[10px] tracking-[0.2em] hover:text-foreground transition-colors"
                      >
                        Clear filters
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-6 py-8">
                <button 
                  className="w-full h-16 rounded-2xl border border-dashed border-border flex items-center justify-center gap-3 text-muted-foreground hover:text-muted-foreground hover:border-border transition-all group"
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
      className="w-full text-left px-4 py-4 rounded-2xl hover:bg-secondary transition-all group flex items-center justify-between"
    >
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-lg text-foreground group-hover:text-foreground transition-colors leading-snug">
          {exercise.name}
        </div>
        <div className="text-[10px] font-bold text-muted-foreground group-hover:text-muted-foreground mt-1 uppercase tracking-[0.1em] flex items-center gap-2">
          <span>{exercise.muscleGroups.join(", ")}</span>
          {exercise.equipment && (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-muted" />
              <span className="opacity-70">{exercise.equipment}</span>
            </>
          )}
        </div>
      </div>
      <div className="shrink-0 ml-4 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
        <Plus className="w-4 h-4 text-muted-foreground" />
      </div>
    </button>
  );
}
