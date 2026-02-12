// Shared types for workout tracking

export type SetType = "warmup" | "working" | "drop" | "failure" | "rest_pause" | "backoff";

export type ExerciseCategory = 
  | "strength"
  | "cardio"
  | "flexibility"
  | "olympic"
  | "bodyweight"
  | "machine"
  | "other";

export interface ExerciseLibraryItem {
  _id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroups: string[];
  secondaryMuscles?: string[];
  equipment?: string;
  description?: string;
  instructions?: string[];
  isBuiltIn: boolean;
  userId?: string;
  movementPattern?: string;
  difficultyTier?: "beginner" | "intermediate" | "advanced";
  contraindicationTags?: string[];
  variationKey?: string;
  techniqueUrl?: string;
  techniqueSource?: string;
}

export interface WorkoutSet {
  _id: string;
  workoutExerciseId: string;
  setNumber: number;
  setType: SetType;
  weight?: number;
  weightUnit: "lbs" | "kg";
  reps?: number;
  rpe?: number;
  rir?: number;
  durationSeconds?: number;
  restSeconds?: number;
  isCompleted: boolean;
  completedAt?: number;
  isPR?: boolean;
  prType?: "weight" | "reps" | "volume" | "1rm";
  notes?: string;
}

export interface WorkoutExercise {
  _id: string;
  workoutId: string;
  exerciseLibraryId: string;
  exerciseName: string;
  order: number;
  supersetGroup?: number;
  notes?: string;
  restSeconds?: number;
  exerciseVariantId?: string;
  movementPattern?: string;
  difficultyTier?: "beginner" | "intermediate" | "advanced";
  techniqueUrl?: string;
  sets: WorkoutSet[];
}

export interface Workout {
  _id: string;
  userId: string;
  name?: string;
  status: "in_progress" | "completed" | "cancelled";
  startedAt: number;
  completedAt?: number;
  duration?: number;
  notes?: string;
  templateId?: string;
  planDayId?: string;
  gymProfileId?: string;
  exercises: WorkoutExercise[];
}

export interface ExerciseFamily {
  _id: string;
  name: string;
  slug: string;
  movementPatternKey: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
}

export interface ExerciseVariant {
  _id: string;
  familyId: string;
  name: string;
  slug: string;
  equipmentKey: string;
  category: ExerciseCategory;
  difficultyTier: "beginner" | "intermediate" | "advanced";
  contraindicationTags: string[];
  cueNotes?: string[];
}

export interface TechniqueMedia {
  _id: string;
  exerciseVariantId: string;
  youtubeUrl: string;
  sourceName: string;
  difficulty?: string;
  cueNotes?: string[];
  isPrimary: boolean;
}

export interface PlanDayPrescription {
  _id: string;
  planDayId: string;
  order: number;
  exerciseVariantId?: string;
  exerciseLibraryId?: string;
  targetSets: number;
  targetReps: string;
  targetRir?: number;
  restSeconds?: number;
  notes?: string;
}

export interface PlanTemplate {
  _id: string;
  name: string;
  slug: string;
  goal: "strength" | "hypertrophy" | "general_fitness";
  experienceLevel: "beginner" | "intermediate" | "advanced";
  daysPerWeek: number;
  sessionMinutes: number;
  description?: string;
}

export interface PlanInstance {
  _id: string;
  userId: string;
  planTemplateId: string;
  gymProfileId?: string;
  startDate: number;
  status: "active" | "completed" | "paused" | "cancelled";
  goal: "strength" | "hypertrophy" | "general_fitness";
  daysPerWeek: number;
  sessionMinutes: number;
}

export interface ProgressionDecision {
  progressionDecision: "increase" | "hold" | "reduce";
  decisionReason: string;
}

export interface GymProfile {
  _id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  notes?: string;
  equipment: {
    _id: string;
    gymProfileId: string;
    equipmentKey: string;
    maxLoad?: number;
    notes?: string;
  }[];
}

export interface PackagedFoodItem {
  _id: string;
  name: string;
  brand?: string;
  barcode?: string;
  source: "manual" | "usda" | "open_food_facts" | "imported";
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  isVerified: boolean;
}

export interface FoodProvenance {
  source: "manual" | "usda" | "open_food_facts" | "imported";
  confidence?: number;
  barcode?: string;
}

export interface WorkoutTemplate {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  exercises: {
    exerciseLibraryId: string;
    exerciseName: string;
    order: number;
    supersetGroup?: number;
    targetSets: number;
    targetReps: string;
    targetRpe?: number;
    restSeconds?: number;
    notes?: string;
  }[];
  useCount: number;
  lastUsedAt?: number;
}

export interface PersonalRecord {
  _id: string;
  userId: string;
  exerciseLibraryId: string;
  exerciseName: string;
  recordType: "weight" | "reps" | "volume" | "1rm" | "duration";
  value: number;
  weight?: number;
  reps?: number;
  weightUnit?: "lbs" | "kg";
  achievedAt: number;
  previousValue?: number;
}

// Helper functions
export const SET_TYPE_LABELS: Record<SetType, string> = {
  warmup: "Warm-up",
  working: "Working",
  drop: "Drop Set",
  failure: "To Failure",
  rest_pause: "Rest-Pause",
  backoff: "Back-off",
};

export const SET_TYPE_COLORS: Record<SetType, string> = {
  warmup: "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950",
  working: "text-primary bg-primary/10",
  drop: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950",
  failure: "text-destructive bg-destructive/10",
  rest_pause: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
  backoff: "text-muted-foreground bg-muted",
};

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function formatWeight(weight: number, unit: "lbs" | "kg"): string {
  return `${weight} ${unit}`;
}

export function calculate1RM(weight: number, reps: number): number {
  // Epley formula: 1RM = weight × (1 + reps/30)
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export function calculateVolume(sets: WorkoutSet[]): number {
  return sets
    .filter((s) => s.isCompleted && s.weight && s.reps)
    .reduce((acc, s) => acc + (s.weight || 0) * (s.reps || 0), 0);
}
