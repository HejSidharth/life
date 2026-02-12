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
    userId ? { userId, limit: 10 } : "skip"
  );

  const todayPlanSummary = useQuery(
    api.plans.getTodayPlanSummary,
    userId ? { userId, date: selectedDate.getTime() } : "skip"
  );

  const adherence = useQuery(
    api.plans.getAdherence,
    userId ? { userId } : "skip"
  );

  const catalogStats = useQuery(api.exerciseCatalog.getCatalogStats, {});
  const gymProfilesRaw = useQuery(
    api.gymProfiles.getForUser,
    userId ? { userId } : "skip"
  );

  const exerciseLibraryRaw = useQuery(api.exerciseLibrary.getExercises, {});
  const exerciseLibrary = exerciseLibraryRaw || [];
  const isLoadingLibrary = exerciseLibraryRaw === undefined;

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
  const createStarterProfile = useMutation(api.gymProfiles.createStarterProfile);
  const seedCatalog = useMutation(api.exerciseCatalog.seedCatalog);
  const seedPlanTemplates = useMutation(api.planTemplates.seedPlanTemplates);
  const seedFoodItems = useMutation(api.foodCatalog.seedPackagedFoods);
  const seedLegacyExerciseLibrary = useMutation(
    api.exerciseLibrary.seedExerciseLibrary
  );

  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showPlanSetupDialog, setShowPlanSetupDialog] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState("");
  const [planGoal, setPlanGoal] = useState<"strength" | "hypertrophy" | "general_fitness">("hypertrophy");
  const [planLevel, setPlanLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [planDays, setPlanDays] = useState("4");
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [hasAutoSeededLibrary, setHasAutoSeededLibrary] = useState(false);

  const activeWorkout = activeWorkoutRaw as Workout | null;
  const templates = (templatesRaw || []) as {
    _id: string;
    name: string;
    exercises: unknown[];
  }[];
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

  const handleStartEmptyWorkout = async () => {
    if (!userId) return;
    await startWorkout({
      userId,
      name: newWorkoutName || "Workout",
      startedAt: getLogTimestamp(),
      planDayId: planSummary?.planDayId as Id<"planDays"> | undefined,
      gymProfileId: defaultProfile?._id as Id<"gymProfiles"> | undefined,
    });
    setShowStartDialog(false);
    setNewWorkoutName("");
  };

  const handleStartTemplate = async (templateId: string) => {
    if (!userId) return;
    await startFromTemplate({
      templateId: templateId as Id<"workoutTemplates">,
      userId,
    });
  };

  const handleBootstrapDepthData = async () => {
    if (!userId || isBootstrapping) return;
    setIsBootstrapping(true);
    try {
      await seedCatalog({});
      await seedPlanTemplates({});
      await seedFoodItems({});
      await createStarterProfile({ userId });
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!userId) return;
    const ensuredProfile: Id<"gymProfiles"> = defaultProfile
      ? (defaultProfile._id as Id<"gymProfiles">)
      : ((await createStarterProfile({ userId })).profileId as Id<"gymProfiles">);
    await createDefaultPlan({
      userId,
      goal: planGoal,
      experienceLevel: planLevel,
      daysPerWeek: parseInt(planDays, 10),
      gymProfileId: ensuredProfile,
    });
    setShowPlanSetupDialog(false);
  };

  if (activeWorkout) {
    return (
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
              exerciseLibraryId: libId as Id<"exerciseLibrary">
            }).then(async (result: { setId: string }) => {
              if (!initialData) return;

              await completeSet({
                setId: result.setId as Id<"exerciseSets">,
                weight: initialData.weight,
                reps: initialData.reps,
                rpe: initialData.rpe,
              });
            })
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
        />
      </div>
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
        <p className="text-muted-foreground mt-1">
          {isToday ? "Track your progress and hit new PRs." : format(selectedDate, "MMMM do, yyyy")}
        </p>
      </motion.div>

      <Card className="border-border/40 bg-zinc-950/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Depth Status</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBootstrapDepthData}
              disabled={isBootstrapping}
            >
              {isBootstrapping ? "Seeding..." : "Initialize Catalog + Plans"}
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs uppercase tracking-wider">
            <div>
              <p className="text-zinc-500">Families</p>
              <p className="font-bold text-zinc-100">{catalogStats?.familyCount ?? 0}</p>
            </div>
            <div>
              <p className="text-zinc-500">Variants</p>
              <p className="font-bold text-zinc-100">{catalogStats?.variantCount ?? 0}</p>
            </div>
            <div>
              <p className="text-zinc-500">Plan Templates</p>
              <p className="font-bold text-zinc-100">{catalogStats?.planTemplateCount ?? 0}</p>
            </div>
            <div>
              <p className="text-zinc-500">Technique Links</p>
              <p className="font-bold text-zinc-100">{catalogStats?.techniqueMediaCount ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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

      <Card className="border-border/40 bg-zinc-950/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider">Adherence</p>
            <p className="text-xl font-bold text-zinc-100">
              {adherenceStats?.adherenceRate ?? 0}%
            </p>
            <p className="text-xs text-zinc-500">
              {adherenceStats?.completedCount ?? 0}/{adherenceStats?.plannedCount ?? 0} planned sessions completed
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowPlanSetupDialog(true)}>
            Plan Setup
          </Button>
        </CardContent>
      </Card>

      {/* Start Workout Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, ...springTransition }}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          transition={springTransition}
        >
          <Button
            onClick={() => setShowStartDialog(true)}
            className="w-full h-20 rounded-3xl bg-white text-black hover:bg-zinc-200 text-lg font-bold shadow-xl shadow-white/5"
          >
            {isToday ? "Start New Workout" : "Log Training Session"}
          </Button>
        </motion.div>
      </motion.div>

      {/* Templates Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-semibold">Templates</h2>
          <Button variant="ghost" size="sm" className="text-primary hover:bg-white/5">
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
              <motion.div
                key={template._id}
                variants={itemVariants}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={springTransition}
              >
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
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent History */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-semibold">Recent History</h2>
          <motion.button
            className="text-sm text-muted-foreground flex items-center hover:text-foreground transition-colors"
            whileHover={{ x: 4 }}
            transition={springTransition}
          >
            Full History
          </motion.button>
        </div>

        <div className="space-y-2">
          {recentWorkouts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No completed workouts yet.</p>
          ) : (
            recentWorkouts.map((workout) => (
              <motion.div
                key={workout._id}
                variants={itemVariants}
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={springTransition}
              >
                <Card className="border-border/40 bg-zinc-950/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-medium text-zinc-200">{workout.name}</h3>
                          <p className="text-xs text-zinc-500">
                            {new Date(workout.completedAt).toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })} · {workout.duration}m
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
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Start Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent className="rounded-3xl border-border bg-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">New Workout</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">
                Workout Name
              </label>
              <Input
                value={newWorkoutName}
                onChange={(e) => setNewWorkoutName(e.target.value)}
                placeholder="Upper Body, Leg Day, etc."
                className="h-14 rounded-2xl bg-zinc-900 border-0 text-lg focus-visible:ring-1 focus-visible:ring-white/20"
              />
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={springTransition}
            >
              <Button
                onClick={handleStartEmptyWorkout}
                className="w-full h-14 rounded-2xl bg-white text-black hover:bg-zinc-200 text-lg font-bold"
              >
                Start Workout
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPlanSetupDialog} onOpenChange={setShowPlanSetupDialog}>
        <DialogContent className="rounded-3xl border-border bg-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Plan Setup</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">
                Goal
              </label>
              <select
                className="h-12 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 text-sm"
                value={planGoal}
                onChange={(event) =>
                  setPlanGoal(event.target.value as "strength" | "hypertrophy" | "general_fitness")
                }
              >
                <option value="strength">Strength</option>
                <option value="hypertrophy">Hypertrophy</option>
                <option value="general_fitness">General Fitness</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">
                Experience
              </label>
              <select
                className="h-12 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 text-sm"
                value={planLevel}
                onChange={(event) =>
                  setPlanLevel(event.target.value as "beginner" | "intermediate" | "advanced")
                }
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">
                Days / Week
              </label>
              <Input
                type="number"
                min={3}
                max={6}
                value={planDays}
                onChange={(event) => setPlanDays(event.target.value)}
                className="h-12 rounded-xl bg-zinc-900 border-zinc-800"
              />
            </div>
            <Button onClick={handleCreatePlan} className="w-full h-12 rounded-xl">
              Create Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
