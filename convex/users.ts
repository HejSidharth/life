import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get or create user profile
export const getOrCreate = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      return existing;
    }

    // Create new user with defaults
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      weightUnit: "lbs",
      distanceUnit: "miles",
      createdAt: Date.now(),
      dailyWaterTarget: 8,
    });

    return await ctx.db.get(userId);
  },
});

// Get user profile
export const getProfile = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    weightUnit: v.optional(v.union(v.literal("lbs"), v.literal("kg"))),
    distanceUnit: v.optional(v.union(v.literal("km"), v.literal("miles"))),
    age: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"))),
    heightCm: v.optional(v.number()),
    weightKg: v.optional(v.number()),
    activityLevel: v.optional(v.union(
      v.literal("sedentary"),
      v.literal("light"),
      v.literal("moderate"),
      v.literal("active"),
      v.literal("very_active")
    )),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.weightUnit !== undefined) updates.weightUnit = args.weightUnit;
    if (args.distanceUnit !== undefined) updates.distanceUnit = args.distanceUnit;
    if (args.age !== undefined) updates.age = args.age;
    if (args.gender !== undefined) updates.gender = args.gender;
    if (args.heightCm !== undefined) updates.heightCm = args.heightCm;
    if (args.weightKg !== undefined) updates.weightKg = args.weightKg;
    if (args.activityLevel !== undefined) updates.activityLevel = args.activityLevel;

    await ctx.db.patch(user._id, updates);
    return await ctx.db.get(user._id);
  },
});

// Calculate daily calorie target using Mifflin-St Jeor equation
export const calculateCalories = mutation({
  args: {
    clerkId: v.string(),
    weightKg: v.number(),
    heightCm: v.number(),
    age: v.number(),
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    activityLevel: v.union(
      v.literal("sedentary"),
      v.literal("light"),
      v.literal("moderate"),
      v.literal("active"),
      v.literal("very_active")
    ),
    fitnessGoal: v.union(
      v.literal("lose_weight"),
      v.literal("maintain"),
      v.literal("gain_muscle"),
      v.literal("strength"),
      v.literal("general")
    ),
  },
  handler: async (ctx, args) => {
    // Mifflin-St Jeor Equation
    let bmr = (10 * args.weightKg) + (6.25 * args.heightCm) - (5 * args.age);
    
    // Gender modifier
    if (args.gender === "male") {
      bmr += 5;
    } else if (args.gender === "female") {
      bmr -= 161;
    } else {
      // For "other", use average of male/female modifiers
      bmr -= 78;
    }

    // Activity multipliers
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const tdee = Math.round(bmr * activityMultipliers[args.activityLevel]);

    // Adjust based on fitness goal
    let targetCalories = tdee;
    let proteinRatio = 0.3;
    let carbsRatio = 0.4;
    let fatRatio = 0.3;

    switch (args.fitnessGoal) {
      case "lose_weight":
        targetCalories = tdee - 500; // 500 calorie deficit
        proteinRatio = 0.4; // Higher protein to preserve muscle
        carbsRatio = 0.3;
        fatRatio = 0.3;
        break;
      case "gain_muscle":
        targetCalories = tdee + 300; // 300 calorie surplus
        proteinRatio = 0.35;
        carbsRatio = 0.45; // Higher carbs for energy
        fatRatio = 0.2;
        break;
      case "strength":
        targetCalories = tdee + 200;
        proteinRatio = 0.35;
        carbsRatio = 0.4;
        fatRatio = 0.25;
        break;
      case "general":
      case "maintain":
      default:
        // Keep TDEE as is
        break;
    }

    // Calculate macros (in grams)
    const proteinGrams = Math.round((targetCalories * proteinRatio) / 4);
    const carbsGrams = Math.round((targetCalories * carbsRatio) / 4);
    const fatGrams = Math.round((targetCalories * fatRatio) / 9);

    return {
      bmr: Math.round(bmr),
      tdee,
      targetCalories: Math.round(targetCalories),
      proteinGrams,
      carbsGrams,
      fatGrams,
    };
  },
});

// Save onboarding data
export const completeOnboarding = mutation({
  args: {
    clerkId: v.string(),
    weightUnit: v.union(v.literal("lbs"), v.literal("kg")),
    distanceUnit: v.union(v.literal("km"), v.literal("miles")),
    age: v.number(),
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    heightCm: v.number(),
    weightKg: v.number(),
    activityLevel: v.union(
      v.literal("sedentary"),
      v.literal("light"),
      v.literal("moderate"),
      v.literal("active"),
      v.literal("very_active")
    ),
    fitnessGoal: v.union(
      v.literal("lose_weight"),
      v.literal("maintain"),
      v.literal("gain_muscle"),
      v.literal("strength"),
      v.literal("general")
    ),
    weeklyWorkoutGoal: v.number(),
    preferredWorkoutDays: v.array(v.number()),
    experienceLevel: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    dailyCalorieTarget: v.number(),
    dailyProteinTarget: v.number(),
    dailyCarbsTarget: v.number(),
    dailyFatTarget: v.number(),
    dailyWaterTarget: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      weightUnit: args.weightUnit,
      distanceUnit: args.distanceUnit,
      age: args.age,
      gender: args.gender,
      heightCm: args.heightCm,
      weightKg: args.weightKg,
      activityLevel: args.activityLevel,
      fitnessGoal: args.fitnessGoal,
      weeklyWorkoutGoal: args.weeklyWorkoutGoal,
      preferredWorkoutDays: args.preferredWorkoutDays,
      experienceLevel: args.experienceLevel,
      dailyCalorieTarget: args.dailyCalorieTarget,
      dailyProteinTarget: args.dailyProteinTarget,
      dailyCarbsTarget: args.dailyCarbsTarget,
      dailyFatTarget: args.dailyFatTarget,
      dailyWaterTarget: args.dailyWaterTarget,
      onboardingCompletedAt: Date.now(),
    });

    return await ctx.db.get(user._id);
  },
});

// Reset onboarding (for settings)
export const resetOnboarding = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      onboardingCompletedAt: undefined,
    });

    return await ctx.db.get(user._id);
  },
});

// Update daily targets
export const updateTargets = mutation({
  args: {
    clerkId: v.string(),
    dailyCalorieTarget: v.optional(v.number()),
    dailyProteinTarget: v.optional(v.number()),
    dailyCarbsTarget: v.optional(v.number()),
    dailyFatTarget: v.optional(v.number()),
    dailyWaterTarget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.dailyCalorieTarget !== undefined) updates.dailyCalorieTarget = args.dailyCalorieTarget;
    if (args.dailyProteinTarget !== undefined) updates.dailyProteinTarget = args.dailyProteinTarget;
    if (args.dailyCarbsTarget !== undefined) updates.dailyCarbsTarget = args.dailyCarbsTarget;
    if (args.dailyFatTarget !== undefined) updates.dailyFatTarget = args.dailyFatTarget;
    if (args.dailyWaterTarget !== undefined) updates.dailyWaterTarget = args.dailyWaterTarget;

    await ctx.db.patch(user._id, updates);
    return await ctx.db.get(user._id);
  },
});
