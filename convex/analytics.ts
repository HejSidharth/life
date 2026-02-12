import { query } from "./_generated/server";
import { v } from "convex/values";

function getWindowStart(days: number): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() - days + 1);
  return now.getTime();
}

export const getTrainingAnalytics = query({
  args: {
    userId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 28;
    const windowStart = getWindowStart(days);

    const [workouts, progress, sets] = await Promise.all([
      ctx.db
        .query("workouts")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
      ctx.db
        .query("userPlanDayProgress")
        .withIndex("by_user_status", (q) => q.eq("userId", args.userId).eq("status", "completed"))
        .collect(),
      ctx.db
        .query("exerciseSets")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
    ]);

    const recentWorkouts = workouts.filter(
      (workout) => workout.startedAt >= windowStart && workout.status === "completed"
    );
    const recentProgress = progress.filter(
      (entry) => (entry.scheduledDate ?? 0) >= windowStart
    );
    const recentSets = sets.filter((set) => (set.completedAt ?? 0) >= windowStart);

    const completedSessions = recentWorkouts.length;
    const plannedSessions = recentProgress.length;
    const adherenceRate =
      plannedSessions === 0 ? 0 : Math.round((completedSessions / plannedSessions) * 100);

    const progression = {
      increase: recentProgress.filter((entry) => entry.progressionDecision === "increase").length,
      hold: recentProgress.filter((entry) => entry.progressionDecision === "hold").length,
      reduce: recentProgress.filter((entry) => entry.progressionDecision === "reduce").length,
    };

    const volumeByExercise: Record<string, number> = {};
    for (const set of recentSets) {
      if (!set.isCompleted || !set.weight || !set.reps) continue;
      const key = set.exerciseLibraryId.toString();
      volumeByExercise[key] = (volumeByExercise[key] || 0) + set.weight * set.reps;
    }

    return {
      completedSessions,
      plannedSessions,
      adherenceRate,
      progression,
      volumeByExercise,
    };
  },
});

export const getNutritionAnalytics = query({
  args: {
    userId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 28;
    const windowStart = getWindowStart(days);

    const foods = await ctx.db
      .query("foods")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const recentFoods = foods.filter((food) => food.consumedAt >= windowStart);
    const totals = recentFoods.reduce(
      (acc, food) => {
        acc.calories += food.calories;
        acc.protein += food.protein;
        acc.carbs += food.carbs;
        acc.fat += food.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const loggedDays = new Set(
      recentFoods.map((food) => new Date(food.consumedAt).toISOString().split("T")[0])
    ).size;
    const loggingCompleteness = Math.round((loggedDays / days) * 100);

    return {
      totals,
      mealsLogged: recentFoods.length,
      loggedDays,
      loggingCompleteness,
    };
  },
});

export const getAccountabilitySummary = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const foods = await ctx.db
      .query("foods")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const activeDates = new Set<string>();
    for (const food of foods) {
      activeDates.add(new Date(food.consumedAt).toISOString().split("T")[0]);
    }
    for (const workout of workouts) {
      if (workout.status === "completed") {
        activeDates.add(new Date(workout.startedAt).toISOString().split("T")[0]);
      }
    }

    const sorted = Array.from(activeDates).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let previousDate: Date | null = null;

    for (const dateString of sorted) {
      const currentDate = new Date(`${dateString}T00:00:00.000Z`);
      if (!previousDate) {
        currentStreak = 1;
      } else {
        const diffDays = Math.round(
          (currentDate.getTime() - previousDate.getTime()) / 86400000
        );
        currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
      }
      longestStreak = Math.max(longestStreak, currentStreak);
      previousDate = currentDate;
    }

    const workoutsThisWeek = workouts.filter((workout) => {
      if (workout.status !== "completed") return false;
      const weekStart = new Date();
      const day = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - day);
      weekStart.setHours(0, 0, 0, 0);
      return workout.startedAt >= weekStart.getTime();
    }).length;

    return {
      currentStreak,
      longestStreak,
      workoutsThisWeek,
      nudge:
        workoutsThisWeek >= 4
          ? "Strong week. Keep momentum through your next planned session."
          : `You are ${Math.max(0, 4 - workoutsThisWeek)} session(s) away from a 4-session week.`,
    };
  },
});
