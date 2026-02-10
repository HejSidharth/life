import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Seed data for common exercises
const BUILT_IN_EXERCISES = [
  // CHEST
  { name: "Barbell Bench Press", category: "strength", muscleGroups: ["Chest"], secondaryMuscles: ["Triceps", "Shoulders"], equipment: "Barbell" },
  { name: "Incline Barbell Bench Press", category: "strength", muscleGroups: ["Chest"], secondaryMuscles: ["Triceps", "Shoulders"], equipment: "Barbell" },
  { name: "Decline Barbell Bench Press", category: "strength", muscleGroups: ["Chest"], secondaryMuscles: ["Triceps"], equipment: "Barbell" },
  { name: "Dumbbell Bench Press", category: "strength", muscleGroups: ["Chest"], secondaryMuscles: ["Triceps", "Shoulders"], equipment: "Dumbbell" },
  { name: "Incline Dumbbell Press", category: "strength", muscleGroups: ["Chest"], secondaryMuscles: ["Triceps", "Shoulders"], equipment: "Dumbbell" },
  { name: "Dumbbell Flyes", category: "strength", muscleGroups: ["Chest"], secondaryMuscles: [], equipment: "Dumbbell" },
  { name: "Cable Flyes", category: "strength", muscleGroups: ["Chest"], secondaryMuscles: [], equipment: "Cable" },
  { name: "Push-ups", category: "bodyweight", muscleGroups: ["Chest"], secondaryMuscles: ["Triceps", "Shoulders", "Core"], equipment: "Bodyweight" },
  { name: "Chest Dips", category: "bodyweight", muscleGroups: ["Chest"], secondaryMuscles: ["Triceps", "Shoulders"], equipment: "Bodyweight" },
  { name: "Machine Chest Press", category: "machine", muscleGroups: ["Chest"], secondaryMuscles: ["Triceps"], equipment: "Machine" },
  { name: "Pec Deck", category: "machine", muscleGroups: ["Chest"], secondaryMuscles: [], equipment: "Machine" },

  // BACK
  { name: "Barbell Row", category: "strength", muscleGroups: ["Back"], secondaryMuscles: ["Biceps", "Core"], equipment: "Barbell" },
  { name: "Pendlay Row", category: "strength", muscleGroups: ["Back"], secondaryMuscles: ["Biceps", "Core"], equipment: "Barbell" },
  { name: "Dumbbell Row", category: "strength", muscleGroups: ["Back"], secondaryMuscles: ["Biceps"], equipment: "Dumbbell" },
  { name: "Pull-ups", category: "bodyweight", muscleGroups: ["Back"], secondaryMuscles: ["Biceps", "Core"], equipment: "Bodyweight" },
  { name: "Chin-ups", category: "bodyweight", muscleGroups: ["Back"], secondaryMuscles: ["Biceps"], equipment: "Bodyweight" },
  { name: "Lat Pulldown", category: "machine", muscleGroups: ["Back"], secondaryMuscles: ["Biceps"], equipment: "Cable" },
  { name: "Seated Cable Row", category: "machine", muscleGroups: ["Back"], secondaryMuscles: ["Biceps"], equipment: "Cable" },
  { name: "T-Bar Row", category: "strength", muscleGroups: ["Back"], secondaryMuscles: ["Biceps"], equipment: "Barbell" },
  { name: "Face Pulls", category: "strength", muscleGroups: ["Back"], secondaryMuscles: ["Shoulders"], equipment: "Cable" },
  { name: "Deadlift", category: "strength", muscleGroups: ["Back"], secondaryMuscles: ["Hamstrings", "Glutes", "Core"], equipment: "Barbell" },
  { name: "Romanian Deadlift", category: "strength", muscleGroups: ["Back"], secondaryMuscles: ["Hamstrings", "Glutes"], equipment: "Barbell" },
  { name: "Rack Pulls", category: "strength", muscleGroups: ["Back"], secondaryMuscles: ["Glutes", "Traps"], equipment: "Barbell" },

  // SHOULDERS
  { name: "Overhead Press", category: "strength", muscleGroups: ["Shoulders"], secondaryMuscles: ["Triceps", "Core"], equipment: "Barbell" },
  { name: "Seated Dumbbell Press", category: "strength", muscleGroups: ["Shoulders"], secondaryMuscles: ["Triceps"], equipment: "Dumbbell" },
  { name: "Arnold Press", category: "strength", muscleGroups: ["Shoulders"], secondaryMuscles: ["Triceps"], equipment: "Dumbbell" },
  { name: "Lateral Raises", category: "strength", muscleGroups: ["Shoulders"], secondaryMuscles: [], equipment: "Dumbbell" },
  { name: "Front Raises", category: "strength", muscleGroups: ["Shoulders"], secondaryMuscles: [], equipment: "Dumbbell" },
  { name: "Reverse Flyes", category: "strength", muscleGroups: ["Shoulders"], secondaryMuscles: ["Back"], equipment: "Dumbbell" },
  { name: "Upright Row", category: "strength", muscleGroups: ["Shoulders"], secondaryMuscles: ["Traps"], equipment: "Barbell" },
  { name: "Shrugs", category: "strength", muscleGroups: ["Traps"], secondaryMuscles: [], equipment: "Dumbbell" },
  { name: "Barbell Shrugs", category: "strength", muscleGroups: ["Traps"], secondaryMuscles: [], equipment: "Barbell" },

  // ARMS - BICEPS
  { name: "Barbell Curl", category: "strength", muscleGroups: ["Biceps"], secondaryMuscles: ["Forearms"], equipment: "Barbell" },
  { name: "EZ Bar Curl", category: "strength", muscleGroups: ["Biceps"], secondaryMuscles: ["Forearms"], equipment: "Barbell" },
  { name: "Dumbbell Curl", category: "strength", muscleGroups: ["Biceps"], secondaryMuscles: ["Forearms"], equipment: "Dumbbell" },
  { name: "Hammer Curl", category: "strength", muscleGroups: ["Biceps"], secondaryMuscles: ["Forearms"], equipment: "Dumbbell" },
  { name: "Incline Dumbbell Curl", category: "strength", muscleGroups: ["Biceps"], secondaryMuscles: [], equipment: "Dumbbell" },
  { name: "Preacher Curl", category: "strength", muscleGroups: ["Biceps"], secondaryMuscles: [], equipment: "Barbell" },
  { name: "Cable Curl", category: "strength", muscleGroups: ["Biceps"], secondaryMuscles: [], equipment: "Cable" },
  { name: "Concentration Curl", category: "strength", muscleGroups: ["Biceps"], secondaryMuscles: [], equipment: "Dumbbell" },

  // ARMS - TRICEPS
  { name: "Close Grip Bench Press", category: "strength", muscleGroups: ["Triceps"], secondaryMuscles: ["Chest"], equipment: "Barbell" },
  { name: "Tricep Pushdown", category: "strength", muscleGroups: ["Triceps"], secondaryMuscles: [], equipment: "Cable" },
  { name: "Overhead Tricep Extension", category: "strength", muscleGroups: ["Triceps"], secondaryMuscles: [], equipment: "Dumbbell" },
  { name: "Skull Crushers", category: "strength", muscleGroups: ["Triceps"], secondaryMuscles: [], equipment: "Barbell" },
  { name: "Tricep Dips", category: "bodyweight", muscleGroups: ["Triceps"], secondaryMuscles: ["Chest", "Shoulders"], equipment: "Bodyweight" },
  { name: "Diamond Push-ups", category: "bodyweight", muscleGroups: ["Triceps"], secondaryMuscles: ["Chest"], equipment: "Bodyweight" },
  { name: "Tricep Kickbacks", category: "strength", muscleGroups: ["Triceps"], secondaryMuscles: [], equipment: "Dumbbell" },

  // LEGS - QUADS
  { name: "Barbell Squat", category: "strength", muscleGroups: ["Quads"], secondaryMuscles: ["Glutes", "Hamstrings", "Core"], equipment: "Barbell" },
  { name: "Front Squat", category: "strength", muscleGroups: ["Quads"], secondaryMuscles: ["Glutes", "Core"], equipment: "Barbell" },
  { name: "Goblet Squat", category: "strength", muscleGroups: ["Quads"], secondaryMuscles: ["Glutes", "Core"], equipment: "Dumbbell" },
  { name: "Leg Press", category: "machine", muscleGroups: ["Quads"], secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Machine" },
  { name: "Hack Squat", category: "machine", muscleGroups: ["Quads"], secondaryMuscles: ["Glutes"], equipment: "Machine" },
  { name: "Leg Extension", category: "machine", muscleGroups: ["Quads"], secondaryMuscles: [], equipment: "Machine" },
  { name: "Walking Lunges", category: "strength", muscleGroups: ["Quads"], secondaryMuscles: ["Glutes", "Hamstrings"], equipment: "Dumbbell" },
  { name: "Bulgarian Split Squat", category: "strength", muscleGroups: ["Quads"], secondaryMuscles: ["Glutes"], equipment: "Dumbbell" },
  { name: "Step-ups", category: "strength", muscleGroups: ["Quads"], secondaryMuscles: ["Glutes"], equipment: "Dumbbell" },

  // LEGS - HAMSTRINGS & GLUTES
  { name: "Leg Curl", category: "machine", muscleGroups: ["Hamstrings"], secondaryMuscles: [], equipment: "Machine" },
  { name: "Stiff Leg Deadlift", category: "strength", muscleGroups: ["Hamstrings"], secondaryMuscles: ["Glutes", "Back"], equipment: "Barbell" },
  { name: "Good Mornings", category: "strength", muscleGroups: ["Hamstrings"], secondaryMuscles: ["Back", "Glutes"], equipment: "Barbell" },
  { name: "Hip Thrust", category: "strength", muscleGroups: ["Glutes"], secondaryMuscles: ["Hamstrings"], equipment: "Barbell" },
  { name: "Glute Bridge", category: "bodyweight", muscleGroups: ["Glutes"], secondaryMuscles: ["Hamstrings"], equipment: "Bodyweight" },
  { name: "Cable Pull Through", category: "strength", muscleGroups: ["Glutes"], secondaryMuscles: ["Hamstrings"], equipment: "Cable" },
  { name: "Sumo Deadlift", category: "strength", muscleGroups: ["Glutes"], secondaryMuscles: ["Quads", "Back"], equipment: "Barbell" },

  // LEGS - CALVES
  { name: "Standing Calf Raise", category: "strength", muscleGroups: ["Calves"], secondaryMuscles: [], equipment: "Machine" },
  { name: "Seated Calf Raise", category: "strength", muscleGroups: ["Calves"], secondaryMuscles: [], equipment: "Machine" },
  { name: "Donkey Calf Raise", category: "strength", muscleGroups: ["Calves"], secondaryMuscles: [], equipment: "Machine" },

  // CORE
  { name: "Plank", category: "bodyweight", muscleGroups: ["Core"], secondaryMuscles: [], equipment: "Bodyweight" },
  { name: "Side Plank", category: "bodyweight", muscleGroups: ["Core"], secondaryMuscles: ["Obliques"], equipment: "Bodyweight" },
  { name: "Hanging Leg Raise", category: "bodyweight", muscleGroups: ["Core"], secondaryMuscles: [], equipment: "Bodyweight" },
  { name: "Cable Crunch", category: "strength", muscleGroups: ["Core"], secondaryMuscles: [], equipment: "Cable" },
  { name: "Ab Wheel Rollout", category: "bodyweight", muscleGroups: ["Core"], secondaryMuscles: [], equipment: "Ab Wheel" },
  { name: "Russian Twist", category: "bodyweight", muscleGroups: ["Core"], secondaryMuscles: ["Obliques"], equipment: "Bodyweight" },
  { name: "Bicycle Crunch", category: "bodyweight", muscleGroups: ["Core"], secondaryMuscles: ["Obliques"], equipment: "Bodyweight" },
  { name: "Dead Bug", category: "bodyweight", muscleGroups: ["Core"], secondaryMuscles: [], equipment: "Bodyweight" },
  { name: "Bird Dog", category: "bodyweight", muscleGroups: ["Core"], secondaryMuscles: ["Back"], equipment: "Bodyweight" },
  { name: "Pallof Press", category: "strength", muscleGroups: ["Core"], secondaryMuscles: ["Obliques"], equipment: "Cable" },

  // OLYMPIC LIFTS
  { name: "Power Clean", category: "olympic", muscleGroups: ["Full Body"], secondaryMuscles: ["Back", "Shoulders", "Legs"], equipment: "Barbell" },
  { name: "Clean and Jerk", category: "olympic", muscleGroups: ["Full Body"], secondaryMuscles: [], equipment: "Barbell" },
  { name: "Snatch", category: "olympic", muscleGroups: ["Full Body"], secondaryMuscles: [], equipment: "Barbell" },
  { name: "Hang Clean", category: "olympic", muscleGroups: ["Full Body"], secondaryMuscles: ["Back", "Shoulders"], equipment: "Barbell" },
  { name: "Push Press", category: "olympic", muscleGroups: ["Shoulders"], secondaryMuscles: ["Legs", "Core"], equipment: "Barbell" },

  // CARDIO
  { name: "Treadmill Running", category: "cardio", muscleGroups: ["Cardio"], secondaryMuscles: ["Legs"], equipment: "Treadmill" },
  { name: "Treadmill Walking", category: "cardio", muscleGroups: ["Cardio"], secondaryMuscles: ["Legs"], equipment: "Treadmill" },
  { name: "Stationary Bike", category: "cardio", muscleGroups: ["Cardio"], secondaryMuscles: ["Legs"], equipment: "Bike" },
  { name: "Elliptical", category: "cardio", muscleGroups: ["Cardio"], secondaryMuscles: ["Legs"], equipment: "Elliptical" },
  { name: "Rowing Machine", category: "cardio", muscleGroups: ["Cardio"], secondaryMuscles: ["Back", "Arms", "Legs"], equipment: "Rower" },
  { name: "Stair Climber", category: "cardio", muscleGroups: ["Cardio"], secondaryMuscles: ["Legs", "Glutes"], equipment: "Stair Machine" },
  { name: "Jump Rope", category: "cardio", muscleGroups: ["Cardio"], secondaryMuscles: ["Calves"], equipment: "Jump Rope" },
  { name: "Battle Ropes", category: "cardio", muscleGroups: ["Cardio"], secondaryMuscles: ["Arms", "Shoulders", "Core"], equipment: "Battle Ropes" },
  { name: "Box Jumps", category: "cardio", muscleGroups: ["Cardio"], secondaryMuscles: ["Legs"], equipment: "Plyo Box" },
  { name: "Burpees", category: "cardio", muscleGroups: ["Cardio"], secondaryMuscles: ["Full Body"], equipment: "Bodyweight" },

  // FLEXIBILITY
  { name: "Stretching", category: "flexibility", muscleGroups: ["Full Body"], secondaryMuscles: [], equipment: "None" },
  { name: "Yoga", category: "flexibility", muscleGroups: ["Full Body"], secondaryMuscles: [], equipment: "Mat" },
  { name: "Foam Rolling", category: "flexibility", muscleGroups: ["Full Body"], secondaryMuscles: [], equipment: "Foam Roller" },
] as const;

// Seed the exercise library with built-in exercises
export const seedExerciseLibrary = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db
      .query("exerciseLibrary")
      .filter((q) => q.eq(q.field("isBuiltIn"), true))
      .first();

    if (existing) {
      return { message: "Exercise library already seeded", count: 0 };
    }

    let count = 0;
    for (const exercise of BUILT_IN_EXERCISES) {
      await ctx.db.insert("exerciseLibrary", {
        name: exercise.name,
        category: exercise.category as "strength" | "cardio" | "flexibility" | "olympic" | "bodyweight" | "machine" | "other",
        muscleGroups: [...exercise.muscleGroups],
        secondaryMuscles: [...exercise.secondaryMuscles],
        equipment: exercise.equipment,
        isBuiltIn: true,
        createdAt: Date.now(),
      });
      count++;
    }

    return { message: "Exercise library seeded", count };
  },
});

