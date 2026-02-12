"use client";

import { motion } from "framer-motion";
import { useEffect, useState, Suspense } from "react";
import { 
  ChevronRight
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useActiveDate } from "@/hooks/use-active-date";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { WorkoutSession } from "@/components/workout/WorkoutSession";
import { ExerciseHistoryDialog } from "@/components/workout/ExerciseHistoryDialog";
import { WorkoutDetailDialog } from "@/components/workout/WorkoutDetailDialog";
import { RoutineWizard, RoutineData } from "@/components/workout/RoutineWizard";
import { PlanSetupFlow, PlanSetupData } from "@/components/workout/PlanSetupFlow";
import { NewWorkoutFlow } from "@/components/workout/NewWorkoutFlow";
import { WorkoutStarterDialog } from "@/components/workout/WorkoutStarterDialog";
import { WorkoutProgressHero } from "@/components/workout/WorkoutProgressHero";
import { ExerciseLibraryItem, Workout } from "@/types/workout";
import { format } from "date-fns";
import type { Id } from "convex/_generated/dataModel";

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springTransition,
  },
};

interface AdherenceStats {
  plannedCount: number;
  completedCount: number;
  adherenceRate: number;
}

interface GymProfileSummary {
  _id: string;
  isDefault: boolean;
}

interface PlanPrescriptionSummary {
  _id: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string;
}

interface PlanSummary {
  hasSession: boolean;
  progressId?: string;
  planDayId?: string;
  dayName?: string;
  focus?: string;
  estimatedMinutes?: number;
  prescriptions: PlanPrescriptionSummary[];
}

interface WorkoutCompletionResult {
  progressionDecision: string;
  decisionReason: string;
}

function toProgressionDecision(
  value: string
): "increase" | "hold" | "reduce" {
  if (value === "increase" || value === "hold" || value === "reduce") {
    return value;
  }
  return "hold";
}

