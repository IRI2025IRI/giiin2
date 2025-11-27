import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// ユーザー属性を保存
export const saveDemographics = mutation({
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
export const getUserDemographics = query({
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

// 統計データを取得（管理者用）
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

    // 全ユーザー属性データを取得
    const allDemographics = await ctx.db.query("userDemographics").collect();
    
    // 年代別統計
    const ageGroupStats = allDemographics.reduce((acc, demo) => {
      acc[demo.ageGroup] = (acc[demo.ageGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 性別統計
    const genderStats = allDemographics.reduce((acc, demo) => {
      acc[demo.gender] = (acc[demo.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 地域統計
    const regionStats = allDemographics.reduce((acc, demo) => {
      acc[demo.region] = (acc[demo.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 月別登録者数統計（過去12ヶ月）
    const now = Date.now();
    const twelveMonthsAgo = now - (12 * 30 * 24 * 60 * 60 * 1000);
    
    const monthlyRegistrations = allDemographics
      .filter(demo => demo.registeredAt >= twelveMonthsAgo)
      .reduce((acc, demo) => {
        const date = new Date(demo.registeredAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    // 総ユーザー数
    const totalUsers = await ctx.db.query("users").collect();
    const totalUsersCount = totalUsers.length;
    const demographicsCount = allDemographics.length;

    return {
      totalUsers: totalUsersCount,
      demographicsCompleted: demographicsCount,
      demographicsCompletionRate: totalUsersCount > 0 ? (demographicsCount / totalUsersCount) * 100 : 0,
      ageGroupStats,
      genderStats,
      regionStats,
      monthlyRegistrations,
      lastUpdated: now,
    };
  },
});

// 詳細統計データを取得（管理者用）
export const getDetailedStatistics = query({
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

    // 全ユーザー属性データを取得
    const allDemographics = await ctx.db.query("userDemographics").collect();
    
    // クロス集計：年代×性別
    const ageGenderCross = allDemographics.reduce((acc, demo) => {
      const key = `${demo.ageGroup}_${demo.gender}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // クロス集計：年代×地域
    const ageRegionCross = allDemographics.reduce((acc, demo) => {
      const key = `${demo.ageGroup}_${demo.region}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // クロス集計：性別×地域
    const genderRegionCross = allDemographics.reduce((acc, demo) => {
      const key = `${demo.gender}_${demo.region}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      ageGenderCross,
      ageRegionCross,
      genderRegionCross,
    };
  },
});