// Get all exercises (built-in + user custom)
export const getExercises = query({
  args: {
    userId: v.optional(v.string()),
    category: v.optional(v.string()),
    muscleGroup: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let exercises = await ctx.db.query("exerciseLibrary").collect();

    // Filter to built-in OR user's custom exercises
    exercises = exercises.filter(
      (e) => e.isBuiltIn || (args.userId && e.userId === args.userId)
    );

    // Filter by category
    if (args.category) {
      exercises = exercises.filter((e) => e.category === args.category);
    }

    // Filter by muscle group
    if (args.muscleGroup) {
      exercises = exercises.filter(
        (e) =>
          e.muscleGroups.includes(args.muscleGroup!) ||
          e.secondaryMuscles?.includes(args.muscleGroup!)
      );
    }

    // Filter by search query
    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      exercises = exercises.filter((e) =>
        e.name.toLowerCase().includes(query)
      );
    }

    // Sort alphabetically
    exercises.sort((a, b) => a.name.localeCompare(b.name));

    return exercises;
  },
});

// Search exercises by name (using search index)
export const searchExercises = query({
  args: {
    query: v.string(),
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    if (!args.query || args.query.length < 2) {
      // Return popular exercises if no query
      const exercises = await ctx.db
        .query("exerciseLibrary")
        .filter((q) => q.eq(q.field("isBuiltIn"), true))
        .take(limit);
      return exercises;
    }

    const results = await ctx.db
      .query("exerciseLibrary")
      .withSearchIndex("search_name", (q) => q.search("name", args.query))
      .take(limit);

    // Filter to built-in or user's
    return results.filter(
      (e) => e.isBuiltIn || (args.userId && e.userId === args.userId)
    );
  },
});

