import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// WORKOUT SESSION MANAGEMENT
// ============================================

// Start a new workout
export const startWorkout = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()),
    templateId: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    planDayId: v.optional(v.id("planDays")),
    gymProfileId: v.optional(v.id("gymProfiles")),
  },
  handler: async (ctx, args) => {
    // Check if user has an in-progress workout
    const existing = await ctx.db
      .query("workouts")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "in_progress")
      )
      .first();

    if (existing) {
      return { error: "You already have a workout in progress", workoutId: existing._id };
    }

    const workoutId = await ctx.db.insert("workouts", {
      userId: args.userId,
      name: args.name || "Workout",
      status: "in_progress",
      startedAt: args.startedAt || Date.now(),
      templateId: args.templateId,
      planDayId: args.planDayId,
      gymProfileId: args.gymProfileId,
    });

    return { workoutId };
  },
});


// Get active workout for user
export const getActiveWorkout = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const workout = await ctx.db
      .query("workouts")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "in_progress")
      )
      .first();

    if (!workout) return null;

    // Get all exercises in this workout
    const exercises = await ctx.db
      .query("workoutExercises")
      .withIndex("by_workout", (q) => q.eq("workoutId", workout._id))
      .collect();

    // Get all sets for each exercise
    const exercisesWithSets = await Promise.all(
      exercises.map(async (exercise) => {
        const sets = await ctx.db
          .query("exerciseSets")
          .withIndex("by_workout_exercise", (q) =>
            q.eq("workoutExerciseId", exercise._id)
          )
          .collect();

        // Sort sets by set number
        sets.sort((a, b) => a.setNumber - b.setNumber);

        const exerciseDefinition = await ctx.db.get(exercise.exerciseLibraryId);

        return {
          ...exercise,
          sets,
          movementPattern:
            exercise.movementPattern ?? exerciseDefinition?.movementPattern,
          difficultyTier:
            exercise.difficultyTier ?? exerciseDefinition?.difficultyTier,
          techniqueUrl: exercise.techniqueUrl ?? exerciseDefinition?.techniqueUrl,
        };
      })
    );

    // Sort exercises by order
    exercisesWithSets.sort((a, b) => a.order - b.order);

    return { ...workout, exercises: exercisesWithSets };
  },
});

// Complete a workout
export const completeWorkout = mutation({
  args: { workoutId: v.id("workouts") },
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout) throw new Error("Workout not found");

    const completedAt = Date.now();
    const duration = Math.round((completedAt - workout.startedAt) / 60000); // minutes

    await ctx.db.patch(args.workoutId, {
      status: "completed",
      completedAt,
      duration,
    });

    const sets = await ctx.db
      .query("exerciseSets")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .collect();

    const completedSets = sets.filter((set) => set.isCompleted);
    const completionRate =
      sets.length === 0 ? 0 : Math.round((completedSets.length / sets.length) * 100);
    const avgRir =
      completedSets.length === 0
        ? undefined
        : completedSets.reduce((sum, set) => sum + (set.rir ?? 0), 0) /
          completedSets.length;

    const progressionDecision =
      completionRate >= 90 && (avgRir ?? 2) >= 1
        ? "increase"
        : completionRate < 70
          ? "reduce"
          : "hold";

    const decisionReason =
      progressionDecision === "increase"
        ? "High completion and controlled effort."
        : progressionDecision === "reduce"
          ? "Low completion rate, prioritize consistency."
          : "Keep load stable and reinforce execution.";

    return {
      duration,
      progressionDecision,
      decisionReason,
      completionRate,
    };
  },
});

// Cancel a workout
export const cancelWorkout = mutation({
  args: { workoutId: v.id("workouts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.workoutId, {
      status: "cancelled",
      completedAt: Date.now(),
    });
  },
});

// Update workout name
export const updateWorkoutName = mutation({
  args: {
    workoutId: v.id("workouts"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.workoutId, { name: args.name });
  },
});

// ============================================
// EXERCISE MANAGEMENT (within workout)
// ============================================

