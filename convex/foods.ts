import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all foods for a user within a date range
export const getByDateRange = query({
  args: {
    userId: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const foods = await ctx.db
      .query("foods")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).gte("consumedAt", args.startDate).lte("consumedAt", args.endDate)
      )
      .collect();
    return foods.sort((a, b) => b.consumedAt - a.consumedAt);
  },
});

// Get today's foods
export const getToday = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();
    today.setHours(23, 59, 59, 999);
    const endOfDay = today.getTime();

    const foods = await ctx.db
      .query("foods")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).gte("consumedAt", startOfDay).lte("consumedAt", endOfDay)
      )
      .collect();
    return foods.sort((a, b) => b.consumedAt - a.consumedAt);
  },
});

// Add a food entry
export const add = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("foods", args);
  },
});

// Update a food entry
export const update = mutation({
  args: {
    id: v.id("foods"),
    name: v.optional(v.string()),
    mealType: v.optional(
      v.union(
        v.literal("breakfast"),
        v.literal("lunch"),
        v.literal("dinner"),
        v.literal("snack")
      )
    ),
    calories: v.optional(v.number()),
    protein: v.optional(v.number()),
    carbs: v.optional(v.number()),
    fat: v.optional(v.number()),
    fiber: v.optional(v.number()),
    portionSize: v.optional(v.string()),
    notes: v.optional(v.string()),
    consumedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete a food entry
export const remove = mutation({
  args: { id: v.id("foods") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
