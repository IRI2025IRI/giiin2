import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const allNews = await ctx.db
      .query("news")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .order("desc")
      .collect();

    // 予約投稿日時が未来のものは除外
    return allNews.filter(
      (item) => !item.scheduledPublishDate || item.scheduledPublishDate <= now
    );
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    const now = Date.now();
    const allNews = await ctx.db
      .query("news")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .order("desc")
      .collect();

    return allNews
      .filter(
        (item) => !item.scheduledPublishDate || item.scheduledPublishDate <= now
      )
      .slice(0, limit);
  },
});

export const getById = query({
  args: { id: v.id("news") },
  handler: async (ctx, args) => {
    const news = await ctx.db.get(args.id);
    if (!news || !news.isPublished) {
      return null;
    }
    // 予約投稿日時が未来の場合は非公開扱い
    if (news.scheduledPublishDate && news.scheduledPublishDate > Date.now()) {
      return null;
    }
    return news;
  },
});

export const listAll = query({
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

    return await ctx.db.query("news").order("desc").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.string(),
    publishDate: v.number(),
    isPublished: v.boolean(),
    scheduledPublishDate: v.optional(v.number()),
    thumbnailUrl: v.optional(v.string()),
    thumbnailId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
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

    return await ctx.db.insert("news", {
      ...args,
      authorId: userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("news"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
    publishDate: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
    scheduledPublishDate: v.optional(v.number()),
    thumbnailUrl: v.optional(v.string()),
    thumbnailId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
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

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("news") },
  handler: async (ctx, args) => {
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

    await ctx.db.delete(args.id);
  },
});

export const generateThumbnailUploadUrl = mutation({
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

    return await ctx.storage.generateUploadUrl();
  },
});

export const getThumbnailUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
