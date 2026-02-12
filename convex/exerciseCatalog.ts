import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

interface FamilySeed {
  name: string;
  slug: string;
  movementPatternKey: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  baseNames: string[];
}

const MOVEMENT_PATTERNS = [
  { key: "squat", name: "Squat", description: "Knee-dominant lower-body patterns" },
  { key: "hinge", name: "Hinge", description: "Hip-dominant lower-body patterns" },
  { key: "horizontal_push", name: "Horizontal Push", description: "Pressing from horizontal planes" },
  { key: "vertical_push", name: "Vertical Push", description: "Overhead and angled presses" },
  { key: "horizontal_pull", name: "Horizontal Pull", description: "Rowing and retraction patterns" },
  { key: "vertical_pull", name: "Vertical Pull", description: "Pulldown and pull-up patterns" },
  { key: "single_leg", name: "Single Leg", description: "Unilateral lower-body movement patterns" },
  { key: "isolation", name: "Isolation", description: "Single-joint targeting movements" },
  { key: "core", name: "Core", description: "Anti-movement and trunk patterns" },
  { key: "carry", name: "Carries", description: "Loaded carry and stability patterns" },
  { key: "conditioning", name: "Conditioning", description: "Cardio and conditioning work" },
];

const EQUIPMENT_TYPES = [
  { key: "barbell", name: "Barbell", category: "free_weights" as const },
  { key: "dumbbell", name: "Dumbbell", category: "free_weights" as const },
  { key: "kettlebell", name: "Kettlebell", category: "free_weights" as const },
  { key: "cable", name: "Cable", category: "machines" as const },
  { key: "machine", name: "Machine", category: "machines" as const },
  { key: "smith_machine", name: "Smith Machine", category: "machines" as const },
  { key: "bodyweight", name: "Bodyweight", category: "bodyweight" as const },
  { key: "bands", name: "Bands", category: "accessory" as const },
  { key: "sled", name: "Sled", category: "accessory" as const },
  { key: "landmine", name: "Landmine", category: "accessory" as const },
  { key: "cardio_machine", name: "Cardio Machine", category: "cardio" as const },
];

const CONTRAINDICATION_TAGS = [
  { key: "overhead_sensitive", label: "Overhead Sensitive", description: "May aggravate overhead pain" },
  { key: "deep_knee_flexion", label: "Deep Knee Flexion Sensitive", description: "Reduce deep knee bend exposure" },
  { key: "lumbar_flexion_risk", label: "Lumbar Flexion Risk", description: "Needs trunk bracing and hinge control" },
  { key: "shoulder_abduction_ir", label: "Shoulder Abduction/IR Sensitive", description: "May stress shoulder impingement zones" },
  { key: "elbow_tendon_sensitive", label: "Elbow Tendon Sensitive", description: "May irritate elbow tendons" },
];

const TECHNIQUE_SOURCES = [
  {
    sourceName: "Jeff Nippard",
    youtubeUrl: "https://www.youtube.com/@JeffNippard",
    cueNotes: ["Control eccentrics", "Use full ROM", "Prioritize repeatable form"],
  },
  {
    sourceName: "Renaissance Periodization",
    youtubeUrl: "https://www.youtube.com/@RenaissancePeriodization",
    cueNotes: ["Train close to failure", "Standardize setup", "Keep effort honest"],
  },
  {
    sourceName: "Squat University",
    youtubeUrl: "https://www.youtube.com/@SquatUniversity",
    cueNotes: ["Brace before moving", "Fix setup", "Respect pain signals"],
  },
  {
    sourceName: "Starting Strength",
    youtubeUrl: "https://www.youtube.com/@AasgaardCo",
    cueNotes: ["Midfoot pressure", "Bar path control", "Aggressive lockout"],
  },
];

