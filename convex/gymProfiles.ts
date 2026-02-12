import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("gymProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    profiles.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

    const payload = await Promise.all(
      profiles.map(async (profile) => {
        const equipment = await ctx.db
          .query("gymEquipment")
          .withIndex("by_profile", (q) => q.eq("gymProfileId", profile._id))
          .collect();
        return { ...profile, equipment };
      })
    );

    return payload;
  },
});

export const upsertProfile = mutation({
  args: {
    userId: v.string(),
    profileId: v.optional(v.id("gymProfiles")),
    name: v.string(),
    isDefault: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    equipmentKeys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.isDefault) {
      const existingDefaults = await ctx.db
        .query("gymProfiles")
        .withIndex("by_user_default", (q) =>
          q.eq("userId", args.userId).eq("isDefault", true)
        )
        .collect();
      for (const profile of existingDefaults) {
        if (profile._id !== args.profileId) {
          await ctx.db.patch(profile._id, { isDefault: false, updatedAt: now });
        }
      }
    }

    let profileId = args.profileId;
    if (profileId) {
      await ctx.db.patch(profileId, {
        name: args.name,
        isDefault: args.isDefault ?? false,
        notes: args.notes,
        updatedAt: now,
      });
    } else {
      profileId = await ctx.db.insert("gymProfiles", {
        userId: args.userId,
        name: args.name,
        isDefault: args.isDefault ?? false,
        notes: args.notes,
        createdAt: now,
        updatedAt: now,
      });
    }

    const existingEquipment = await ctx.db
      .query("gymEquipment")
      .withIndex("by_profile", (q) => q.eq("gymProfileId", profileId))
      .collect();

    for (const item of existingEquipment) {
      await ctx.db.delete(item._id);
    }

    for (const equipmentKey of args.equipmentKeys) {
      await ctx.db.insert("gymEquipment", {
        gymProfileId: profileId,
        equipmentKey,
        createdAt: now,
      });
    }

    return { profileId };
  },
});

export const createStarterProfile = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("gymProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) {
      return { profileId: existing._id, created: false };
    }

    const now = Date.now();
    const profileId = await ctx.db.insert("gymProfiles", {
      userId: args.userId,
      name: args.name ?? "Main Gym",
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });

    const starterEquipment = [
      "barbell",
      "dumbbell",
      "cable",
      "machine",
      "bodyweight",
      "smith_machine",
    ];

    for (const equipmentKey of starterEquipment) {
      await ctx.db.insert("gymEquipment", {
        gymProfileId: profileId,
        equipmentKey,
        createdAt: now,
      });
    }

    return { profileId, created: true };
  },
});
