"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SetRow } from "./SetRow";
import { WorkoutExercise, WorkoutSet, calculateVolume, SetType } from "@/types/workout";
import { MoreHorizontal, History, ExternalLink, Trash2 } from "lucide-react";

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  exerciseNumber: number;
  onAddSet: (initialData?: {
    weight?: number;
    reps?: number;
    rpe?: number;
    setType?: SetType;
  }) => Promise<void>;
  onUpdateSet: (setId: string, data: Partial<WorkoutSet>) => void;
  onCompleteSet: (setId: string, data: { weight?: number; reps?: number; rpe?: number; rir?: number }) => Promise<{ isPR?: boolean; prType?: string }>;
  onDeleteSet: (setId: string) => void;
  onRemoveExercise: () => void;
  onStartRest: (seconds: number) => void;
  onViewHistory?: () => void;
  onViewTechnique?: (url: string) => void;
  previousPerformance?: {
    sets: { weight?: number; reps?: number }[];
  };
  isCollapsed?: boolean;
  supersetLabel?: string;
  defaultRestSeconds?: number;
}

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

export function ExerciseCard({
  exercise,
  exerciseNumber,
  onAddSet,
  onUpdateSet,
  onCompleteSet,
  onDeleteSet,
  onRemoveExercise,
  onStartRest,
  onViewHistory,
  onViewTechnique,
  previousPerformance,
  isCollapsed: initialCollapsed = false,
  supersetLabel,
  defaultRestSeconds = 90,
}: ExerciseCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!initialCollapsed);

  const completedSets = exercise.sets.filter((s) => s.isCompleted);
  const totalVolume = calculateVolume(exercise.sets);
  const prSets = exercise.sets.filter((s) => s.isPR);
  const isFullyCompleted = exercise.sets.length > 0 && completedSets.length === exercise.sets.length;

  // Auto-collapse when fully completed
  useEffect(() => {
    if (isFullyCompleted && isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isFullyCompleted, isExpanded]);

  const handleCompleteSet = async (setId: string, data: { weight?: number; reps?: number; rpe?: number; rir?: number }) => {
    const result = await onCompleteSet(setId, data);
    return result;
  };

  const handleRemove = () => {
    if (exercise.sets.some((s) => s.isCompleted)) {
      setIsRemoving(true);
    } else {
      onRemoveExercise();
    }
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] border border-border bg-card",
        showMenu && "z-50",
        isFullyCompleted && "opacity-80"
      )}
    >
      <style>{cloudStyles}</style>

      {/* Floating Clouds */}
      <div className="absolute -left-6 top-6 w-20 h-10 bg-gradient-to-br from-white/40 to-white/20 rounded-full blur-sm cloud-float" />
      <div className="absolute right-4 top-8 w-16 h-8 bg-gradient-to-br from-white/30 to-white/15 rounded-full blur-sm cloud-float-delayed" />
      <div className="absolute right-12 top-20 w-12 h-6 bg-gradient-to-br from-white/25 to-white/10 rounded-full blur-sm cloud-float-slow" />

      {/* Gradient Header */}
      <div className="relative bg-gradient-to-br from-[#4a7fc9] to-[#2f63bf] p-5 overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_30%,white_1px,transparent_1px)] bg-[length:20px_20px]" />

        {/* Superset indicator */}
        {supersetLabel && (
          <div className="absolute top-3 left-3 bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full">
            {supersetLabel}
          </div>
        )}

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Exercise Number Badge */}
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-black text-xl text-white">
              {exerciseNumber}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black text-white truncate">
                {exercise.exerciseName}
              </h3>
              <p className="text-sm text-white/80 mt-0.5">
                {completedSets.length}/{exercise.sets.length} sets
                {totalVolume > 0 && ` · ${totalVolume.toLocaleString()} lbs`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Badge */}
            <div className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wider ${
              isFullyCompleted
                ? "bg-green-400 text-green-950"
                : "bg-white/20 text-white"
            }`}>
              {isFullyCompleted ? "DONE" : "ACTIVE"}
            </div>

            {/* Menu Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>

              {showMenu && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                    aria-label="Close menu"
                  />
                  <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-xl border border-border bg-card py-1 shadow-lg">
                    {onViewHistory && (
                      <button
                        type="button"
                        onClick={() => {
                          onViewHistory();
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        <History className="h-4 w-4" />
                        History
                      </button>
                    )}
                    {exercise.techniqueUrl && onViewTechnique && (
                      <button
                        type="button"
                        onClick={() => {
                          onViewTechnique(exercise.techniqueUrl as string);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Technique
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        handleRemove();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-destructive hover:text-destructive/80 hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* PR indicator */}
        {prSets.length > 0 && (
          <div className="absolute bottom-3 right-5 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-yellow-300">
            <span>★</span>
            <span>{prSets.length} PR</span>
          </div>
        )}
      </div>

      {/* Expand/Collapse Button for completed exercises */}
      {isFullyCompleted && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2 bg-muted/50 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1"
        >
          {isExpanded ? "Hide Details" : "Show Details"}
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.span>
        </button>
      )}

      {/* Sets Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="space-y-1 p-4 pt-3">
              {/* Sets */}
              {exercise.sets.map((set, index) => (
                <SetRow
                  key={set._id}
                  setNumber={set.setNumber}
                  setType={set.setType}
                  weight={set.weight}
                  reps={set.reps}
                  rpe={set.rpe}
                  rir={set.rir}
                  restSeconds={exercise.restSeconds || defaultRestSeconds}
                  weightUnit={set.weightUnit}
                  isCompleted={set.isCompleted}
                  isPR={set.isPR}
                  previousWeight={previousPerformance?.sets[index]?.weight}
                  previousReps={previousPerformance?.sets[index]?.reps}
                  onComplete={(data) => handleCompleteSet(set._id, data)}
                  onUpdate={(data) => onUpdateSet(set._id, data as Partial<WorkoutSet>)}
                  onDelete={() => onDeleteSet(set._id)}
                  onStartRest={onStartRest}
                  showRpe={true}
                  showSetType={true}
                />
              ))}

              {/* Add Set Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const lastSet = exercise.sets[exercise.sets.length - 1];
                  void onAddSet(
                    lastSet
                      ? {
                          weight: lastSet.weight,
                          reps: lastSet.reps,
                          rpe: lastSet.rpe,
                          setType: lastSet.setType,
                        }
                      : undefined
                  );
                }}
                className="w-full mt-3 h-11 rounded-xl border-border text-xs font-black uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
              >
                + Add Set
              </Button>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm remove overlay */}
      {isRemoving && (
        <div className="absolute inset-0 bg-background/95 flex items-center justify-center p-4 z-30 rounded-[inherit]">
          <div className="text-center">
            <p className="text-sm font-medium mb-2">Remove exercise?</p>
            <p className="text-xs text-muted-foreground mb-4">
              This will delete {completedSets.length} completed set{completedSets.length !== 1 ? "s" : ""}.
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRemoving(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onRemoveExercise();
                  setIsRemoving(false);
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