const FAMILY_SEEDS: FamilySeed[] = [
  {
    name: "Bench Press Family",
    slug: "bench-press",
    movementPatternKey: "horizontal_push",
    primaryMuscles: ["Chest"],
    secondaryMuscles: ["Triceps", "Shoulders"],
    baseNames: ["Bench Press", "Incline Press", "Decline Press", "Floor Press"],
  },
  {
    name: "Overhead Press Family",
    slug: "overhead-press",
    movementPatternKey: "vertical_push",
    primaryMuscles: ["Shoulders"],
    secondaryMuscles: ["Triceps", "Core"],
    baseNames: ["Overhead Press", "Push Press", "Seated Press", "Arnold Press"],
  },
  {
    name: "Row Family",
    slug: "row",
    movementPatternKey: "horizontal_pull",
    primaryMuscles: ["Back"],
    secondaryMuscles: ["Biceps", "Rear Delts"],
    baseNames: ["Bent Row", "Chest Supported Row", "1-Arm Row", "Seal Row"],
  },
  {
    name: "Pull Family",
    slug: "pull",
    movementPatternKey: "vertical_pull",
    primaryMuscles: ["Back"],
    secondaryMuscles: ["Biceps", "Forearms"],
    baseNames: ["Pull-up", "Chin-up", "Pulldown", "Neutral Pull-up"],
  },
  {
    name: "Squat Family",
    slug: "squat",
    movementPatternKey: "squat",
    primaryMuscles: ["Quads"],
    secondaryMuscles: ["Glutes", "Core"],
    baseNames: ["Back Squat", "Front Squat", "Box Squat", "Tempo Squat"],
  },
  {
    name: "Hinge Family",
    slug: "hinge",
    movementPatternKey: "hinge",
    primaryMuscles: ["Hamstrings"],
    secondaryMuscles: ["Glutes", "Back"],
    baseNames: ["Deadlift", "Romanian Deadlift", "Stiff-Leg Deadlift", "Good Morning"],
  },
  {
    name: "Single-Leg Family",
    slug: "single-leg",
    movementPatternKey: "single_leg",
    primaryMuscles: ["Quads", "Glutes"],
    secondaryMuscles: ["Core", "Hamstrings"],
    baseNames: ["Split Squat", "Lunge", "Step-up", "Single-Leg RDL"],
  },
  {
    name: "Arms Isolation Family",
    slug: "arms-isolation",
    movementPatternKey: "isolation",
    primaryMuscles: ["Biceps", "Triceps"],
    secondaryMuscles: ["Forearms"],
    baseNames: ["Curl", "Hammer Curl", "Pushdown", "Overhead Extension"],
  },
  {
    name: "Shoulder Isolation Family",
    slug: "shoulder-isolation",
    movementPatternKey: "isolation",
    primaryMuscles: ["Shoulders"],
    secondaryMuscles: ["Upper Back"],
    baseNames: ["Lateral Raise", "Rear Delt Fly", "Front Raise", "Y Raise"],
  },
  {
    name: "Core Family",
    slug: "core",
    movementPatternKey: "core",
    primaryMuscles: ["Core"],
    secondaryMuscles: ["Obliques", "Lower Back"],
    baseNames: ["Plank", "Dead Bug", "Pallof Press", "Hanging Leg Raise"],
  },
  {
    name: "Carry Family",
    slug: "carry",
    movementPatternKey: "carry",
    primaryMuscles: ["Core", "Forearms"],
    secondaryMuscles: ["Upper Back", "Legs"],
    baseNames: ["Farmer Carry", "Suitcase Carry", "Front Rack Carry", "Overhead Carry"],
  },
  {
    name: "Conditioning Family",
    slug: "conditioning",
    movementPatternKey: "conditioning",
    primaryMuscles: ["Cardio"],
    secondaryMuscles: ["Full Body"],
    baseNames: ["Intervals", "Steady State", "EMOM", "Circuit"],
  },
];

const MODIFIERS = [
  "Standard",
  "Paused",
  "Tempo",
  "Deficit",
  "Cluster",
  "Myo-Rep",
  "Back-Off",
  "Heavy",
];