// Add an exercise to a workout
export const addExerciseToWorkout = mutation({
  args: {
    workoutId: v.id("workouts"),
    userId: v.string(),
    exerciseLibraryId: v.id("exerciseLibrary"),
    supersetGroup: v.optional(v.number()),
    restSeconds: v.optional(v.number()),
    exerciseVariantId: v.optional(v.id("exerciseVariants")),
  },
  handler: async (ctx, args) => {
    // Get the exercise details
    const exercise = await ctx.db.get(args.exerciseLibraryId);
    if (!exercise) throw new Error("Exercise not found");

    // Get current exercise count for ordering
    const existingExercises = await ctx.db
      .query("workoutExercises")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .collect();

    const order = existingExercises.length;

    const workoutExerciseId = await ctx.db.insert("workoutExercises", {
      workoutId: args.workoutId,
      userId: args.userId,
      exerciseLibraryId: args.exerciseLibraryId,
      exerciseName: exercise.name,
      order,
      supersetGroup: args.supersetGroup,
      restSeconds: args.restSeconds || 90,
      exerciseVariantId: args.exerciseVariantId,
      movementPattern: exercise.movementPattern,
      difficultyTier: exercise.difficultyTier,
      techniqueUrl: exercise.techniqueUrl,
      createdAt: Date.now(),
    });

    return { workoutExerciseId, exerciseName: exercise.name };
  },
});

// Remove an exercise from a workout
export const removeExerciseFromWorkout = mutation({
  args: { workoutExerciseId: v.id("workoutExercises") },
  handler: async (ctx, args) => {
    // Delete all sets for this exercise
    const sets = await ctx.db
      .query("exerciseSets")
      .withIndex("by_workout_exercise", (q) =>
        q.eq("workoutExerciseId", args.workoutExerciseId)
      )
      .collect();

    for (const set of sets) {
      await ctx.db.delete(set._id);
    }

    // Delete the exercise
    await ctx.db.delete(args.workoutExerciseId);
  },
});

// Reorder exercises
export const reorderExercises = mutation({
  args: {
    workoutId: v.id("workouts"),
    exerciseIds: v.array(v.id("workoutExercises")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.exerciseIds.length; i++) {
      await ctx.db.patch(args.exerciseIds[i], { order: i });
    }
  },
});

// Update exercise metadata within a workout (supersets, notes, rest)
export const updateWorkoutExercise = mutation({
  args: {
    workoutExerciseId: v.id("workoutExercises"),
    supersetGroup: v.optional(v.union(v.number(), v.null())),
    notes: v.optional(v.string()),
    restSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { workoutExerciseId, ...updates } = args;
    const cleanUpdates: Record<string, unknown> = {};

    if (updates.supersetGroup !== undefined) {
      if (updates.supersetGroup !== null && updates.supersetGroup < 1) {
        throw new Error("Superset group must be 1 or greater");
      }
      cleanUpdates.supersetGroup =
        updates.supersetGroup === null ? undefined : updates.supersetGroup;
    }

    if (updates.notes !== undefined) {
      cleanUpdates.notes = updates.notes;
    }

    if (updates.restSeconds !== undefined) {
      cleanUpdates.restSeconds = updates.restSeconds;
    }

    await ctx.db.patch(workoutExerciseId, cleanUpdates);
  },
});

// ============================================
// SET MANAGEMENT
// ============================================

// Add a set to an exercise
export const addSet = mutation({
  args: {
    workoutExerciseId: v.id("workoutExercises"),
    workoutId: v.id("workouts"),
    userId: v.string(),
    exerciseLibraryId: v.id("exerciseLibrary"),
    setType: v.optional(
      v.union(
        v.literal("warmup"),
        v.literal("working"),
        v.literal("drop"),
        v.literal("failure"),
        v.literal("rest_pause"),
        v.literal("backoff")
      )
    ),
    weight: v.optional(v.number()),
    weightUnit: v.optional(v.union(v.literal("lbs"), v.literal("kg"))),
    reps: v.optional(v.number()),
    rpe: v.optional(v.number()),
    rir: v.optional(v.number()),
    durationSeconds: v.optional(v.number()),
    restSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get current set count
    const existingSets = await ctx.db
      .query("exerciseSets")
      .withIndex("by_workout_exercise", (q) =>
        q.eq("workoutExerciseId", args.workoutExerciseId)
      )
      .collect();

    const setNumber = existingSets.length + 1;

    const setId = await ctx.db.insert("exerciseSets", {
      workoutExerciseId: args.workoutExerciseId,
      workoutId: args.workoutId,
      userId: args.userId,
      exerciseLibraryId: args.exerciseLibraryId,
      setNumber,
      setType: args.setType || "working",
      weight: args.weight,
      weightUnit: args.weightUnit || "lbs",
      reps: args.reps,
      rpe: args.rpe,
      rir: args.rir,
      durationSeconds: args.durationSeconds,
      restSeconds: args.restSeconds,
      isCompleted: false,
      createdAt: Date.now(),
    });

    return { setId, setNumber };
  },
});