// Create a custom exercise
export const createCustomExercise = mutation({
  args: {
    userId: v.string(),
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
    muscleGroups: v.array(v.string()),
    secondaryMuscles: v.optional(v.array(v.string())),
    equipment: v.optional(v.string()),
    description: v.optional(v.string()),
    instructions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("exerciseLibrary", {
      name: args.name,
      category: args.category,
      muscleGroups: args.muscleGroups,
      secondaryMuscles: args.secondaryMuscles,
      equipment: args.equipment,
      description: args.description,
      instructions: args.instructions,
      isBuiltIn: false,
      userId: args.userId,
      createdAt: Date.now(),
    });

    return id;
  },
});

// Get exercise by ID
export const getExerciseById = query({
  args: { id: v.id("exerciseLibrary") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get muscle group options
export const getMuscleGroups = query({
  args: {},
  handler: async () => {
    return [
      "Chest",
      "Back",
      "Shoulders",
      "Biceps",
      "Triceps",
      "Forearms",
      "Traps",
      "Core",
      "Obliques",
      "Quads",
      "Hamstrings",
      "Glutes",
      "Calves",
      "Full Body",
      "Cardio",
    ];
  },
});

// Get equipment options
export const getEquipmentOptions = query({
  args: {},
  handler: async () => {
    return [
      "Barbell",
      "Dumbbell",
      "Cable",
      "Machine",
      "Bodyweight",
      "Kettlebell",
      "Resistance Band",
      "Smith Machine",
      "Treadmill",
      "Bike",
      "Rower",
      "Elliptical",
      "None",
    ];
  },
});

// Get category options
export const getCategoryOptions = query({
  args: {},
  handler: async () => {
    return [
      { value: "strength", label: "Strength" },
      { value: "cardio", label: "Cardio" },
      { value: "flexibility", label: "Flexibility" },
      { value: "olympic", label: "Olympic" },
      { value: "bodyweight", label: "Bodyweight" },
      { value: "machine", label: "Machine" },
      { value: "other", label: "Other" },
    ];
  },
});
