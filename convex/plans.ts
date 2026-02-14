import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function normalizeDateStart(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export const assignTemplate = mutation({
  args: {
    userId: v.string(),
    planTemplateId: v.id("planTemplates"),
    gymProfileId: v.optional(v.id("gymProfiles")),
    startDate: v.optional(v.number()),
    exclusions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.planTemplateId);
    if (!template) throw new Error("Plan template not found");

    const existingActive = await ctx.db
      .query("userPlanInstances")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .collect();

    const now = Date.now();
    for (const plan of existingActive) {
      await ctx.db.patch(plan._id, { status: "paused", updatedAt: now });
    }

    const startDate = normalizeDateStart(args.startDate ?? now);
    const instanceId = await ctx.db.insert("userPlanInstances", {
      userId: args.userId,
      planTemplateId: template._id,
      gymProfileId: args.gymProfileId,
      startDate,
      status: "active",
      goal: template.goal,
      daysPerWeek: template.daysPerWeek,
      sessionMinutes: template.sessionMinutes,
      exclusions: args.exclusions,
      createdAt: now,
      updatedAt: now,
    });

    const weekOne = await ctx.db
      .query("planWeeks")
      .withIndex("by_plan_week", (q) =>
        q.eq("planTemplateId", template._id).eq("weekNumber", 1)
      )
      .first();
    if (!weekOne) {
      return { instanceId };
    }

    const days = await ctx.db
      .query("planDays")
      .withIndex("by_week", (q) => q.eq("weekId", weekOne._id))
      .collect();
    days.sort((a, b) => a.dayNumber - b.dayNumber);

    for (const day of days) {
      await ctx.db.insert("userPlanDayProgress", {
        planInstanceId: instanceId,
        userId: args.userId,
        planDayId: day._id,
        status: "planned",
        scheduledDate: startDate + (day.dayNumber - 1) * 24 * 60 * 60 * 1000,
        updatedAt: now,
      });
    }

    return { instanceId };
  },
});

export const getActivePlan = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const active = await ctx.db
      .query("userPlanInstances")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .first();
    if (!active) return null;

    const template = await ctx.db.get(active.planTemplateId);
    const progress = await ctx.db
      .query("userPlanDayProgress")
      .withIndex("by_instance", (q) => q.eq("planInstanceId", active._id))
      .collect();

    const progressWithDay = await Promise.all(
      progress.map(async (entry) => {
        const day = await ctx.db.get(entry.planDayId);
        return { ...entry, day };
      })
    );

    progressWithDay.sort((a, b) => (a.scheduledDate ?? 0) - (b.scheduledDate ?? 0));

    return { ...active, template, progress: progressWithDay };
  },
});

export const getTodayPlanSummary = query({
  args: {
    userId: v.string(),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const active = await ctx.db
      .query("userPlanInstances")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .first();
    if (!active) return null;

    const targetDateStart = normalizeDateStart(args.date ?? Date.now());
    const progressEntries = await ctx.db
      .query("userPlanDayProgress")
      .withIndex("by_instance", (q) => q.eq("planInstanceId", active._id))
      .collect();

    const todayProgress = progressEntries.find((entry) => {
      if (!entry.scheduledDate) return false;
      return normalizeDateStart(entry.scheduledDate) === targetDateStart;
    });

    const nextPlanned = progressEntries
      .filter((entry) => entry.status === "planned")
      .sort((a, b) => (a.scheduledDate ?? 0) - (b.scheduledDate ?? 0))[0];

    const targetProgress = todayProgress ?? nextPlanned;
    if (!targetProgress) {
      return { activePlanId: active._id, hasSession: false };
    }

    const day = await ctx.db.get(targetProgress.planDayId);
    if (!day) {
      return { activePlanId: active._id, hasSession: false };
    }

    const prescriptions = await ctx.db
      .query("planPrescriptions")
      .withIndex("by_plan_day", (q) => q.eq("planDayId", day._id))
      .collect();
    prescriptions.sort((a, b) => a.order - b.order);

    const enrichedPrescriptions = await Promise.all(
      prescriptions.map(async (prescription) => {
        const variant = prescription.exerciseVariantId
          ? await ctx.db.get(prescription.exerciseVariantId)
          : null;
        const exerciseLibrary = prescription.exerciseLibraryId
          ? await ctx.db.get(prescription.exerciseLibraryId)
          : null;

        return {
          ...prescription,
          exerciseName:
            variant?.name ??
            exerciseLibrary?.name ??
            "Custom Exercise",
        };
      })
    );

    return {
      activePlanId: active._id,
      hasSession: true,
      progressId: targetProgress._id,
      planDayId: day._id,
      dayName: day.name,
      focus: day.focus,
      estimatedMinutes: day.estimatedMinutes,
      status: targetProgress.status,
      prescriptions: enrichedPrescriptions,
    };
  },
});