// Update a set
export const updateSet = mutation({
  args: {
    setId: v.id("exerciseSets"),
    weight: v.optional(v.number()),
    weightUnit: v.optional(v.union(v.literal("lbs"), v.literal("kg"))),
    reps: v.optional(v.number()),
    rpe: v.optional(v.number()),
    rir: v.optional(v.number()),
    setType: v.optional(
      v.union(
        v.literal("warmup"),
        v.literal("working"),
        v.literal("drop"),
        v.literal("failure"),
        v.literal("rest_pause"),
        v.literal("backoff")
      )
    ),
    durationSeconds: v.optional(v.number()),
    restSeconds: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { setId, ...updates } = args;

    // Remove undefined values
    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(setId, cleanUpdates);
  },
});

// Complete a set (mark as done)
export const completeSet = mutation({
  args: {
    setId: v.id("exerciseSets"),
    weight: v.optional(v.number()),
    weightUnit: v.optional(v.union(v.literal("lbs"), v.literal("kg"))),
    reps: v.optional(v.number()),
    rpe: v.optional(v.number()),
    rir: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const set = await ctx.db.get(args.setId);
    if (!set) throw new Error("Set not found");

    const completedAt = Date.now();
    const weight = args.weight ?? set.weight;
    const reps = args.reps ?? set.reps;
    const weightUnit = args.weightUnit ?? set.weightUnit;

    // Check for PR
    let isPR = false;
    let prType: "weight" | "reps" | "volume" | "1rm" | undefined;

    if (weight && reps && set.setType === "working") {
      // Check for max weight PR
      const existingWeightPR = await ctx.db
        .query("personalRecords")
        .withIndex("by_user_exercise_type", (q) =>
          q
            .eq("userId", set.userId)
            .eq("exerciseLibraryId", set.exerciseLibraryId)
            .eq("recordType", "weight")
        )
        .first();

      if (!existingWeightPR || weight > existingWeightPR.value) {
        isPR = true;
        prType = "weight";

        // Update or create PR
        if (existingWeightPR) {
          await ctx.db.patch(existingWeightPR._id, {
            value: weight,
            weight,
            reps,
            weightUnit,
            setId: args.setId,
            achievedAt: completedAt,
            previousValue: existingWeightPR.value,
          });
        } else {
          // Get exercise name
          const exercise = await ctx.db.get(set.exerciseLibraryId);
          await ctx.db.insert("personalRecords", {
            userId: set.userId,
            exerciseLibraryId: set.exerciseLibraryId,
            exerciseName: exercise?.name || "Unknown",
            recordType: "weight",
            value: weight,
            weight,
            reps,
            weightUnit,
            setId: args.setId,
            achievedAt: completedAt,
          });
        }
      }

      // Check for volume PR (weight × reps)
      const volume = weight * reps;
      const existingVolumePR = await ctx.db
        .query("personalRecords")
        .withIndex("by_user_exercise_type", (q) =>
          q
            .eq("userId", set.userId)
            .eq("exerciseLibraryId", set.exerciseLibraryId)
            .eq("recordType", "volume")
        )
        .first();

      if (!existingVolumePR || volume > existingVolumePR.value) {
        if (!isPR) {
          isPR = true;
          prType = "volume";
        }

        if (existingVolumePR) {
          await ctx.db.patch(existingVolumePR._id, {
            value: volume,
            weight,
            reps,
            weightUnit,
            setId: args.setId,
            achievedAt: completedAt,
            previousValue: existingVolumePR.value,
          });
        } else {
          const exercise = await ctx.db.get(set.exerciseLibraryId);
          await ctx.db.insert("personalRecords", {
            userId: set.userId,
            exerciseLibraryId: set.exerciseLibraryId,
            exerciseName: exercise?.name || "Unknown",
            recordType: "volume",
            value: volume,
            weight,
            reps,
            weightUnit,
            setId: args.setId,
            achievedAt: completedAt,
          });
        }
      }

      // Calculate and check estimated 1RM using Epley formula
      // 1RM = weight × (1 + reps/30)
      if (reps <= 10) {
        // Only calculate for sets of 10 or fewer reps
        const estimated1RM = Math.round(weight * (1 + reps / 30));

        const existing1RMPR = await ctx.db
          .query("personalRecords")
          .withIndex("by_user_exercise_type", (q) =>
            q
              .eq("userId", set.userId)
              .eq("exerciseLibraryId", set.exerciseLibraryId)
              .eq("recordType", "1rm")
          )
          .first();

        if (!existing1RMPR || estimated1RM > existing1RMPR.value) {
          if (!isPR) {
            isPR = true;
            prType = "1rm";
          }

          if (existing1RMPR) {
            await ctx.db.patch(existing1RMPR._id, {
              value: estimated1RM,
              weight,
              reps,
              weightUnit,
              setId: args.setId,
              achievedAt: completedAt,
              previousValue: existing1RMPR.value,
            });
          } else {
            const exercise = await ctx.db.get(set.exerciseLibraryId);
            await ctx.db.insert("personalRecords", {
              userId: set.userId,
              exerciseLibraryId: set.exerciseLibraryId,
              exerciseName: exercise?.name || "Unknown",
              recordType: "1rm",
              value: estimated1RM,
              weight,
              reps,
              weightUnit,
              setId: args.setId,
              achievedAt: completedAt,
            });
          }
        }
      }
    }

    // Update the set
    await ctx.db.patch(args.setId, {
      weight,
      reps,
      weightUnit,
      rpe: args.rpe ?? set.rpe,
      rir: args.rir ?? set.rir,
      isCompleted: true,
      completedAt,
      isPR,
      prType,
    });

    return { isPR, prType };
  },
});

