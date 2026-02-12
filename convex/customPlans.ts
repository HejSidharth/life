import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createCustomPlan = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    days: v.array(
      v.object({
        name: v.string(),
        exercises: v.array(
          v.object({
            exerciseLibraryId: v.id("exerciseLibrary"),
            exerciseName: v.string(),
            targetSets: v.number(),
            targetReps: v.string(),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // 1. Create the Plan Template
    const planTemplateId = await ctx.db.insert("planTemplates", {
      userId: args.userId,
      name: args.name,
      slug: `custom-${args.userId}-${now}`,
      goal: "general_fitness",
      experienceLevel: "intermediate",
      daysPerWeek: args.days.length,
      sessionMinutes: 60,
      isBuiltIn: false,
      createdAt: now,
    });

    // 2. Create a single Plan Week
    const weekId = await ctx.db.insert("planWeeks", {
      planTemplateId,
      weekNumber: 1,
      createdAt: now,
    });

    // 3. Create Plan Days and Prescriptions
    for (let i = 0; i < args.days.length; i++) {
      const dayData = args.days[i];
      const dayId = await ctx.db.insert("planDays", {
        planTemplateId,
        weekId,
        dayNumber: i + 1,
        name: dayData.name,
        focus: dayData.name,
        estimatedMinutes: 60,
        createdAt: now,
      });

      for (let j = 0; j < dayData.exercises.length; j++) {
        const ex = dayData.exercises[j];
        await ctx.db.insert("planPrescriptions", {
          planDayId: dayId,
          order: j + 1,
          exerciseLibraryId: ex.exerciseLibraryId,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          createdAt: now,
        });
      }
    }

    return { planTemplateId };
  },
});