function titleCaseFromKey(key: string): string {
  return key
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function toSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function inferCategory(patternKey: string, equipmentKey: string) {
  if (patternKey === "conditioning") return "cardio" as const;
  if (equipmentKey === "bodyweight") return "bodyweight" as const;
  if (equipmentKey === "machine" || equipmentKey === "cable" || equipmentKey === "smith_machine") {
    return "machine" as const;
  }
  return "strength" as const;
}

function inferDifficulty(modifier: string) {
  if (modifier === "Standard" || modifier === "Back-Off") return "beginner" as const;
  if (modifier === "Paused" || modifier === "Tempo" || modifier === "Heavy") {
    return "intermediate" as const;
  }
  return "advanced" as const;
}

function inferContraindications(patternKey: string, modifier: string): string[] {
  const tags: string[] = [];
  if (patternKey === "vertical_push") tags.push("overhead_sensitive");
  if (patternKey === "squat") tags.push("deep_knee_flexion");
  if (patternKey === "hinge" || modifier === "Deficit") tags.push("lumbar_flexion_risk");
  if (patternKey === "isolation") tags.push("elbow_tendon_sensitive");
  if (patternKey === "horizontal_push") tags.push("shoulder_abduction_ir");
  return [...new Set(tags)];
}

export const seedCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    const existingVariant = await ctx.db.query("exerciseVariants").first();
    if (existingVariant) {
      const variants = await ctx.db.query("exerciseVariants").collect();
      const templates = await ctx.db.query("planTemplates").collect();
      return {
        created: false,
        variantCount: variants.length,
        planTemplateCount: templates.length,
      };
    }

    const now = Date.now();

    for (const pattern of MOVEMENT_PATTERNS) {
      await ctx.db.insert("movementPatterns", {
        key: pattern.key,
        name: pattern.name,
        description: pattern.description,
        createdAt: now,
      });
    }

    for (const equipment of EQUIPMENT_TYPES) {
      await ctx.db.insert("equipmentTypes", {
        key: equipment.key,
        name: equipment.name,
        category: equipment.category,
        createdAt: now,
      });
    }

    for (const tag of CONTRAINDICATION_TAGS) {
      await ctx.db.insert("contraindicationTags", {
        key: tag.key,
        label: tag.label,
        description: tag.description,
        createdAt: now,
      });
    }

    const equipmentKeys = EQUIPMENT_TYPES.map((e) => e.key);
    let createdVariants = 0;
    let createdFamilies = 0;

    for (const family of FAMILY_SEEDS) {
      const familyId = await ctx.db.insert("exerciseFamilies", {
        name: family.name,
        slug: family.slug,
        movementPatternKey: family.movementPatternKey,
        primaryMuscles: family.primaryMuscles,
        secondaryMuscles: family.secondaryMuscles,
        createdAt: now,
      });
      createdFamilies += 1;

      for (const baseName of family.baseNames) {
        for (const equipmentKey of equipmentKeys) {
          for (const modifier of MODIFIERS) {
            const variantName = `${titleCaseFromKey(equipmentKey)} ${baseName} (${modifier})`;
            const slug = toSlug(`${family.slug}-${equipmentKey}-${baseName}-${modifier}`);
            const difficultyTier = inferDifficulty(modifier);
            const category = inferCategory(family.movementPatternKey, equipmentKey);
            const contraindicationTags = inferContraindications(
              family.movementPatternKey,
              modifier
            );

            const variantId = await ctx.db.insert("exerciseVariants", {
              familyId,
              name: variantName,
              slug,
              equipmentKey,
              category,
              difficultyTier,
              contraindicationTags,
              cueNotes: [
                "Control each rep and keep a stable setup.",
                "Leave 1-3 reps in reserve for most sets.",
                "Stop if form breaks down or pain appears.",
              ],
              createdAt: now,
            });

            const mediaSeed = TECHNIQUE_SOURCES[createdVariants % TECHNIQUE_SOURCES.length];
            await ctx.db.insert("exerciseTechniqueMedia", {
              exerciseVariantId: variantId,
              youtubeUrl: mediaSeed.youtubeUrl,
              sourceName: mediaSeed.sourceName,
              difficulty: difficultyTier,
              cueNotes: mediaSeed.cueNotes,
              isPrimary: true,
              createdAt: now,
            });

            await ctx.db.insert("exerciseLibrary", {
              name: variantName,
              category,
              muscleGroups: family.primaryMuscles,
              secondaryMuscles: family.secondaryMuscles,
              equipment: titleCaseFromKey(equipmentKey),
              isBuiltIn: true,
              movementPattern: family.movementPatternKey,
              difficultyTier,
              contraindicationTags,
              variationKey: slug,
              techniqueUrl: mediaSeed.youtubeUrl,
              techniqueSource: mediaSeed.sourceName,
              createdAt: now,
            });

            createdVariants += 1;
          }
        }
      }
    }

    return {
      created: true,
      familyCount: createdFamilies,
      variantCount: createdVariants,
    };
  },
});

export const getCatalogStats = query({
  args: {},
  handler: async (ctx) => {
    const [families, variants, plans, media] = await Promise.all([
      ctx.db.query("exerciseFamilies").collect(),
      ctx.db.query("exerciseVariants").collect(),
      ctx.db.query("planTemplates").collect(),
      ctx.db.query("exerciseTechniqueMedia").collect(),
    ]);

    return {
      familyCount: families.length,
      variantCount: variants.length,
      planTemplateCount: plans.length,
      techniqueMediaCount: media.length,
    };
  },
});

export const getVariants = query({
  args: {
    searchQuery: v.optional(v.string()),
    movementPatternKey: v.optional(v.string()),
    equipmentKey: v.optional(v.string()),
    difficultyTier: v.optional(
      v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    let variants = await ctx.db.query("exerciseVariants").collect();

    if (args.searchQuery) {
      const queryLower = args.searchQuery.toLowerCase();
      variants = variants.filter((variant) =>
        variant.name.toLowerCase().includes(queryLower)
      );
    }

    if (args.movementPatternKey) {
      const familyIds = (
        await ctx.db
          .query("exerciseFamilies")
          .withIndex("by_pattern", (q) =>
            q.eq("movementPatternKey", args.movementPatternKey as string)
          )
          .collect()
      ).map((family) => family._id);
      variants = variants.filter((variant) => familyIds.includes(variant.familyId));
    }

    if (args.equipmentKey) {
      variants = variants.filter((variant) => variant.equipmentKey === args.equipmentKey);
    }

    if (args.difficultyTier) {
      variants = variants.filter((variant) => variant.difficultyTier === args.difficultyTier);
    }

    variants.sort((a, b) => a.name.localeCompare(b.name));

    return variants.slice(0, limit);
  },
});

export const getTechniqueMediaForVariant = query({
  args: { exerciseVariantId: v.id("exerciseVariants") },
  handler: async (ctx, args) => {
    const media = await ctx.db
      .query("exerciseTechniqueMedia")
      .withIndex("by_variant", (q) => q.eq("exerciseVariantId", args.exerciseVariantId))
      .collect();

    media.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
    return media;
  },
});
