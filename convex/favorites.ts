import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get food favorites for a user, sorted by use count
export const getFoodFavorites = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("foodFavorites")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return favorites.sort((a, b) => b.useCount - a.useCount);
  },
});

// Get exercise favorites for a user, sorted by use count
export const getExerciseFavorites = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("exerciseFavorites")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return favorites.sort((a, b) => b.useCount - a.useCount);
  },
});

// Add or update a food favorite
export const upsertFoodFavorite = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    calories: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    fiber: v.optional(v.number()),
    portionSize: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("foodFavorites")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const match = existing.find(
      (f) => f.name.toLowerCase() === args.name.toLowerCase()
    );

    if (match) {
      await ctx.db.patch(match._id, {
        ...args,
        useCount: match.useCount + 1,
        lastUsedAt: Date.now(),
      });
      return match._id;
    } else {
      return await ctx.db.insert("foodFavorites", {
        ...args,
        useCount: 1,
        lastUsedAt: Date.now(),
      });
    }
  },
});

// Add or update an exercise favorite
export const upsertExerciseFavorite = mutation({
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
    defaultSets: v.optional(v.number()),
    defaultReps: v.optional(v.number()),
    defaultWeight: v.optional(v.number()),
    defaultDuration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("exerciseFavorites")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const match = existing.find(
      (f) => f.name.toLowerCase() === args.name.toLowerCase()
    );

    if (match) {
      await ctx.db.patch(match._id, {
        ...args,
        useCount: match.useCount + 1,
        lastUsedAt: Date.now(),
      });
      return match._id;
    } else {
      return await ctx.db.insert("exerciseFavorites", {
        ...args,
        useCount: 1,
        lastUsedAt: Date.now(),
      });
    }
  },
});

// Delete a food favorite
export const removeFoodFavorite = mutation({
  args: { id: v.id("foodFavorites") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Delete an exercise favorite
export const removeExerciseFavorite = mutation({
  args: { id: v.id("exerciseFavorites") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
