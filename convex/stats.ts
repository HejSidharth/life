import { query } from "./_generated/server";
import { v } from "convex/values";

// Helper to get start and end of a day in UTC
function getDayBounds(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

export const getTodayStats = query({
  args: {
    userId: v.string(),
    date: v.optional(v.number()), // Optional date timestamp, defaults to today
  },
  handler: async (ctx, args) => {
    const targetDate = args.date ? new Date(args.date) : new Date();
    const { start, end } = getDayBounds(targetDate);

    // Fetch today's food entries
    const foods = await ctx.db
      .query("foods")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const todaysFoods = foods.filter(
      (f) => f.consumedAt >= start && f.consumedAt <= end
    );

    // Aggregate food stats
    const foodStats = todaysFoods.reduce(
      (acc, food) => ({
        calories: acc.calories + food.calories,
        protein: acc.protein + food.protein,
        carbs: acc.carbs + food.carbs,
        fat: acc.fat + food.fat,
        fiber: acc.fiber + (food.fiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    // Fetch today's hydration entries
    const hydration = await ctx.db
      .query("hydration")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const todaysHydration = hydration.filter(
      (h) => h.consumedAt >= start && h.consumedAt <= end
    );

    // Sum water (all beverages count toward hydration)
    const waterMl = todaysHydration.reduce((acc, h) => acc + h.amount, 0);

    // Fetch today's exercises
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const todaysExercises = exercises.filter(
      (e) => e.performedAt >= start && e.performedAt <= end
    );

    // Sum exercise duration
    const exerciseMinutes = todaysExercises.reduce(
      (acc, e) => acc + (e.duration || 0),
      0
    );

    // Fetch user's goals
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const activeGoals = goals.filter((g) => g.isActive);

    // Create goals map
    const goalsMap: Record<string, number> = {};
    for (const goal of activeGoals) {
      goalsMap[goal.type] = goal.target;
    }

    return {
      food: {
        calories: Math.round(foodStats.calories),
        protein: Math.round(foodStats.protein),
        carbs: Math.round(foodStats.carbs),
        fat: Math.round(foodStats.fat),
        fiber: Math.round(foodStats.fiber),
      },
      water: {
        current: waterMl,
      },
      exercise: {
        minutes: exerciseMinutes,
        count: todaysExercises.length,
      },
      goals: {
        calories: goalsMap.calories || 2000,
        protein: goalsMap.protein || 150,
        carbs: goalsMap.carbs || 250,
        fat: goalsMap.fat || 65,
        water: goalsMap.water || 2500,
        exerciseMinutes: goalsMap.exercise_minutes || 60,
      },
    };
  },
});

export const getRecentActivity = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;

    // Get recent foods
    const foods = await ctx.db
      .query("foods")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Get recent exercises
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Get recent hydration
    const hydration = await ctx.db
      .query("hydration")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Combine and sort by timestamp
    const activities = [
      ...foods.map((f) => ({
        type: "food" as const,
        name: f.name,
        detail: `${f.calories} kcal`,
        timestamp: f.consumedAt,
      })),
      ...exercises.map((e) => ({
        type: "exercise" as const,
        name: e.name,
        detail: e.duration ? `${e.duration} min` : e.sets ? `${e.sets}x${e.reps}` : "",
        timestamp: e.performedAt,
      })),
      ...hydration.map((h) => ({
        type: "hydration" as const,
        name: h.beverageType,
        detail: `${h.amount} ml`,
        timestamp: h.consumedAt,
      })),
    ];

    // Sort by timestamp descending and take limit
    activities.sort((a, b) => b.timestamp - a.timestamp);
    return activities.slice(0, limit);
  },
});

export const getContributionHistory = query({
  args: {
    userId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysToFetch = args.days || 365;
    const now = new Date();
    const startTime = new Date(now);
    startTime.setDate(now.getDate() - daysToFetch);
    startTime.setHours(0, 0, 0, 0);

    const startTimestamp = startTime.getTime();

    // Fetch all entries since startTimestamp
    const [foods, exercises, hydration] = await Promise.all([
      ctx.db
        .query("foods")
        .withIndex("by_user_date", (q) =>
          q.eq("userId", args.userId).gte("consumedAt", startTimestamp)
        )
        .collect(),
      ctx.db
        .query("exercises")
        .withIndex("by_user_date", (q) =>
          q.eq("userId", args.userId).gte("performedAt", startTimestamp)
        )
        .collect(),
      ctx.db
        .query("hydration")
        .withIndex("by_user_date", (q) =>
          q.eq("userId", args.userId).gte("consumedAt", startTimestamp)
        )
        .collect(),
    ]);

    // Group counts by date string (YYYY-MM-DD)
    const counts: Record<string, number> = {};

    const addToCounts = (timestamp: number) => {
      const dateStr = new Date(timestamp).toISOString().split("T")[0];
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    };

    foods.forEach((f) => addToCounts(f.consumedAt));
    exercises.forEach((e) => addToCounts(e.performedAt));
    hydration.forEach((h) => addToCounts(h.consumedAt));

    return counts;
  },
});

