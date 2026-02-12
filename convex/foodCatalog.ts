import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const PACKAGED_FOOD_SEED = [
  {
    name: "Greek Yogurt, Plain Nonfat",
    brand: "Generic",
    barcode: "850000123001",
    servingSize: 170,
    servingUnit: "g",
    calories: 100,
    protein: 18,
    carbs: 6,
    fat: 0,
    fiber: 0,
    source: "imported" as const,
  },
  {
    name: "Protein Oats Cup",
    brand: "Generic",
    barcode: "850000123002",
    servingSize: 60,
    servingUnit: "g",
    calories: 240,
    protein: 12,
    carbs: 38,
    fat: 5,
    fiber: 6,
    source: "imported" as const,
  },
  {
    name: "Whey Protein Isolate",
    brand: "Generic",
    barcode: "850000123003",
    servingSize: 32,
    servingUnit: "g",
    calories: 130,
    protein: 25,
    carbs: 3,
    fat: 2,
    fiber: 0,
    source: "imported" as const,
  },
  {
    name: "Chicken Breast Strips",
    brand: "Generic",
    barcode: "850000123004",
    servingSize: 112,
    servingUnit: "g",
    calories: 120,
    protein: 23,
    carbs: 0,
    fat: 2,
    fiber: 0,
    source: "imported" as const,
  },
  {
    name: "Brown Rice Microwavable Cup",
    brand: "Generic",
    barcode: "850000123005",
    servingSize: 125,
    servingUnit: "g",
    calories: 210,
    protein: 5,
    carbs: 43,
    fat: 2,
    fiber: 3,
    source: "imported" as const,
  },
];

export const seedPackagedFoods = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("foodItems").first();
    if (existing) {
      const items = await ctx.db.query("foodItems").collect();
      return { created: false, count: items.length };
    }

    const now = Date.now();
    for (const item of PACKAGED_FOOD_SEED) {
      await ctx.db.insert("foodItems", {
        ...item,
        isVerified: true,
        updatedAt: now,
        createdAt: now,
      });
    }

    return { created: true, count: PACKAGED_FOOD_SEED.length };
  },
});

export const lookupByBarcode = query({
  args: { barcode: v.string() },
  handler: async (ctx, args) => {
    const normalizedBarcode = args.barcode.trim();
    const exact = await ctx.db
      .query("foodItems")
      .withIndex("by_barcode", (q) => q.eq("barcode", normalizedBarcode))
      .collect();
    if (exact.length > 0) {
      return {
        source: "barcode",
        confidence: 1,
        candidates: exact,
      };
    }

    const fallbacks = (await ctx.db.query("foodItems").collect()).slice(0, 5);
    return {
      source: "fallback",
      confidence: 0.25,
      candidates: fallbacks,
    };
  },
});

export const searchFoods = query({
  args: {
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 25;
    let items = await ctx.db.query("foodItems").collect();
    if (args.query) {
      const queryLower = args.query.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(queryLower) ||
          item.brand?.toLowerCase().includes(queryLower)
      );
    }
    items.sort((a, b) => a.name.localeCompare(b.name));
    return items.slice(0, limit);
  },
});

export const createOrUpdateFoodItem = mutation({
  args: {
    name: v.string(),
    brand: v.optional(v.string()),
    barcode: v.optional(v.string()),
    servingSize: v.number(),
    servingUnit: v.string(),
    calories: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    fiber: v.optional(v.number()),
    source: v.union(
      v.literal("manual"),
      v.literal("usda"),
      v.literal("open_food_facts"),
      v.literal("imported")
    ),
    isVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.barcode) {
      const existingByBarcode = await ctx.db
        .query("foodItems")
        .withIndex("by_barcode", (q) => q.eq("barcode", args.barcode))
        .first();

      if (existingByBarcode) {
        await ctx.db.patch(existingByBarcode._id, {
          ...args,
          isVerified: args.isVerified ?? existingByBarcode.isVerified,
          updatedAt: now,
        });
        return { foodItemId: existingByBarcode._id, created: false };
      }
    }

    const foodItemId = await ctx.db.insert("foodItems", {
      ...args,
      isVerified: args.isVerified ?? false,
      createdAt: now,
      updatedAt: now,
    });

    return { foodItemId, created: true };
  },
});

export const recordCorrection = mutation({
  args: {
    userId: v.string(),
    foodItemId: v.id("foodItems"),
    barcode: v.optional(v.string()),
    field: v.string(),
    previousValue: v.string(),
    newValue: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("foodCorrections", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