function ExerciseContent() {
  const { user } = useUser();
  const userId = user?.id;

  const { selectedDate, isToday, getLogTimestamp } = useActiveDate();

  // Feature D: Full history toggle (must be before query that uses it)
  const [showFullHistory, setShowFullHistory] = useState(false);

  // Convex Queries
  const activeWorkoutRaw = useQuery(
    api.workouts.getActiveWorkout,
    userId ? { userId } : "skip"
  );
  
  const templatesRaw = useQuery(
    api.templates.getTemplates,
    userId ? { userId } : "skip"
  );
  
  const recentWorkoutsRaw = useQuery(
    api.workouts.getRecentWorkouts,
    userId ? { userId, limit: showFullHistory ? 50 : 10 } : "skip"
  );

  const todayPlanSummary = useQuery(
    api.plans.getTodayPlanSummary,
    userId ? { userId, date: selectedDate.getTime() } : "skip"
  );

  const adherence = useQuery(
    api.plans.getAdherence,
    userId ? { userId } : "skip"
  );


  const gymProfilesRaw = useQuery(
    api.gymProfiles.getForUser,
    userId ? { userId } : "skip"
  );

  const exerciseLibraryRaw = useQuery(api.exerciseLibrary.getExercises, {});
  const exerciseLibrary = exerciseLibraryRaw || [];
  const isLoadingLibrary = exerciseLibraryRaw === undefined;

  // Feature A: Fetch previous performances for exercises in active workout
  const exerciseLibraryIds = activeWorkoutRaw
    ? (activeWorkoutRaw as Workout).exercises.map(
        (e) => e.exerciseLibraryId as Id<"exerciseLibrary">
      )
    : [];
  const previousPerformancesRaw = useQuery(
    api.workouts.getLastPerformances,
    userId && activeWorkoutRaw && exerciseLibraryIds.length > 0
      ? {
          userId,
          exerciseLibraryIds,
          excludeWorkoutId: (activeWorkoutRaw as Workout)._id as Id<"workouts">,
        }
      : "skip"
  );

  // Feature B: Exercise history for the dialog
  const [historyExerciseId, setHistoryExerciseId] = useState<string | null>(null);
  const [historyExerciseName, setHistoryExerciseName] = useState("");
  const exerciseHistoryRaw = useQuery(
    api.workouts.getExerciseHistory,
    userId && historyExerciseId
      ? {
          userId,
          exerciseLibraryId: historyExerciseId as Id<"exerciseLibrary">,
        }
      : "skip"
  );

  // Feature C: Workout detail dialog
  const [detailWorkoutId, setDetailWorkoutId] = useState<string | null>(null);
  const workoutDetailRaw = useQuery(
    api.workouts.getWorkoutDetails,
    detailWorkoutId
      ? { workoutId: detailWorkoutId as Id<"workouts"> }
      : "skip"
  );

  // Convex Mutations
  const startWorkout = useMutation(api.workouts.startWorkout);
  const startFromTemplate = useMutation(api.templates.startWorkoutFromTemplate);
  const completeWorkout = useMutation(api.workouts.completeWorkout);
  const cancelWorkout = useMutation(api.workouts.cancelWorkout);
  const updateWorkoutName = useMutation(api.workouts.updateWorkoutName);
  const addExercise = useMutation(api.workouts.addExerciseToWorkout);
  const removeExercise = useMutation(api.workouts.removeExerciseFromWorkout);
  const addSet = useMutation(api.workouts.addSet);
  const updateSet = useMutation(api.workouts.updateSet);
  const completeSet = useMutation(api.workouts.completeSet);
  const deleteSet = useMutation(api.workouts.deleteSet);
  const markDayCompleted = useMutation(api.plans.markDayCompleted);
  const createDefaultPlan = useMutation(api.plans.createDefaultPlanForUser);
  const createCustomPlan = useMutation(api.customPlans.createCustomPlan);
  const assignTemplate = useMutation(api.plans.assignTemplate);
  const createTemplate = useMutation(api.templates.createTemplate);
  const seedLegacyExerciseLibrary = useMutation(
    api.exerciseLibrary.seedExerciseLibrary
  );

  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showStarterDialog, setShowStarterDialog] = useState(false);
  const [showPlanSetupDialog, setShowPlanSetupDialog] = useState(false);
  const [showRoutineWizard, setShowRoutineWizard] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [hasAutoSeededLibrary, setHasAutoSeededLibrary] = useState(false);

  const activeWorkout = activeWorkoutRaw as Workout | null;
  const templates = (templatesRaw || []) as {
    _id: string;
    name: string;
    exercises: unknown[];
  }[];

  // Listen for dock action
  useEffect(() => {
    const handleTrigger = () => {
      // Check if templates exist - if yes, show template picker, otherwise go straight to naming
      const hasTemplates = templates.length > 0;
      if (hasTemplates) {
        setShowStarterDialog(true);
      } else {
        setShowStartDialog(true);
      }
    };
    window.addEventListener("trigger-start-workout", handleTrigger);
    return () => window.removeEventListener("trigger-start-workout", handleTrigger);
  }, [templates.length]);
  const recentWorkouts = (recentWorkoutsRaw || []) as {
    _id: string;
    name: string;
    completedAt: number;
    duration: number;
    totalVolume: number;
    exerciseCount: number;
  }[];
  const planSummary = todayPlanSummary as PlanSummary | null;
  const profileList = (gymProfilesRaw || []) as GymProfileSummary[];
  const defaultProfile = profileList.find((profile) => profile.isDefault);
  const adherenceStats = adherence as AdherenceStats | undefined;

  useEffect(() => {
    if (!userId || hasAutoSeededLibrary || exerciseLibraryRaw === undefined) {
      return;
    }

    if ((exerciseLibraryRaw as ExerciseLibraryItem[]).length === 0) {
      setHasAutoSeededLibrary(true);
      void seedLegacyExerciseLibrary({});
    }
  }, [
    userId,
    hasAutoSeededLibrary,
    exerciseLibraryRaw,
    seedLegacyExerciseLibrary,
  ]);

  const handleStartEmptyWorkout = async (name: string) => {
    if (!userId) return;
    await startWorkout({
      userId,
      name: name || "Workout",
      startedAt: getLogTimestamp(),
    });
    setShowStartDialog(false);
  };

  const handleStartTemplate = async (templateId: string) => {
    if (!userId) return;
    await startFromTemplate({
      templateId: templateId as Id<"workoutTemplates">,
      userId,
    });
  };



  const handleCreatePlan = async (data: PlanSetupData) => {
    if (!userId) return;
    setIsBootstrapping(true);
    try {
      await createDefaultPlan({
        userId,
        goal: data.goal,
        experienceLevel: data.experienceLevel,
        daysPerWeek: data.daysPerWeek,
      });
      setShowPlanSetupDialog(false);
    } catch (error) {
      console.error("Failed to create plan:", error);
    } finally {
      setIsBootstrapping(false);
    }
  };

  if (activeWorkout) {
    return (
      <>
        <div className="max-w-lg mx-auto">
          <WorkoutSession
          workout={activeWorkout}
          exercises={exerciseLibrary as ExerciseLibraryItem[]}
          isLoadingExercises={isLoadingLibrary}
          onAddExercise={(libId) => 
            addExercise({ 
              workoutId: activeWorkout._id as Id<"workouts">, 
              userId: userId!, 
              exerciseLibraryId: libId as Id<"exerciseLibrary"> 
            }).then(() => {})
          }
          onRemoveExercise={(weId) => 
            removeExercise({ 
              workoutExerciseId: weId as Id<"workoutExercises"> 
            }).then(() => {})
          }
          onAddSet={(weId, libId, initialData) => 
            addSet({ 
              workoutExerciseId: weId as Id<"workoutExercises">,
              workoutId: activeWorkout._id as Id<"workouts">,
              userId: userId!,
              exerciseLibraryId: libId as Id<"exerciseLibrary">,
              ...initialData
            }).then(() => {})
          }
          onUpdateSet={(setId, data) => 
            updateSet({ 
              setId: setId as Id<"exerciseSets">, 
              ...data 
            }).then(() => {})
          }
          onCompleteSet={(setId, data) => 
            completeSet({ 
              setId: setId as Id<"exerciseSets">, 
              ...data 
            }) as Promise<{ isPR?: boolean; prType?: string }>
          }
          onDeleteSet={(setId) => 
            deleteSet({ setId: setId as Id<"exerciseSets"> }).then(() => {})
          }
          onUpdateWorkoutName={(name) => 
            updateWorkoutName({ 
              workoutId: activeWorkout._id as Id<"workouts">, 
              name 
            }).then(() => {})
          }
          onCompleteWorkout={() => 
            completeWorkout({ workoutId: activeWorkout._id as Id<"workouts"> }).then(async (result: WorkoutCompletionResult) => {
              if (userId && planSummary?.progressId) {
                await markDayCompleted({
                  userId,
                  progressId: planSummary.progressId as Id<"userPlanDayProgress">,
                  workoutId: activeWorkout._id as Id<"workouts">,
                  progressionDecision: toProgressionDecision(
                    result.progressionDecision
                  ),
                  decisionReason: result.decisionReason,
                });
              }
            })
          }
          onCancelWorkout={() => 
            cancelWorkout({ workoutId: activeWorkout._id as Id<"workouts"> }).then(() => {})
          }
          onViewExerciseTechnique={(url) => {
            window.open(url, "_blank", "noopener,noreferrer");
          }}
          previousPerformances={previousPerformancesRaw as Record<string, { sets: { weight?: number; reps?: number }[] }> | undefined}
          onViewExerciseHistory={(exerciseLibraryId, exerciseName) => {
            setHistoryExerciseId(exerciseLibraryId);
            setHistoryExerciseName(exerciseName);
          }}
        />
        </div>

        {/* Exercise History Dialog (Feature B) */}
        <ExerciseHistoryDialog
          open={historyExerciseId !== null}
          onOpenChange={(open) => {
            if (!open) setHistoryExerciseId(null);
          }}
          exerciseName={historyExerciseName}
          history={exerciseHistoryRaw ?? undefined}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
      >
        <h1 className="text-3xl font-bold tracking-tight">
          {isToday ? "Workouts" : format(selectedDate, "EEEE")}
        </h1>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground mt-1">
            {isToday ? "Track your progress and hit new PRs." : format(selectedDate, "MMMM do, yyyy")}
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-zinc-500 hover:text-white"
            onClick={() => setShowPlanSetupDialog(true)}
          >
            Plan Setup
          </Button>
        </div>
      </motion.div>

      {/* Progress Hero (BitePal Style) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, ...springTransition }}
      >
        <WorkoutProgressHero recentWorkouts={recentWorkouts} />
      </motion.div>

      {planSummary?.hasSession && (
        <Card className="border-border/40 bg-zinc-950/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-zinc-100">Today&apos;s Session: {planSummary.dayName}</h3>
                <p className="text-xs text-zinc-500">
                  {planSummary.focus} · {planSummary.estimatedMinutes} min · {planSummary.prescriptions.length} prescriptions
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowPlanSetupDialog(true)}>
                Adjust Plan
              </Button>
            </div>
            <div className="space-y-2">
              {planSummary.prescriptions.slice(0, 4).map((prescription) => (
                <div key={prescription._id} className="flex items-center justify-between text-xs bg-zinc-900/60 rounded-xl px-3 py-2">
                  <span className="text-zinc-200">{prescription.exerciseName}</span>
                  <span className="text-zinc-500">
                    {prescription.targetSets} x {prescription.targetReps}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}



      {/* Templates Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-semibold">Templates</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-white/5"
            onClick={() => setShowRoutineWizard(true)}
          >
            New
          </Button>
        </div>

        {templates.length === 0 ? (
          <div className="p-8 text-center bg-card rounded-3xl border border-dashed border-zinc-800">
            <p className="text-sm text-muted-foreground">Save your workouts as templates to quickly reuse them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates.map((template) => (
              <div key={template._id}>
                <Card
                  className="cursor-pointer overflow-hidden bg-card border-border/50 hover:border-white/20 transition-all shadow-sm"
                  onClick={() => handleStartTemplate(template._id)}
                >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-white">{template.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {template.exercises.length} exercises
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-600" />
                </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-semibold">Recent History</h2>
          <button
            className="text-sm text-muted-foreground flex items-center hover:text-foreground transition-colors"
            onClick={() => setShowFullHistory(!showFullHistory)}
          >
            {showFullHistory ? "Show Less" : "Full History"}
          </button>
        </div>

        <div className="space-y-2">
          {recentWorkouts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No completed workouts yet.</p>
          ) : (
            recentWorkouts.map((workout) => (
              <div key={workout._id}>
                <Card
                  className="border-border/40 bg-zinc-950/50 cursor-pointer hover:border-white/10 transition-colors"
                  onClick={() => setDetailWorkoutId(workout._id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-medium text-zinc-200">{workout.name}</h3>
                          <p className="text-xs text-zinc-500">
                            {format(new Date(workout.completedAt), "eee, MMM d")} · {workout.duration}m
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-xs font-bold text-zinc-300">
                            {workout.totalVolume.toLocaleString()} lbs
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider font-bold">
                          {workout.exerciseCount} Exercises
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Workout Detail Dialog (Feature C) */}
      <WorkoutDetailDialog
        open={detailWorkoutId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailWorkoutId(null);
        }}
        workout={workoutDetailRaw as Parameters<typeof WorkoutDetailDialog>[0]["workout"]}
        isLoading={detailWorkoutId !== null && workoutDetailRaw === undefined}
      />

      <RoutineWizard
        open={showRoutineWizard}
        onOpenChange={setShowRoutineWizard}
        exercises={exerciseLibrary}
        onCreate={async (data) => {
          if (!userId) return;
          const { planTemplateId } = await createCustomPlan({
            userId,
            name: data.name,
            days: data.days.map(day => ({
              ...day,
              exercises: day.exercises.map(ex => ({
                ...ex,
                exerciseLibraryId: ex.exerciseLibraryId as Id<"exerciseLibrary">
              }))
            })),
          });
          
          // Automatically assign the new custom plan
          await assignTemplate({
            userId,
            planTemplateId,
          });

          // Also create a workout template so it appears in the Templates section
          let order = 0;
          const templateExercises = data.days.flatMap(day => 
            day.exercises.map(ex => ({
              exerciseLibraryId: ex.exerciseLibraryId as Id<"exerciseLibrary">,
              exerciseName: ex.exerciseName,
              order: order++,
              targetSets: ex.targetSets,
              targetReps: ex.targetReps,
            }))
          );

          if (templateExercises.length > 0) {
            await createTemplate({
              userId,
              name: data.name,
              exercises: templateExercises,
            });
          }
        }}
      />

      <NewWorkoutFlow
        open={showStartDialog}
        onOpenChange={setShowStartDialog}
        onComplete={handleStartEmptyWorkout}
      />

      <WorkoutStarterDialog
        open={showStarterDialog}
        onOpenChange={setShowStarterDialog}
        templates={templates}
        onSelectTemplate={(templateId) => {
          setShowStarterDialog(false);
          void handleStartTemplate(templateId);
        }}
        onStartFromScratch={() => {
          setShowStartDialog(true);
        }}
      />

      <PlanSetupFlow
        open={showPlanSetupDialog}
        onOpenChange={setShowPlanSetupDialog}
        onComplete={handleCreatePlan}
      />
    </div>
  );
}

export default function ExercisePage() {
  return (
    <Suspense fallback={<div className="w-full h-32 animate-pulse bg-zinc-900 rounded-3xl" />}>
      <ExerciseContent />
    </Suspense>
  );
}
