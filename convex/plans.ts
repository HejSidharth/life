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
