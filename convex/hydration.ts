import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all hydration entries for a user within a date range
export const getByDateRange = query({
  args: {
    userId: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("hydration")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).gte("consumedAt", args.startDate).lte("consumedAt", args.endDate)
      )
      .collect();
    return entries.sort((a, b) => b.consumedAt - a.consumedAt);
  },
});

// Get today's hydration
export const getToday = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();
    today.setHours(23, 59, 59, 999);
    const endOfDay = today.getTime();

    const entries = await ctx.db
      .query("hydration")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).gte("consumedAt", startOfDay).lte("consumedAt", endOfDay)
      )
      .collect();
    return entries.sort((a, b) => b.consumedAt - a.consumedAt);
  },
});

// Get today's total water intake in ml
export const getTodayTotal = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();
    today.setHours(23, 59, 59, 999);
    const endOfDay = today.getTime();

    const entries = await ctx.db
      .query("hydration")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).gte("consumedAt", startOfDay).lte("consumedAt", endOfDay)
      )
      .collect();

    return entries.reduce((total, entry) => total + entry.amount, 0);
  },
});

// Add a hydration entry
export const add = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("hydration", args);
  },
});

// Delete a hydration entry
export const remove = mutation({
  args: { id: v.id("hydration") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
