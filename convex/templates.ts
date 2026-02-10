import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all templates for a user
export const getTemplates = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("workoutTemplates")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Sort by last used (most recent first), then by use count
    templates.sort((a, b) => {
      if (a.lastUsedAt && b.lastUsedAt) {
        return b.lastUsedAt - a.lastUsedAt;
      }
      if (a.lastUsedAt) return -1;
      if (b.lastUsedAt) return 1;
      return b.useCount - a.useCount;
    });

    return templates;
  },
});

// Get a single template
export const getTemplate = query({
  args: { templateId: v.id("workoutTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.templateId);
  },
});

// Create a new template
export const createTemplate = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    exercises: v.array(
      v.object({
        exerciseLibraryId: v.id("exerciseLibrary"),
        exerciseName: v.string(),
        order: v.number(),
        supersetGroup: v.optional(v.number()),
        targetSets: v.number(),
        targetReps: v.string(),
        targetRpe: v.optional(v.number()),
        restSeconds: v.optional(v.number()),
        notes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const templateId = await ctx.db.insert("workoutTemplates", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      exercises: args.exercises,
      useCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return templateId;
  },
});

// Create template from completed workout
export const createTemplateFromWorkout = mutation({
  args: {
    workoutId: v.id("workouts"),
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout) throw new Error("Workout not found");

    // Get all exercises from the workout
    const exercises = await ctx.db
      .query("workoutExercises")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .collect();

    // Get sets for each exercise to determine target sets/reps
    const templateExercises = await Promise.all(
      exercises.map(async (exercise) => {
        const sets = await ctx.db
          .query("exerciseSets")
          .withIndex("by_workout_exercise", (q) =>
            q.eq("workoutExerciseId", exercise._id)
          )
          .filter((q) => q.eq(q.field("isCompleted"), true))
          .collect();

        const workingSets = sets.filter((s) => s.setType === "working");

        // Calculate average reps
        const avgReps = workingSets.length > 0
          ? Math.round(
              workingSets.reduce((acc, s) => acc + (s.reps || 0), 0) /
                workingSets.length
            )
          : 10;

        // Calculate average RPE
        const setsWithRpe = workingSets.filter((s) => s.rpe);
        const avgRpe = setsWithRpe.length > 0
          ? Math.round(
              setsWithRpe.reduce((acc, s) => acc + (s.rpe || 0), 0) /
                setsWithRpe.length
            )
          : undefined;

        return {
          exerciseLibraryId: exercise.exerciseLibraryId,
          exerciseName: exercise.exerciseName,
          order: exercise.order,
          supersetGroup: exercise.supersetGroup,
          targetSets: workingSets.length || 3,
          targetReps: avgReps.toString(),
          targetRpe: avgRpe,
          restSeconds: exercise.restSeconds,
          notes: exercise.notes,
        };
      })
    );

    // Sort by order
    templateExercises.sort((a, b) => a.order - b.order);

    const now = Date.now();
    const templateId = await ctx.db.insert("workoutTemplates", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      exercises: templateExercises,
      useCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return templateId;
  },
});

// Update a template
export const updateTemplate = mutation({
  args: {
    templateId: v.id("workoutTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    exercises: v.optional(
      v.array(
        v.object({
          exerciseLibraryId: v.id("exerciseLibrary"),
          exerciseName: v.string(),
          order: v.number(),
          supersetGroup: v.optional(v.number()),
          targetSets: v.number(),
          targetReps: v.string(),
          targetRpe: v.optional(v.number()),
          restSeconds: v.optional(v.number()),
          notes: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const { templateId, ...updates } = args;

    const cleanUpdates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(templateId, cleanUpdates);
  },
});

// Delete a template
export const deleteTemplate = mutation({
  args: { templateId: v.id("workoutTemplates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.templateId);
  },
});

// Start workout from template
export const startWorkoutFromTemplate = mutation({
  args: {
    templateId: v.id("workoutTemplates"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    // Check for existing in-progress workout
    const existing = await ctx.db
      .query("workouts")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "in_progress")
      )
      .first();

    if (existing) {
      return { error: "You already have a workout in progress", workoutId: existing._id };
    }

    // Create the workout
    const workoutId = await ctx.db.insert("workouts", {
      userId: args.userId,
      name: template.name,
      status: "in_progress",
      startedAt: Date.now(),
      templateId: args.templateId.toString(),
    });

    // Add exercises from template
    for (const templateExercise of template.exercises) {
      const workoutExerciseId = await ctx.db.insert("workoutExercises", {
        workoutId,
        userId: args.userId,
        exerciseLibraryId: templateExercise.exerciseLibraryId,
        exerciseName: templateExercise.exerciseName,
        order: templateExercise.order,
        supersetGroup: templateExercise.supersetGroup,
        restSeconds: templateExercise.restSeconds,
        notes: templateExercise.notes,
        createdAt: Date.now(),
      });

      // Pre-create empty sets based on template
      for (let i = 0; i < templateExercise.targetSets; i++) {
        await ctx.db.insert("exerciseSets", {
          workoutExerciseId,
          workoutId,
          userId: args.userId,
          exerciseLibraryId: templateExercise.exerciseLibraryId,
          setNumber: i + 1,
          setType: "working",
          weightUnit: "lbs",
          isCompleted: false,
          createdAt: Date.now(),
        });
      }
    }

    // Update template usage
    await ctx.db.patch(args.templateId, {
      useCount: template.useCount + 1,
      lastUsedAt: Date.now(),
    });

    return { workoutId };
  },
});

// Duplicate a template
export const duplicateTemplate = mutation({
  args: {
    templateId: v.id("workoutTemplates"),
    userId: v.string(),
    newName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    const now = Date.now();
    const newTemplateId = await ctx.db.insert("workoutTemplates", {
      userId: args.userId,
      name: args.newName || `${template.name} (Copy)`,
      description: template.description,
      exercises: template.exercises,
      useCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return newTemplateId;
  },
});
