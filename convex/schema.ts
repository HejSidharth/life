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
    foodItemId: v.optional(v.id("foodItems")),
    source: v.optional(
      v.union(
        v.literal("manual"),
        v.literal("usda"),
        v.literal("open_food_facts"),
        v.literal("imported")
      )
    ),
    sourceConfidence: v.optional(v.number()),
    barcode: v.optional(v.string()),
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
    movementPattern: v.optional(v.string()),
    difficultyTier: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
    contraindicationTags: v.optional(v.array(v.string())),
    variationKey: v.optional(v.string()),
    techniqueUrl: v.optional(v.string()),
    techniqueSource: v.optional(v.string()),
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
    planDayId: v.optional(v.id("planDays")),
    gymProfileId: v.optional(v.id("gymProfiles")),
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
    exerciseVariantId: v.optional(v.id("exerciseVariants")),
    movementPattern: v.optional(v.string()),
    difficultyTier: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
    techniqueUrl: v.optional(v.string()),
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

  movementPatterns: defineTable({
    key: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_key", ["key"]),

  equipmentTypes: defineTable({
    key: v.string(),
    name: v.string(),
    category: v.union(
      v.literal("free_weights"),
      v.literal("machines"),
      v.literal("bodyweight"),
      v.literal("cardio"),
      v.literal("accessory")
    ),
    createdAt: v.number(),
  }).index("by_key", ["key"]),

  contraindicationTags: defineTable({
    key: v.string(),
    label: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_key", ["key"]),

  exerciseFamilies: defineTable({
    name: v.string(),
    slug: v.string(),
    movementPatternKey: v.string(),
    primaryMuscles: v.array(v.string()),
    secondaryMuscles: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_pattern", ["movementPatternKey"]),

  exerciseVariants: defineTable({
    familyId: v.id("exerciseFamilies"),
    name: v.string(),
    slug: v.string(),
    equipmentKey: v.string(),
    category: v.union(
      v.literal("strength"),
      v.literal("cardio"),
      v.literal("flexibility"),
      v.literal("olympic"),
      v.literal("bodyweight"),
      v.literal("machine"),
      v.literal("other")
    ),
    difficultyTier: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    contraindicationTags: v.array(v.string()),
    cueNotes: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_family", ["familyId"])
    .index("by_equipment", ["equipmentKey"])
    .index("by_difficulty", ["difficultyTier"]),

  exerciseTechniqueMedia: defineTable({
    exerciseVariantId: v.id("exerciseVariants"),
    youtubeUrl: v.string(),
    sourceName: v.string(),
    difficulty: v.optional(v.string()),
    cueNotes: v.optional(v.array(v.string())),
    isPrimary: v.boolean(),
    createdAt: v.number(),
  }).index("by_variant", ["exerciseVariantId"]),

  gymProfiles: defineTable({
    userId: v.string(),
    name: v.string(),
    isDefault: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_default", ["userId", "isDefault"]),

  gymEquipment: defineTable({
    gymProfileId: v.id("gymProfiles"),
    equipmentKey: v.string(),
    maxLoad: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_profile", ["gymProfileId"])
    .index("by_profile_equipment", ["gymProfileId", "equipmentKey"]),

  planTemplates: defineTable({
    name: v.string(),
    slug: v.string(),
    goal: v.union(
      v.literal("strength"),
      v.literal("hypertrophy"),
      v.literal("general_fitness")
    ),
    experienceLevel: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    daysPerWeek: v.number(),
    sessionMinutes: v.number(),
    description: v.optional(v.string()),
    isBuiltIn: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_goal", ["goal"])
    .index("by_experience", ["experienceLevel"]),

  planBlocks: defineTable({
    planTemplateId: v.id("planTemplates"),
    blockOrder: v.number(),
    name: v.string(),
    weeks: v.number(),
    createdAt: v.number(),
  }).index("by_plan", ["planTemplateId"]),

  planWeeks: defineTable({
    planTemplateId: v.id("planTemplates"),
    blockId: v.optional(v.id("planBlocks")),
    weekNumber: v.number(),
    createdAt: v.number(),
  })
    .index("by_plan", ["planTemplateId"])
    .index("by_plan_week", ["planTemplateId", "weekNumber"]),

  planDays: defineTable({
    planTemplateId: v.id("planTemplates"),
    weekId: v.id("planWeeks"),
    dayNumber: v.number(),
    name: v.string(),
    focus: v.string(),
    estimatedMinutes: v.number(),
    createdAt: v.number(),
  })
    .index("by_week", ["weekId"])
    .index("by_plan", ["planTemplateId"]),

  planPrescriptions: defineTable({
    planDayId: v.id("planDays"),
    order: v.number(),
    exerciseVariantId: v.optional(v.id("exerciseVariants")),
    exerciseLibraryId: v.optional(v.id("exerciseLibrary")),
    targetSets: v.number(),
    targetReps: v.string(),
    targetRir: v.optional(v.number()),
    restSeconds: v.optional(v.number()),
    notes: v.optional(v.string()),
    substitutionTags: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_plan_day", ["planDayId"])
    .index("by_variant", ["exerciseVariantId"]),

  userPlanInstances: defineTable({
    userId: v.string(),
    planTemplateId: v.id("planTemplates"),
    gymProfileId: v.optional(v.id("gymProfiles")),
    startDate: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("paused"),
      v.literal("cancelled")
    ),
    goal: v.union(
      v.literal("strength"),
      v.literal("hypertrophy"),
      v.literal("general_fitness")
    ),
    daysPerWeek: v.number(),
    sessionMinutes: v.number(),
    exclusions: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  userPlanDayProgress: defineTable({
    planInstanceId: v.id("userPlanInstances"),
    userId: v.string(),
    planDayId: v.id("planDays"),
    scheduledDate: v.optional(v.number()),
    status: v.union(
      v.literal("planned"),
      v.literal("completed"),
      v.literal("skipped")
    ),
    workoutId: v.optional(v.id("workouts")),
    progressionDecision: v.optional(
      v.union(v.literal("increase"), v.literal("hold"), v.literal("reduce"))
    ),
    decisionReason: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_instance", ["planInstanceId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_plan_day", ["planDayId"]),

  foodItems: defineTable({
    name: v.string(),
    brand: v.optional(v.string()),
    barcode: v.optional(v.string()),
    source: v.union(
      v.literal("manual"),
      v.literal("usda"),
      v.literal("open_food_facts"),
      v.literal("imported")
    ),
    servingSize: v.number(),
    servingUnit: v.string(),
    calories: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    fiber: v.optional(v.number()),
    sodium: v.optional(v.number()),
    sugar: v.optional(v.number()),
    isVerified: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_barcode", ["barcode"])
    .index("by_name", ["name"]),

  foodNutrients: defineTable({
    foodItemId: v.id("foodItems"),
    nutrientKey: v.string(),
    amount: v.number(),
    unit: v.string(),
  })
    .index("by_food_item", ["foodItemId"])
    .index("by_nutrient", ["nutrientKey"]),

  foodCorrections: defineTable({
    userId: v.string(),
    foodItemId: v.id("foodItems"),
    barcode: v.optional(v.string()),
    field: v.string(),
    previousValue: v.string(),
    newValue: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_food_item", ["foodItemId"]),

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