// Delete a set
export const deleteSet = mutation({
  args: { setId: v.id("exerciseSets") },
  handler: async (ctx, args) => {
    const set = await ctx.db.get(args.setId);
    if (!set) return;

    // Delete the set
    await ctx.db.delete(args.setId);

    // Renumber remaining sets
    const remainingSets = await ctx.db
      .query("exerciseSets")
      .withIndex("by_workout_exercise", (q) =>
        q.eq("workoutExerciseId", set.workoutExerciseId)
      )
      .collect();

    remainingSets.sort((a, b) => a.setNumber - b.setNumber);

    for (let i = 0; i < remainingSets.length; i++) {
      if (remainingSets[i].setNumber !== i + 1) {
        await ctx.db.patch(remainingSets[i]._id, { setNumber: i + 1 });
      }
    }
  },
});

// ============================================
// WORKOUT HISTORY
// ============================================

// Get recent workouts
export const getRecentWorkouts = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .take(limit);

    // Get exercise count for each workout
    const workoutsWithDetails = await Promise.all(
      workouts.map(async (workout) => {
        const exercises = await ctx.db
          .query("workoutExercises")
          .withIndex("by_workout", (q) => q.eq("workoutId", workout._id))
          .collect();

        const sets = await ctx.db
          .query("exerciseSets")
          .withIndex("by_workout", (q) => q.eq("workoutId", workout._id))
          .collect();

        const completedSets = sets.filter((s) => s.isCompleted);
        const totalVolume = completedSets.reduce(
          (acc, s) => acc + (s.weight || 0) * (s.reps || 0),
          0
        );

        return {
          ...workout,
          exerciseCount: exercises.length,
          setCount: completedSets.length,
          totalVolume,
        };
      })
    );

    return workoutsWithDetails;
  },
});

