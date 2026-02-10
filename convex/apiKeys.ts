import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Simple hash function for API keys
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

// Get all API keys for a user (without the actual key)
export const getAll = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Create a new API key
export const create = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    keyHash: v.string(),
    keyPrefix: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("apiKeys", {
      userId: args.userId,
      name: args.name,
      keyHash: args.keyHash,
      keyPrefix: args.keyPrefix,
      createdAt: Date.now(),
    });
  },
});

// Validate an API key and return the userId if valid
export const validate = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const keyHash = simpleHash(args.key);
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_key_hash", (q) => q.eq("keyHash", keyHash))
      .first();

    if (!apiKey) return null;
    return { userId: apiKey.userId, keyId: apiKey._id };
  },
});

// Update last used timestamp
export const updateLastUsed = mutation({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastUsedAt: Date.now() });
  },
});

// Delete an API key
export const remove = mutation({
  args: { id: v.id("apiKeys") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
