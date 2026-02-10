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
  exercises: WorkoutExercise[];
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
  failure: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950",
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
