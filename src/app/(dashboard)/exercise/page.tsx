"use client";

import { motion } from "framer-motion";
import { useEffect, useState, Suspense } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useActiveDate } from "@/hooks/use-active-date";
import { getDayPhase } from "@/lib/dayPhase";
import { Button } from "@/components/ui/button";
import { Zap, Dumbbell } from "lucide-react";
import { WorkoutSession } from "@/components/workout/WorkoutSession";
import { ExerciseHistoryDialog } from "@/components/workout/ExerciseHistoryDialog";
import { RoutineWizard } from "@/components/workout/RoutineWizard";
import { PlanSetupFlow, PlanSetupData } from "@/components/workout/PlanSetupFlow";
import { NewWorkoutFlow } from "@/components/workout/NewWorkoutFlow";
import { WorkoutStarterDialog } from "@/components/workout/WorkoutStarterDialog";
import { 
  TodayDayCard, 
  ActivePlanSection 
} from "@/components/workout";
import { ExerciseLibraryItem, Workout } from "@/types/workout";
import { MascotSceneHero } from "@/components/dashboard/MascotSceneHero";
import { format } from "date-fns";
import type { Id } from "convex/_generated/dataModel";

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

interface PlanForEditing {
  planInstanceId: string;
  planTemplateId: string;
  planName: string;
  goal: string;
  daysPerWeek: number;
  sessionMinutes: number;
  currentWeek: number;
  totalWeeks: number;
  completedDays: number;
  totalDays: number;
  nextWorkoutDay?: string;
  startDate: number;
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
  const dayPhase = getDayPhase();

  // Convex Queries
  const activeWorkoutRaw = useQuery(
    api.workouts.getActiveWorkout,
    userId ? { userId } : "skip"
  );
  
  const templatesRaw = useQuery(
    api.templates.getTemplates,
    userId ? { userId } : "skip"
  );

  const todayPlanSummary = useQuery(
    api.plans.getTodayPlanSummary,
    userId ? { userId, date: selectedDate.getTime() } : "skip"
  );

  const planForEditing = useQuery(
    api.plans.getPlanForEditing,
    userId ? { userId } : "skip"
  );

  const streakData = useQuery(
    api.workouts.getWorkoutStreak,
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

  // Dialog states
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showStarterDialog, setShowStarterDialog] = useState(false);
  const [showPlanSetupDialog, setShowPlanSetupDialog] = useState(false);
  const [showRoutineWizard, setShowRoutineWizard] = useState(false);
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

  const planSummary = todayPlanSummary as PlanSummary | null;
  const boltSlots = 4;
  const activeBolts = Math.min(
    boltSlots,
    Math.max(0, streakData?.streak ? Math.ceil(streakData.streak / 3) : 0)
  );

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
    try {
      const result = (await startWorkout({
        userId,
        name: name || "Workout",
        startedAt: getLogTimestamp(),
      })) as { error?: string };

      if (result?.error) {
        console.error("Unable to start workout:", result.error);
        window.alert(result.error);
        return;
      }

      setShowStartDialog(false);
    } catch (error) {
      console.error("Failed to start workout:", error);
      window.alert("Failed to start workout. Please try again.");
    }
  };

  const handleStartTemplate = async (templateId: string) => {
    if (!userId) return;
    try {
      const result = (await startFromTemplate({
        templateId: templateId as Id<"workoutTemplates">,
        userId,
      })) as { error?: string };

      if (result?.error) {
        console.error("Unable to start template workout:", result.error);
        window.alert(result.error);
      }
    } catch (error) {
      console.error("Failed to start workout from template:", error);
      window.alert("Failed to start workout from template. Please try again.");
    }
  };

  const handleCreatePlan = async (data: PlanSetupData) => {
    if (!userId) return;
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
    }
  };

  const handleStartWorkout = () => {
    if (templates.length > 0) {
      setShowStarterDialog(true);
    } else {
      setShowStartDialog(true);
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

  const planData = planForEditing as PlanForEditing | null | undefined;
  const hasActivePlan = !!planData;

  return (
    <div className="space-y-5 pb-10">
      {/* Hero Header */}
      <MascotSceneHero
        sceneKey="exercise"
        title={isToday ? "Workouts" : format(selectedDate, "EEEE")}
        subtitle={isToday ? `${dayPhase} · Build strength` : format(selectedDate, "MMMM do, yyyy")}
        dateLabel={format(selectedDate, "yyyy")}
        showMascot={false}
        sceneMode="sky"
        compact
        minHeight="10.375rem"
        skyColor="#2f63bf"
        className="pt-3"
        footer={(
          <div className="mt-1 flex items-center justify-start gap-2">
            {Array.from({ length: boltSlots }).map((_, index) => (
              <Zap
                key={`bolt-${index}`}
                className={`h-5 w-5 ${
                  index < activeBolts
                    ? "fill-[#ffd45a] text-[#ffd45a]"
                    : "text-white/45"
                }`}
                strokeWidth={2.5}
              />
            ))}
            <span className="ml-1 text-base font-black text-white">
              {streakData?.streak || 0}
            </span>
          </div>
        )}
      />

      {/* Today's Workout Card */}
      <TodayDayCard
        dayName={planSummary?.dayName}
        focus={planSummary?.focus}
        estimatedMinutes={planSummary?.estimatedMinutes}
        prescriptions={planSummary?.prescriptions || []}
        isRestDay={Boolean(!planSummary?.hasSession || (planSummary?.focus && planSummary.focus.toLowerCase().includes("rest")))}
        onStartWorkout={handleStartWorkout}
      />

      {/* Active Plan Section */}
      {hasActivePlan ? (
        <ActivePlanSection
          planName={planData.planName}
          currentWeek={planData.currentWeek}
          totalWeeks={planData.totalWeeks}
          completedDays={planData.completedDays}
          totalDays={planData.totalDays}
          nextWorkoutDay={planData.nextWorkoutDay}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="rounded-[1.75rem] border border-dashed border-border bg-card p-6 text-center">
            <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-black text-foreground mb-1">No Active Plan</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a training plan to get structured workouts
            </p>
            <Button
              onClick={() => setShowPlanSetupDialog(true)}
              className="rounded-full font-black uppercase tracking-wider"
            >
              Create Plan
            </Button>
          </div>
        </motion.div>
      )}

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
          
          await assignTemplate({
            userId,
            planTemplateId,
          });

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
          setShowStarterDialog(false);
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
    <Suspense fallback={<div className="w-full h-32 animate-pulse bg-secondary rounded-3xl" />}>
      <ExerciseContent />
    </Suspense>
  );
}
