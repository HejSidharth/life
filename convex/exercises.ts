import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all exercises for a user within a date range
export const getByDateRange = query({
  args: {
    userId: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).gte("performedAt", args.startDate).lte("performedAt", args.endDate)
      )
      .collect();
    return exercises.sort((a, b) => b.performedAt - a.performedAt);
  },
});

// Get today's exercises
export const getToday = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();
    today.setHours(23, 59, 59, 999);
    const endOfDay = today.getTime();

    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).gte("performedAt", startOfDay).lte("performedAt", endOfDay)
      )
      .collect();
    return exercises.sort((a, b) => b.performedAt - a.performedAt);
  },
});

// Add an exercise entry
export const add = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("exercises", args);
  },
});

// Update an exercise entry
export const update = mutation({
  args: {
    id: v.id("exercises"),
    name: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("strength"),
        v.literal("cardio"),
        v.literal("flexibility"),
        v.literal("other")
      )
    ),
    muscleGroups: v.optional(v.array(v.string())),
    sets: v.optional(v.number()),
    reps: v.optional(v.number()),
    weight: v.optional(v.number()),
    weightUnit: v.optional(v.union(v.literal("lbs"), v.literal("kg"))),
    duration: v.optional(v.number()),
    distance: v.optional(v.number()),
    distanceUnit: v.optional(v.union(v.literal("km"), v.literal("miles"))),
    notes: v.optional(v.string()),
    performedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete an exercise entry
export const remove = mutation({
  args: { id: v.id("exercises") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
