import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const GOALS = ["strength", "hypertrophy", "general_fitness"] as const;
const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const SPLITS = [
  { key: "full_body", label: "Full Body", days: [3, 4] },
  { key: "upper_lower", label: "Upper/Lower", days: [4] },
  { key: "ppl", label: "Push Pull Legs", days: [3, 5, 6] },
  { key: "powerbuilding", label: "Powerbuilding", days: [4, 5] },
  { key: "time_capped", label: "Time Capped", days: [3, 4, 5] },
];

const FOCUS_BY_SPLIT: Record<string, string[]> = {
  full_body: ["Full Body A", "Full Body B", "Full Body C", "Full Body D"],
  upper_lower: ["Upper A", "Lower A", "Upper B", "Lower B"],
  ppl: ["Push", "Pull", "Legs", "Push 2", "Pull 2", "Legs 2"],
  powerbuilding: ["Upper Power", "Lower Power", "Upper Volume", "Lower Volume", "Weak Point"],
  time_capped: ["Push Focus", "Pull Focus", "Lower Focus", "Full Body Density", "Conditioning + Core"],
};

function toSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function defaultSessionMinutes(goal: string, splitKey: string): number {
  if (splitKey === "time_capped") return 45;
  if (goal === "strength") return 70;
  if (goal === "hypertrophy") return 65;
  return 55;
}

function defaultPrescriptionReps(goal: string, focus: string): string {
  if (goal === "strength" && focus.toLowerCase().includes("power")) return "3-5";
  if (goal === "strength") return "4-6";
  if (goal === "hypertrophy") return "8-12";
  return "6-10";
}

export const seedPlanTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("planTemplates").first();
    if (existing) {
      const templates = await ctx.db.query("planTemplates").collect();
      return { created: false, count: templates.length };
    }

    const variantPool = await ctx.db.query("exerciseVariants").collect();
    if (variantPool.length === 0) {
      throw new Error("Exercise variants are empty. Run exerciseCatalog.seedCatalog first.");
    }

    const now = Date.now();
    let created = 0;
    let variantCursor = 0;
    const TEMPLATE_CAP = 45;

    for (const goal of GOALS) {
      for (const level of LEVELS) {
        for (const split of SPLITS) {
          for (const days of split.days) {
            if (created >= TEMPLATE_CAP) {
              break;
            }
            const name = `${split.label} ${goal.replace("_", " ")} ${level} (${days}d)`;
            const slug = toSlug(name);

            const templateId = await ctx.db.insert("planTemplates", {
              name,
              slug,
              goal,
              experienceLevel: level,
              daysPerWeek: days,
              sessionMinutes: defaultSessionMinutes(goal, split.key),
              description: `Built-in ${split.label} plan targeting ${goal} outcomes for ${level} lifters.`,
              isBuiltIn: true,
              createdAt: now,
            });

            const blockId = await ctx.db.insert("planBlocks", {
              planTemplateId: templateId,
              blockOrder: 1,
              name: "Base Accumulation",
              weeks: 4,
              createdAt: now,
            });

            for (let weekNumber = 1; weekNumber <= 4; weekNumber += 1) {
              const weekId = await ctx.db.insert("planWeeks", {
                planTemplateId: templateId,
                blockId,
                weekNumber,
                createdAt: now,
              });

              const focusOptions = FOCUS_BY_SPLIT[split.key];
              for (let dayNumber = 1; dayNumber <= days; dayNumber += 1) {
                const focus = focusOptions[(dayNumber - 1) % focusOptions.length];
                const dayId = await ctx.db.insert("planDays", {
                  planTemplateId: templateId,
                  weekId,
                  dayNumber,
                  name: `${focus} - Week ${weekNumber}`,
                  focus,
                  estimatedMinutes: defaultSessionMinutes(goal, split.key),
                  createdAt: now,
                });

                for (let order = 1; order <= 6; order += 1) {
                  const variant = variantPool[variantCursor % variantPool.length];
                  variantCursor += 1;

                  await ctx.db.insert("planPrescriptions", {
                    planDayId: dayId,
                    order,
                    exerciseVariantId: variant._id,
                    targetSets: order <= 2 ? 4 : 3,
                    targetReps: defaultPrescriptionReps(goal, focus),
                    targetRir: goal === "strength" ? 2 : 1,
                    restSeconds: order <= 2 ? 150 : 90,
                    notes:
                      order === 1
                        ? "Primary movement: keep reps crisp and log top set."
                        : undefined,
                    substitutionTags: variant.contraindicationTags,
                    createdAt: now,
                  });
                }
              }
            }

            created += 1;
          }
          if (created >= TEMPLATE_CAP) {
            break;
          }
        }
        if (created >= TEMPLATE_CAP) {
          break;
        }
      }
      if (created >= TEMPLATE_CAP) {
        break;
      }
    }

    return { created: true, count: created };
  },
});

export const getAll = query({
  args: {
    goal: v.optional(
      v.union(
        v.literal("strength"),
        v.literal("hypertrophy"),
        v.literal("general_fitness")
      )
    ),
    experienceLevel: v.optional(
      v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
    ),
    daysPerWeek: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let templates = await ctx.db.query("planTemplates").collect();

    if (args.goal) {
      templates = templates.filter((template) => template.goal === args.goal);
    }

    if (args.experienceLevel) {
      templates = templates.filter(
        (template) => template.experienceLevel === args.experienceLevel
      );
    }

    if (args.daysPerWeek) {
      templates = templates.filter(
        (template) => template.daysPerWeek === args.daysPerWeek
      );
    }

    templates.sort((a, b) => a.name.localeCompare(b.name));
    return templates;
  },
});

export const getTemplateWithStructure = query({
  args: { planTemplateId: v.id("planTemplates") },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.planTemplateId);
    if (!template) return null;

    const weeks = await ctx.db
      .query("planWeeks")
      .withIndex("by_plan", (q) => q.eq("planTemplateId", args.planTemplateId))
      .collect();
    weeks.sort((a, b) => a.weekNumber - b.weekNumber);

    const weekPayload = await Promise.all(
      weeks.map(async (week) => {
        const days = await ctx.db
          .query("planDays")
          .withIndex("by_week", (q) => q.eq("weekId", week._id))
          .collect();
        days.sort((a, b) => a.dayNumber - b.dayNumber);

        const daysWithPrescriptions = await Promise.all(
          days.map(async (day) => {
            const prescriptions = await ctx.db
              .query("planPrescriptions")
              .withIndex("by_plan_day", (q) => q.eq("planDayId", day._id))
              .collect();

            prescriptions.sort((a, b) => a.order - b.order);
            return { ...day, prescriptions };
          })
        );

        return { ...week, days: daysWithPrescriptions };
      })
    );

    return { ...template, weeks: weekPayload };
  },
});