export const markDayCompleted = mutation({
  args: {
    userId: v.string(),
    progressId: v.id("userPlanDayProgress"),
    workoutId: v.id("workouts"),
    progressionDecision: v.union(
      v.literal("increase"),
      v.literal("hold"),
      v.literal("reduce")
    ),
    decisionReason: v.string(),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db.get(args.progressId);
    if (!progress || progress.userId !== args.userId) {
      throw new Error("Plan progress entry not found");
    }

    await ctx.db.patch(progress._id, {
      status: "completed",
      workoutId: args.workoutId,
      progressionDecision: args.progressionDecision,
      decisionReason: args.decisionReason,
      updatedAt: Date.now(),
    });
  },
});

export const getAdherence = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const active = await ctx.db
      .query("userPlanInstances")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .first();
    if (!active) {
      return {
        plannedCount: 0,
        completedCount: 0,
        skippedCount: 0,
        adherenceRate: 0,
      };
    }

    const progressEntries = await ctx.db
      .query("userPlanDayProgress")
      .withIndex("by_instance", (q) => q.eq("planInstanceId", active._id))
      .collect();

    const plannedCount = progressEntries.length;
    const completedCount = progressEntries.filter((entry) => entry.status === "completed").length;
    const skippedCount = progressEntries.filter((entry) => entry.status === "skipped").length;
    const adherenceRate =
      plannedCount === 0 ? 0 : Math.round((completedCount / plannedCount) * 100);

    return { plannedCount, completedCount, skippedCount, adherenceRate };
  },
});

export const createDefaultPlanForUser = mutation({
  args: {
    userId: v.string(),
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
    gymProfileId: v.optional(v.id("gymProfiles")),
  },
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("planTemplates")
      .withIndex("by_goal", (q) => q.eq("goal", args.goal))
      .collect();

    const match = templates.find(
      (template) =>
        template.experienceLevel === args.experienceLevel &&
        template.daysPerWeek === args.daysPerWeek
    );
    if (!match) {
      throw new Error("No matching template found for selected settings");
    }

    const now = Date.now();
    const instanceId = await ctx.db.insert("userPlanInstances", {
      userId: args.userId,
      planTemplateId: match._id,
      gymProfileId: args.gymProfileId,
      startDate: normalizeDateStart(now),
      status: "active",
      goal: match.goal,
      daysPerWeek: match.daysPerWeek,
      sessionMinutes: match.sessionMinutes,
      createdAt: now,
      updatedAt: now,
    });

    const weekOne = await ctx.db
      .query("planWeeks")
      .withIndex("by_plan_week", (q) =>
        q.eq("planTemplateId", match._id).eq("weekNumber", 1)
      )
      .first();

    if (weekOne) {
      const days = await ctx.db
        .query("planDays")
        .withIndex("by_week", (q) => q.eq("weekId", weekOne._id))
        .collect();
      days.sort((a, b) => a.dayNumber - b.dayNumber);

      for (const day of days) {
        await ctx.db.insert("userPlanDayProgress", {
          planInstanceId: instanceId,
          userId: args.userId,
          planDayId: day._id,
          scheduledDate: normalizeDateStart(now) + (day.dayNumber - 1) * 86400000,
          status: "planned",
          updatedAt: now,
        });
      }
    }

    return { instanceId, planTemplateId: match._id };
  },
});

