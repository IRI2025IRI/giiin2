import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ユーザー属性情報を作成
export const create = mutation({
  args: {
    ageGroup: v.union(
      v.literal("10代"),
      v.literal("20代"),
      v.literal("30代"),
      v.literal("40代"),
      v.literal("50代"),
      v.literal("60代"),
      v.literal("70代以上")
    ),
    gender: v.union(
      v.literal("男性"),
      v.literal("女性"),
      v.literal("その他"),
      v.literal("回答しない")
    ),
    region: v.union(
      v.literal("三原市民"),
      v.literal("その他市民")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 既存の属性情報があるかチェック
    const existing = await ctx.db
      .query("userDemographics")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      // 既存の情報を更新
      await ctx.db.patch(existing._id, {
        ageGroup: args.ageGroup,
        gender: args.gender,
        region: args.region,
      });
      return existing._id;
    } else {
      // 新規作成
      return await ctx.db.insert("userDemographics", {
        userId,
        ageGroup: args.ageGroup,
        gender: args.gender,
        region: args.region,
        registeredAt: Date.now(),
      });
    }
  },
});

// ユーザーの属性情報を取得
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userDemographics")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// 現在のユーザーの属性情報を取得
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("userDemographics")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

// 統計情報を取得（管理者用）
export const getStatistics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 管理者権限チェック
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser) {
      throw new Error("管理者権限が必要です");
    }

    const demographics = await ctx.db.query("userDemographics").collect();

    // 年代別統計
    const ageGroupStats = demographics.reduce((acc, demo) => {
      const key = demo.ageGroup.replace(/代/g, 's').replace(/以上/g, 'plus');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 性別統計
    const genderStats = demographics.reduce((acc, demo) => {
      let key: string = demo.gender;
      if (key === "男性") key = "male";
      else if (key === "女性") key = "female";
      else if (key === "その他") key = "other";
      else if (key === "回答しない") key = "no_answer";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 地域統計
    const regionStats = demographics.reduce((acc, demo) => {
      let key: string = demo.region;
      if (key === "三原市民") key = "mihara_citizen";
      else if (key === "その他市民") key = "other_citizen";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: demographics.length,
      ageGroup: ageGroupStats,
      gender: genderStats,
      region: regionStats,
    };
  },
});

// 属性情報を更新
export const update = mutation({
  args: {
    ageGroup: v.union(
      v.literal("10代"),
      v.literal("20代"),
      v.literal("30代"),
      v.literal("40代"),
      v.literal("50代"),
      v.literal("60代"),
      v.literal("70代以上")
    ),
    gender: v.union(
      v.literal("男性"),
      v.literal("女性"),
      v.literal("その他"),
      v.literal("回答しない")
    ),
    region: v.union(
      v.literal("三原市民"),
      v.literal("その他市民")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    const existing = await ctx.db
      .query("userDemographics")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!existing) {
      throw new Error("属性情報が見つかりません");
    }

    await ctx.db.patch(existing._id, {
      ageGroup: args.ageGroup,
      gender: args.gender,
      region: args.region,
    });

    return existing._id;
  },
});
