import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all goals for a user
export const getAll = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get active goals for a user
export const getActive = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return goals.filter((g) => g.isActive);
  },
});

// Get a specific goal by type
export const getByType = query({
  args: {
    userId: v.string(),
    type: v.union(
      v.literal("calories"),
      v.literal("protein"),
      v.literal("carbs"),
      v.literal("fat"),
      v.literal("water"),
      v.literal("exercise_minutes")
    ),
  },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", args.userId).eq("type", args.type)
      )
      .collect();
    return goals.find((g) => g.isActive) || null;
  },
});

// Create or update a goal
export const upsert = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("goals")
      .withIndex("by_user_type", (q) =>
        q.eq("userId", args.userId).eq("type", args.type)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        target: args.target,
        isActive: true,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("goals", {
        userId: args.userId,
        type: args.type,
        target: args.target,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Toggle goal active status
export const toggleActive = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.id);
    if (goal) {
      await ctx.db.patch(args.id, {
        isActive: !goal.isActive,
        updatedAt: Date.now(),
      });
    }
  },
});

// Delete a goal
export const remove = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