export const getPlanForEditing = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const active = await ctx.db
      .query("userPlanInstances")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .first();
    
    if (!active) return null;

    const template = await ctx.db.get(active.planTemplateId);
    if (!template) return null;

    // Get all weeks for this plan template
    const weeks = await ctx.db
      .query("planWeeks")
      .withIndex("by_plan", (q) => q.eq("planTemplateId", template._id))
      .collect();
    
    weeks.sort((a, b) => a.weekNumber - b.weekNumber);

    // Get progress entries to calculate completion stats
    const progressEntries = await ctx.db
      .query("userPlanDayProgress")
      .withIndex("by_instance", (q) => q.eq("planInstanceId", active._id))
      .collect();

    const completedDays = progressEntries.filter((p) => p.status === "completed").length;
    const totalDays = progressEntries.length;

    // Find the next planned workout
    const nextPlanned = progressEntries
      .filter((p) => p.status === "planned")
      .sort((a, b) => (a.scheduledDate ?? 0) - (b.scheduledDate ?? 0))[0];

    let nextWorkoutDay: string | undefined;
    if (nextPlanned) {
      const day = await ctx.db.get(nextPlanned.planDayId);
      if (day) {
        nextWorkoutDay = day.name;
      }
    }

    // Get current week based on progress
    const currentWeek = Math.min(
      weeks.length,
      Math.floor(completedDays / (totalDays / weeks.length)) + 1
    ) || 1;

    return {
      planInstanceId: active._id,
      planTemplateId: template._id,
      planName: template.name,
      goal: active.goal,
      daysPerWeek: active.daysPerWeek,
      sessionMinutes: active.sessionMinutes,
      currentWeek,
      totalWeeks: weeks.length,
      completedDays,
      totalDays,
      nextWorkoutDay,
      startDate: active.startDate,
    };
  },
});

export const getCurrentWeekSchedule = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const active = await ctx.db
      .query("userPlanInstances")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .first();

    if (!active) return null;

    const template = await ctx.db.get(active.planTemplateId);
    if (!template) return null;

    // Get all weeks
    const weeks = await ctx.db
      .query("planWeeks")
      .withIndex("by_plan", (q) => q.eq("planTemplateId", template._id))
      .collect();

    weeks.sort((a, b) => a.weekNumber - b.weekNumber);

    // Get progress entries to find current week
    const progressEntries = await ctx.db
      .query("userPlanDayProgress")
      .withIndex("by_instance", (q) => q.eq("planInstanceId", active._id))
      .collect();

    const completedDays = progressEntries.filter((p) => p.status === "completed").length;
    const totalDays = progressEntries.length;

    const currentWeekNumber = Math.min(
      weeks.length,
      Math.floor(completedDays / (totalDays / weeks.length)) + 1
    ) || 1;

    const currentWeek = weeks.find((w) => w.weekNumber === currentWeekNumber) || weeks[0];
    if (!currentWeek) return null;

    // Get days for current week
    const days = await ctx.db
      .query("planDays")
      .withIndex("by_week", (q) => q.eq("weekId", currentWeek._id))
      .collect();

    // Sort by dayNumber initially
    days.sort((a, b) => a.dayNumber - b.dayNumber);

    // Migration logic: Assign dayOfWeek based on position if not set
    // Day 1 -> Sunday (0), Day 2 -> Monday (1), etc.
    days.forEach((day, index) => {
      if (day.dayOfWeek === undefined) {
        day.dayOfWeek = index % 7; // 0=Sun, 1=Mon, etc.
      }
    });

    // Create a map of existing days by dayOfWeek
    const dayMap = new Map();
    days.forEach((day) => {
      if (day.dayOfWeek !== undefined) {
        dayMap.set(day.dayOfWeek, day);
      }
    });

    // Build 7-day week (Sun=0 to Sat=6)
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const fullWeekDays = await Promise.all(
      weekDays.map(async (_, dayOfWeek) => {
        const existingDay = dayMap.get(dayOfWeek);

        if (existingDay) {
          // Enrich existing day with prescriptions
          const prescriptions = await ctx.db
            .query("planPrescriptions")
            .withIndex("by_plan_day", (q) => q.eq("planDayId", existingDay._id))
            .collect();

          prescriptions.sort((a, b) => a.order - b.order);

          const enrichedPrescriptions = await Promise.all(
            prescriptions.map(async (p) => {
              const exerciseLibrary = p.exerciseLibraryId
                ? await ctx.db.get(p.exerciseLibraryId)
                : null;
              const variant = p.exerciseVariantId
                ? await ctx.db.get(p.exerciseVariantId)
                : null;

              return {
                _id: p._id,
                exerciseName: variant?.name ?? exerciseLibrary?.name ?? "Exercise",
                targetSets: p.targetSets,
                targetReps: p.targetReps,
              };
            })
          );

          const progress = progressEntries.find((p) => p.planDayId === existingDay._id);

          return {
            _id: existingDay._id,
            dayOfWeek,
            weekdayName: weekDays[dayOfWeek],
            name: existingDay.name,
            focus: existingDay.focus,
            isRest: existingDay.focus === "Rest" || existingDay.focus.toLowerCase().includes("rest"),
            estimatedMinutes: existingDay.estimatedMinutes,
            status: progress?.status ?? "planned",
            prescriptions: enrichedPrescriptions,
            exists: true,
          };
        } else {
          // Return REST placeholder for missing day
          return {
            _id: null,
            dayOfWeek,
            weekdayName: weekDays[dayOfWeek],
            name: `${weekDays[dayOfWeek]}day`,
            focus: "Rest",
            isRest: true,
            estimatedMinutes: 0,
            status: "planned",
            prescriptions: [],
            exists: false,
          };
        }
      })
    );

    return {
      planInstanceId: active._id,
      planTemplateId: template._id,
      planName: template.name,
      currentWeek: currentWeekNumber,
      totalWeeks: weeks.length,
      currentWeekId: currentWeek._id,
      days: fullWeekDays,
    };
  },
});

