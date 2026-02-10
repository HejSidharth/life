import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User preferences and settings
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    weightUnit: v.optional(v.union(v.literal("lbs"), v.literal("kg"))),
    distanceUnit: v.optional(v.union(v.literal("km"), v.literal("miles"))),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  // Food entries with detailed nutrition
  foods: defineTable({
    userId: v.string(),
    name: v.string(),
    mealType: v.union(
      v.literal("breakfast"),
      v.literal("lunch"),
      v.literal("dinner"),
      v.literal("snack")
    ),
    calories: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    fiber: v.optional(v.number()),
    portionSize: v.string(),
    notes: v.optional(v.string()),
    consumedAt: v.number(),
    isFavorite: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "consumedAt"]),

  // ============================================
  // NEW EXERCISE TRACKING SYSTEM
  // ============================================

  // Exercise library (definitions of exercises)
  exerciseLibrary: defineTable({
    name: v.string(),
    category: v.union(
      v.literal("strength"),
      v.literal("cardio"),
      v.literal("flexibility"),
      v.literal("olympic"),
      v.literal("bodyweight"),
      v.literal("machine"),
      v.literal("other")
    ),
    muscleGroups: v.array(v.string()), // Primary muscles targeted
    secondaryMuscles: v.optional(v.array(v.string())),
    equipment: v.optional(v.string()), // Barbell, Dumbbell, Cable, Machine, etc.
    description: v.optional(v.string()),
    instructions: v.optional(v.array(v.string())), // Step by step instructions
    isBuiltIn: v.boolean(), // System-provided vs user-created
    userId: v.optional(v.string()), // For custom exercises
    createdAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_category", ["category"])
    .index("by_user", ["userId"])
    .searchIndex("search_name", { searchField: "name" }),

  // Workout sessions (container for exercises in a workout)
  workouts: defineTable({
    userId: v.string(),
    name: v.optional(v.string()), // "Push Day", "Leg Day", etc.
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    duration: v.optional(v.number()), // Total duration in minutes
    notes: v.optional(v.string()),
    templateId: v.optional(v.string()), // Reference to template used
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "startedAt"])
    .index("by_user_status", ["userId", "status"]),

  // Individual exercises within a workout
  workoutExercises: defineTable({
    workoutId: v.id("workouts"),
    userId: v.string(), // Denormalized for easier queries
    exerciseLibraryId: v.id("exerciseLibrary"), // Reference to exercise definition
    exerciseName: v.string(), // Denormalized for display
    order: v.number(), // Position in workout
    supersetGroup: v.optional(v.number()), // For grouping supersets (1, 2, 3...)
    notes: v.optional(v.string()),
    restSeconds: v.optional(v.number()), // Default rest between sets
    createdAt: v.number(),
  })
    .index("by_workout", ["workoutId"])
    .index("by_user", ["userId"])
    .index("by_exercise", ["exerciseLibraryId"]),

  // Individual sets within an exercise
  exerciseSets: defineTable({
    workoutExerciseId: v.id("workoutExercises"),
    workoutId: v.id("workouts"), // Denormalized for easier queries
    userId: v.string(), // Denormalized for easier queries
    exerciseLibraryId: v.id("exerciseLibrary"), // Denormalized for PR tracking
    setNumber: v.number(),
    setType: v.union(
      v.literal("warmup"),
      v.literal("working"),
      v.literal("drop"),
      v.literal("failure"),
      v.literal("rest_pause"),
      v.literal("backoff")
    ),
    // Weight tracking
    weight: v.optional(v.number()),
    weightUnit: v.union(v.literal("lbs"), v.literal("kg")),
    // Reps tracking
    reps: v.optional(v.number()),
    // Intensity tracking
    rpe: v.optional(v.number()), // Rate of Perceived Exertion (1-10)
    rir: v.optional(v.number()), // Reps in Reserve (0-5)
    // Time tracking (for timed exercises)
    durationSeconds: v.optional(v.number()),
    // Distance (for cardio within strength workouts)
    distance: v.optional(v.number()),
    distanceUnit: v.optional(v.union(v.literal("km"), v.literal("miles"), v.literal("m"))),
    // Rest tracking
    restSeconds: v.optional(v.number()), // Actual rest after this set
    // Status
    isCompleted: v.boolean(),
    completedAt: v.optional(v.number()),
    // PR tracking
    isPR: v.optional(v.boolean()), // Personal Record flag
    prType: v.optional(v.union(
      v.literal("weight"),
      v.literal("reps"),
      v.literal("volume"),
      v.literal("1rm")
    )),
    // Notes
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_workout_exercise", ["workoutExerciseId"])
    .index("by_workout", ["workoutId"])
    .index("by_user", ["userId"])
    .index("by_exercise", ["exerciseLibraryId"])
    .index("by_user_exercise", ["userId", "exerciseLibraryId"]),

  // Personal records per exercise
  personalRecords: defineTable({
    userId: v.string(),
    exerciseLibraryId: v.id("exerciseLibrary"),
    exerciseName: v.string(), // Denormalized for display
    recordType: v.union(
      v.literal("weight"), // Heaviest weight lifted
      v.literal("reps"), // Most reps at any weight
      v.literal("volume"), // Highest weight × reps
      v.literal("1rm"), // Estimated 1RM
      v.literal("duration") // Longest time (for planks, etc.)
    ),
    value: v.number(),
    weight: v.optional(v.number()), // Weight used (for context)
    reps: v.optional(v.number()), // Reps done (for context)
    weightUnit: v.optional(v.union(v.literal("lbs"), v.literal("kg"))),
    setId: v.id("exerciseSets"), // The set that achieved this PR
    achievedAt: v.number(),
    previousValue: v.optional(v.number()), // What the old PR was
  })
    .index("by_user", ["userId"])
    .index("by_exercise", ["exerciseLibraryId"])
    .index("by_user_exercise", ["userId", "exerciseLibraryId"])
    .index("by_user_exercise_type", ["userId", "exerciseLibraryId", "recordType"]),

  // Workout templates (saved routines)
  workoutTemplates: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    exercises: v.array(
      v.object({
        exerciseLibraryId: v.id("exerciseLibrary"),
        exerciseName: v.string(), // Denormalized
        order: v.number(),
        supersetGroup: v.optional(v.number()),
        targetSets: v.number(),
        targetReps: v.string(), // "8-12" or "5" or "AMRAP"
        targetRpe: v.optional(v.number()),
        restSeconds: v.optional(v.number()),
        notes: v.optional(v.string()),
      })
    ),
    useCount: v.number(),
    lastUsedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_name", ["userId", "name"]),

  // ============================================
  // LEGACY EXERCISE TABLE (keeping for backward compatibility)
  // ============================================
  exercises: defineTable({
    userId: v.string(),
    name: v.string(),
    type: v.union(
      v.literal("strength"),
      v.literal("cardio"),
      v.literal("flexibility"),
      v.literal("other")
    ),
    muscleGroups: v.array(v.string()),
    sets: v.optional(v.number()),
    reps: v.optional(v.number()),
    weight: v.optional(v.number()),
    weightUnit: v.optional(v.union(v.literal("lbs"), v.literal("kg"))),
    duration: v.optional(v.number()),
    distance: v.optional(v.number()),
    distanceUnit: v.optional(v.union(v.literal("km"), v.literal("miles"))),
    notes: v.optional(v.string()),
    performedAt: v.number(),
    isFavorite: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "performedAt"]),

  // Hydration tracking
  hydration: defineTable({
    userId: v.string(),
    beverageType: v.union(
      v.literal("water"),
      v.literal("coffee"),
      v.literal("tea"),
      v.literal("juice"),
      v.literal("other")
    ),
    amount: v.number(),
    notes: v.optional(v.string()),
    consumedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "consumedAt"]),

  // Daily goals
  goals: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal("calories"),
      v.literal("protein"),
      v.literal("carbs"),
      v.literal("fat"),
      v.literal("water"),
      v.literal("exercise_minutes")
    ),
    target: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "type"]),

  // Food favorites/templates
  foodFavorites: defineTable({
    userId: v.string(),
    name: v.string(),
    calories: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    fiber: v.optional(v.number()),
    portionSize: v.string(),
    useCount: v.number(),
    lastUsedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Exercise favorites/templates (legacy)
  exerciseFavorites: defineTable({
    userId: v.string(),
    name: v.string(),
    type: v.union(
      v.literal("strength"),
      v.literal("cardio"),
      v.literal("flexibility"),
      v.literal("other")
    ),
    muscleGroups: v.array(v.string()),
    defaultSets: v.optional(v.number()),
    defaultReps: v.optional(v.number()),
    defaultWeight: v.optional(v.number()),
    defaultDuration: v.optional(v.number()),
    useCount: v.number(),
    lastUsedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Personal API keys for OpenClaw
  apiKeys: defineTable({
    userId: v.string(),
    keyHash: v.string(),
    keyPrefix: v.string(),
    name: v.string(),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_key_hash", ["keyHash"]),
});