// Get workout details
export const getWorkoutDetails = query({
  args: { workoutId: v.id("workouts") },
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout) return null;

    const exercises = await ctx.db
      .query("workoutExercises")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .collect();

    const exercisesWithSets = await Promise.all(
      exercises.map(async (exercise) => {
        const sets = await ctx.db
          .query("exerciseSets")
          .withIndex("by_workout_exercise", (q) =>
            q.eq("workoutExerciseId", exercise._id)
          )
          .collect();

        sets.sort((a, b) => a.setNumber - b.setNumber);
        return { ...exercise, sets };
      })
    );

    exercisesWithSets.sort((a, b) => a.order - b.order);

    return { ...workout, exercises: exercisesWithSets };
  },
});

// Get exercise history (past performance)
export const getExerciseHistory = query({
  args: {
    userId: v.string(),
    exerciseLibraryId: v.id("exerciseLibrary"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    // Get all sets for this exercise
    const sets = await ctx.db
      .query("exerciseSets")
      .withIndex("by_user_exercise", (q) =>
        q.eq("userId", args.userId).eq("exerciseLibraryId", args.exerciseLibraryId)
      )
      .order("desc")
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .take(limit * 5); // Get more to account for multiple sets per workout

    // Group by workout
    const workoutSetsMap = new Map<string, typeof sets>();
    for (const set of sets) {
      const workoutId = set.workoutId.toString();
      if (!workoutSetsMap.has(workoutId)) {
        workoutSetsMap.set(workoutId, []);
      }
      workoutSetsMap.get(workoutId)!.push(set);
    }

    // Get workout details and format
    const history = await Promise.all(
      Array.from(workoutSetsMap.entries())
        .slice(0, limit)
        .map(async ([, workoutSets]) => {
          const workout = await ctx.db.get(workoutSets[0].workoutId);
          workoutSets.sort((a, b) => a.setNumber - b.setNumber);

          return {
            date: workout?.startedAt || workoutSets[0].completedAt || 0,
            workoutName: workout?.name,
            sets: workoutSets.map((s) => ({
              setNumber: s.setNumber,
              weight: s.weight,
              reps: s.reps,
              rpe: s.rpe,
              rir: s.rir,
              setType: s.setType,
              isPR: s.isPR,
            })),
          };
        })
    );

    // Sort by date descending
    history.sort((a, b) => b.date - a.date);

    return history;
  },
});

// Get last performances for a batch of exercises (for "prev" hints in active workout)
export const getLastPerformances = query({
  args: {
    userId: v.string(),
    exerciseLibraryIds: v.array(v.id("exerciseLibrary")),
    excludeWorkoutId: v.optional(v.id("workouts")),
  },
  handler: async (ctx, args) => {
    const result: Record<string, { sets: { weight?: number; reps?: number }[] }> = {};
    const excludeId = args.excludeWorkoutId?.toString();

    for (const exerciseId of args.exerciseLibraryIds) {
      const sets = await ctx.db
        .query("exerciseSets")
        .withIndex("by_user_exercise", (q) =>
          q.eq("userId", args.userId).eq("exerciseLibraryId", exerciseId)
        )
        .order("desc")
        .filter((q) => q.eq(q.field("isCompleted"), true))
        .take(50);

      // Filter out sets from the current active workout
      const filteredSets = excludeId
        ? sets.filter((s) => s.workoutId.toString() !== excludeId)
        : sets;

      if (filteredSets.length === 0) continue;

      // Take the most recent workout's sets
      const firstWorkoutId = filteredSets[0].workoutId.toString();
      const workoutSets = filteredSets
        .filter((s) => s.workoutId.toString() === firstWorkoutId)
        .sort((a, b) => a.setNumber - b.setNumber);

      result[exerciseId] = {
        sets: workoutSets.map((s) => ({
          weight: s.weight,
          reps: s.reps,
        })),
      };
    }

    return result;
  },
});

// Get personal records for a user
export const getPersonalRecords = query({
  args: {
    userId: v.string(),
    exerciseLibraryId: v.optional(v.id("exerciseLibrary")),
  },
  handler: async (ctx, args) => {
    if (args.exerciseLibraryId) {
      const exerciseId = args.exerciseLibraryId;
      return await ctx.db
        .query("personalRecords")
        .withIndex("by_user_exercise", (q) =>
          q.eq("userId", args.userId).eq("exerciseLibraryId", exerciseId)
        )
        .collect();
    }

    return await ctx.db
      .query("personalRecords")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});