export const updateDayFocus = mutation({
  args: {
    planDayId: v.id("planDays"),
    newFocus: v.string(),
  },
  handler: async (ctx, args) => {
    const day = await ctx.db.get(args.planDayId);
    if (!day) throw new Error("Plan day not found");

    await ctx.db.patch(args.planDayId, {
      focus: args.newFocus,
    });

    return { success: true };
  },
});

export const createOrUpdateWeekDay = mutation({
  args: {
    weekId: v.id("planWeeks"),
    planTemplateId: v.id("planTemplates"),
    dayOfWeek: v.number(), // 0=Sun, 1=Mon, etc.
    focus: v.string(),
    name: v.optional(v.string()),
    estimatedMinutes: v.optional(v.number()),
    existingPlanDayId: v.optional(v.id("planDays")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const weekDays = await ctx.db
      .query("planDays")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .collect();

    const existingForWeekday = weekDays.find(
      (day) => day.dayOfWeek === args.dayOfWeek
    );

    if (args.existingPlanDayId) {
      // Update existing day
      const existingDay = await ctx.db.get(args.existingPlanDayId);
      if (!existingDay) throw new Error("Plan day not found");

      const canonicalDayId = existingForWeekday?._id ?? args.existingPlanDayId;
      const canonicalDay =
        canonicalDayId === args.existingPlanDayId
          ? existingDay
          : await ctx.db.get(canonicalDayId);
      if (!canonicalDay) throw new Error("Plan day not found");

      await ctx.db.patch(canonicalDayId, {
        focus: args.focus,
        dayOfWeek: args.dayOfWeek,
        name: args.name ?? canonicalDay.name,
        estimatedMinutes: args.estimatedMinutes ?? canonicalDay.estimatedMinutes,
      });

      return {
        planDayId: canonicalDayId,
        created: false,
        resolvedExisting: canonicalDayId !== args.existingPlanDayId,
      };
    } else {
      if (existingForWeekday) {
        await ctx.db.patch(existingForWeekday._id, {
          focus: args.focus,
          dayOfWeek: args.dayOfWeek,
          name: args.name ?? existingForWeekday.name,
          estimatedMinutes:
            args.estimatedMinutes ?? existingForWeekday.estimatedMinutes,
        });

        return {
          planDayId: existingForWeekday._id,
          created: false,
          resolvedExisting: true,
        };
      }

      // Create new day for this weekday if none exists
      // Find the highest dayNumber in this week
      const maxDayNumber = weekDays.length > 0
        ? Math.max(...weekDays.map((d) => d.dayNumber))
        : 0;

      const planDayId = await ctx.db.insert("planDays", {
        planTemplateId: args.planTemplateId,
        weekId: args.weekId,
        dayNumber: maxDayNumber + 1,
        dayOfWeek: args.dayOfWeek,
        name: args.name ?? `${args.focus} Day`,
        focus: args.focus,
        estimatedMinutes: args.estimatedMinutes ?? 60,
        createdAt: now,
      });

      return { planDayId, created: true, resolvedExisting: false };
    }
  },
});

// Exercise management mutations for plan mode
export const addExerciseToPlanDay = mutation({
  args: {
    planDayId: v.id("planDays"),
    exerciseLibraryId: v.id("exerciseLibrary"),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get existing prescriptions to determine order if not provided
    const existingPrescriptions = await ctx.db
      .query("planPrescriptions")
      .withIndex("by_plan_day", (q) => q.eq("planDayId", args.planDayId))
      .collect();

    const nextOrder = args.order ?? (existingPrescriptions.length > 0
      ? Math.max(...existingPrescriptions.map((p) => p.order)) + 1
      : 1);

    const prescriptionId = await ctx.db.insert("planPrescriptions", {
      planDayId: args.planDayId,
      order: nextOrder,
      exerciseLibraryId: args.exerciseLibraryId,
      targetSets: 3,
      targetReps: "8-12",
      createdAt: now,
    });

    return { prescriptionId };
  },
});

export const removePlanPrescription = mutation({
  args: {
    prescriptionId: v.id("planPrescriptions"),
  },
  handler: async (ctx, args) => {
    // Check if the prescription exists first
    const prescription = await ctx.db.get(args.prescriptionId);
    if (!prescription) {
      // Already deleted or never existed, return success
      return { success: true, alreadyDeleted: true };
    }
    
    await ctx.db.delete(args.prescriptionId);
    return { success: true };
  },
});

export const reorderPlanPrescriptions = mutation({
  args: {
    planDayId: v.id("planDays"),
    prescriptionOrders: v.array(v.object({
      prescriptionId: v.id("planPrescriptions"),
      newOrder: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    for (const { prescriptionId, newOrder } of args.prescriptionOrders) {
      await ctx.db.patch(prescriptionId, { order: newOrder });
    }
    return { success: true };
  },
});

// Auto-suggest exercises by day type
export const getSuggestedExercisesByDayType = query({
  args: {
    dayType: v.string(), // "Push", "Pull", "Legs", "Upper", "Lower", "Full Body"
  },
  handler: async (ctx, args) => {
    // Define suggested exercises by day type
    const suggestionsByType: Record<string, string[]> = {
      "Push": [
        "Barbell Bench Press",
        "Overhead Press",
        "Incline Dumbbell Press",
        "Dips",
        "Tricep Pushdowns",
        "Lateral Raises",
      ],
      "Pull": [
        "Barbell Deadlift",
        "Pull-Ups",
        "Barbell Rows",
        "Face Pulls",
        "Barbell Curls",
        "Hammer Curls",
      ],
      "Legs": [
        "Barbell Squat",
        "Romanian Deadlift",
        "Leg Press",
        "Walking Lunges",
        "Leg Curls",
        "Calf Raises",
      ],
      "Upper": [
        "Barbell Bench Press",
        "Barbell Rows",
        "Overhead Press",
        "Pull-Ups",
        "Barbell Curls",
        "Tricep Pushdowns",
      ],
      "Lower": [
        "Barbell Squat",
        "Barbell Deadlift",
        "Leg Press",
        "Walking Lunges",
        "Leg Curls",
        "Calf Raises",
      ],
      "Full Body": [
        "Barbell Squat",
        "Barbell Bench Press",
        "Barbell Deadlift",
        "Overhead Press",
        "Pull-Ups",
        "Barbell Rows",
      ],
    };

    const suggestions = suggestionsByType[args.dayType] || [];

    // Get exercise library entries that match suggestions
    const allExercises = await ctx.db.query("exerciseLibrary").collect();

    const matchedExercises = suggestions
      .map((name) => allExercises.find((e) => e.name === name))
      .filter((e): e is NonNullable<typeof e> => e !== null);

    return matchedExercises.map((e) => ({
      _id: e._id,
      name: e.name,
      category: e.category,
    }));
  },
});

// Quick add standard exercise set for a day type
export const quickAddStandardExercises = mutation({
  args: {
    planDayId: v.id("planDays"),
    dayType: v.string(), // "Push", "Pull", "Legs", "Upper", "Lower", "Full Body"
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get suggested exercises
    const suggestionsByType: Record<string, string[]> = {
      "Push": [
        "Barbell Bench Press",
        "Overhead Press",
        "Incline Dumbbell Press",
        "Dips",
        "Tricep Pushdowns",
        "Lateral Raises",
      ],
      "Pull": [
        "Barbell Deadlift",
        "Pull-Ups",
        "Barbell Rows",
        "Face Pulls",
        "Barbell Curls",
        "Hammer Curls",
      ],
      "Legs": [
        "Barbell Squat",
        "Romanian Deadlift",
        "Leg Press",
        "Walking Lunges",
        "Leg Curls",
        "Calf Raises",
      ],
      "Upper": [
        "Barbell Bench Press",
        "Barbell Rows",
        "Overhead Press",
        "Pull-Ups",
        "Barbell Curls",
        "Tricep Pushdowns",
      ],
      "Lower": [
        "Barbell Squat",
        "Barbell Deadlift",
        "Leg Press",
        "Walking Lunges",
        "Leg Curls",
        "Calf Raises",
      ],
      "Full Body": [
        "Barbell Squat",
        "Barbell Bench Press",
        "Barbell Deadlift",
        "Overhead Press",
        "Pull-Ups",
        "Barbell Rows",
      ],
    };

    const suggestions = suggestionsByType[args.dayType] || [];
    if (suggestions.length === 0) {
      return { added: 0 };
    }

    // Get existing prescriptions to determine starting order
    const existingPrescriptions = await ctx.db
      .query("planPrescriptions")
      .withIndex("by_plan_day", (q) => q.eq("planDayId", args.planDayId))
      .collect();

    let nextOrder = existingPrescriptions.length > 0
      ? Math.max(...existingPrescriptions.map((p) => p.order)) + 1
      : 1;

    // Get all exercises from library
    const allExercises = await ctx.db.query("exerciseLibrary").collect();

    let added = 0;
    for (const exerciseName of suggestions) {
      const exercise = allExercises.find((e) => e.name === exerciseName);
      if (exercise) {
        await ctx.db.insert("planPrescriptions", {
          planDayId: args.planDayId,
          order: nextOrder++,
          exerciseLibraryId: exercise._id,
          targetSets: 3,
          targetReps: "8-12",
          createdAt: now,
        });
        added++;
      }
    }

    return { added };
  },
});

function getProgressPriority(status: "planned" | "completed" | "skipped"): number {
  if (status === "completed") return 3;
  if (status === "skipped") return 2;
  return 1;
}

export const cleanupDuplicatePlanDays = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true;
    const weeks = await ctx.db.query("planWeeks").collect();

    let duplicateGroups = 0;
    let prescriptionsMoved = 0;
    let progressEntriesRepointed = 0;
    let progressEntriesMerged = 0;
    let deletedDays = 0;

    for (const week of weeks) {
      const days = await ctx.db
        .query("planDays")
        .withIndex("by_week", (q) => q.eq("weekId", week._id))
        .collect();

      const daysByWeekday = new Map<number, typeof days>();
      for (const day of days) {
        if (day.dayOfWeek === undefined) continue;
        const group = daysByWeekday.get(day.dayOfWeek) ?? [];
        group.push(day);
        daysByWeekday.set(day.dayOfWeek, group);
      }

      for (const duplicateDays of daysByWeekday.values()) {
        if (duplicateDays.length <= 1) continue;
        duplicateGroups++;

        const linkStats = await Promise.all(
          duplicateDays.map(async (day) => {
            const prescriptions = await ctx.db
              .query("planPrescriptions")
              .withIndex("by_plan_day", (q) => q.eq("planDayId", day._id))
              .collect();
            const progressEntries = await ctx.db
              .query("userPlanDayProgress")
              .withIndex("by_plan_day", (q) => q.eq("planDayId", day._id))
              .collect();
            return {
              day,
              prescriptionCount: prescriptions.length,
              progressCount: progressEntries.length,
            };
          })
        );

        linkStats.sort((a, b) => {
          const aScore = a.prescriptionCount + a.progressCount;
          const bScore = b.prescriptionCount + b.progressCount;
          if (aScore !== bScore) return bScore - aScore;
          return a.day.createdAt - b.day.createdAt;
        });

        const canonicalDay = linkStats[0].day;
        const duplicatesToMerge = linkStats.slice(1).map((entry) => entry.day);

        const canonicalPrescriptions = await ctx.db
          .query("planPrescriptions")
          .withIndex("by_plan_day", (q) => q.eq("planDayId", canonicalDay._id))
          .collect();
        let nextOrder =
          canonicalPrescriptions.length > 0
            ? Math.max(...canonicalPrescriptions.map((p) => p.order)) + 1
            : 1;

        const canonicalProgressEntries = await ctx.db
          .query("userPlanDayProgress")
          .withIndex("by_plan_day", (q) => q.eq("planDayId", canonicalDay._id))
          .collect();
        const canonicalByInstance = new Map(
          canonicalProgressEntries.map((entry) => [entry.planInstanceId, entry])
        );

        for (const duplicateDay of duplicatesToMerge) {
          const duplicatePrescriptions = await ctx.db
            .query("planPrescriptions")
            .withIndex("by_plan_day", (q) => q.eq("planDayId", duplicateDay._id))
            .collect();
          duplicatePrescriptions.sort((a, b) => a.order - b.order);

          for (const prescription of duplicatePrescriptions) {
            prescriptionsMoved++;
            if (!dryRun) {
              await ctx.db.patch(prescription._id, {
                planDayId: canonicalDay._id,
                order: nextOrder++,
              });
            } else {
              nextOrder++;
            }
          }

          const duplicateProgressEntries = await ctx.db
            .query("userPlanDayProgress")
            .withIndex("by_plan_day", (q) => q.eq("planDayId", duplicateDay._id))
            .collect();

          for (const duplicateProgress of duplicateProgressEntries) {
            const canonicalProgress = canonicalByInstance.get(
              duplicateProgress.planInstanceId
            );

            if (!canonicalProgress) {
              progressEntriesRepointed++;
              if (!dryRun) {
                await ctx.db.patch(duplicateProgress._id, {
                  planDayId: canonicalDay._id,
                });
              }
              canonicalByInstance.set(duplicateProgress.planInstanceId, {
                ...duplicateProgress,
                planDayId: canonicalDay._id,
              });
              continue;
            }

            progressEntriesMerged++;
            if (!dryRun) {
              const canonicalStatusRank = getProgressPriority(canonicalProgress.status);
              const duplicateStatusRank = getProgressPriority(duplicateProgress.status);
              const mergedStatus =
                duplicateStatusRank > canonicalStatusRank
                  ? duplicateProgress.status
                  : canonicalProgress.status;

              await ctx.db.patch(canonicalProgress._id, {
                status: mergedStatus,
                workoutId: canonicalProgress.workoutId ?? duplicateProgress.workoutId,
                progressionDecision:
                  canonicalProgress.progressionDecision ??
                  duplicateProgress.progressionDecision,
                decisionReason:
                  canonicalProgress.decisionReason ?? duplicateProgress.decisionReason,
                scheduledDate:
                  canonicalProgress.scheduledDate ?? duplicateProgress.scheduledDate,
                updatedAt: Math.max(
                  canonicalProgress.updatedAt,
                  duplicateProgress.updatedAt
                ),
              });

              await ctx.db.delete(duplicateProgress._id);
            }
          }

          deletedDays++;
          if (!dryRun) {
            await ctx.db.delete(duplicateDay._id);
          }
        }
      }
    }

    return {
      dryRun,
      duplicateGroups,
      prescriptionsMoved,
      progressEntriesRepointed,
      progressEntriesMerged,
      deletedDays,
    };
  },
});
