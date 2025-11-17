import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// お知らせ一覧を取得（公開済みのみ）
export const list = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("news")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .order("desc");

    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }

    const news = await query.take(args.limit || 20);

    // 作成者情報とサムネイル画像URLを追加
    return Promise.all(
      news.map(async (item) => {
        const author = await ctx.db.get(item.authorId);
        let thumbnailUrl = item.thumbnailUrl || null;
        
        // ストレージIDがある場合は署名付きURLを取得
        if (item.thumbnailId) {
          thumbnailUrl = await ctx.storage.getUrl(item.thumbnailId);
        }
        
        return {
          ...item,
          author: author ? { name: author.name || "匿名", email: author.email } : null,
          thumbnailUrl,
        };
      })
    );
  },
});

// 管理者用：全てのお知らせを取得
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

    const news = await ctx.db.query("news").order("desc").collect();

    // 作成者情報とサムネイル画像URLを追加
    return Promise.all(
      news.map(async (item) => {
        const author = await ctx.db.get(item.authorId);
        let thumbnailUrl = item.thumbnailUrl || null;
        
        // ストレージIDがある場合は署名付きURLを取得
        if (item.thumbnailId) {
          thumbnailUrl = await ctx.storage.getUrl(item.thumbnailId);
        }
        
        return {
          ...item,
          author: author ? { name: author.name || "匿名", email: author.email } : null,
          thumbnailUrl,
        };
      })
    );
  },
});

// お知らせ詳細を取得
export const getById = query({
  args: { id: v.id("news") },
  handler: async (ctx, args) => {
    const news = await ctx.db.get(args.id);
    if (!news) {
      return null;
    }

    // 公開されていない場合は管理者のみ閲覧可能
    if (!news.isPublished) {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        return null;
      }

      const adminUser = await ctx.db
        .query("adminUsers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

      if (!adminUser) {
        return null;
      }
    }

    const author = await ctx.db.get(news.authorId);
    let thumbnailUrl = news.thumbnailUrl || null;
    
    // ストレージIDがある場合は署名付きURLを取得
    if (news.thumbnailId) {
      thumbnailUrl = await ctx.storage.getUrl(news.thumbnailId);
    }
    
    return {
      ...news,
      author: author ? { name: author.name || "匿名", email: author.email } : null,
      thumbnailUrl,
    };
  },
});

// お知らせを作成
export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.string(),
    isPublished: v.boolean(),
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
      title: args.title,
      content: args.content,
      category: args.category,
      isPublished: args.isPublished,
      publishDate: Date.now(),
      authorId: userId,
      thumbnailUrl: args.thumbnailUrl,
      thumbnailId: args.thumbnailId,
    });
  },
});

// お知らせを更新
export const update = mutation({
  args: {
    id: v.id("news"),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    isPublished: v.boolean(),
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

    const news = await ctx.db.get(args.id);
    if (!news) {
      throw new Error("お知らせが見つかりません");
    }

    await ctx.db.patch(args.id, {
      title: args.title,
      content: args.content,
      category: args.category,
      isPublished: args.isPublished,
      thumbnailUrl: args.thumbnailUrl,
      thumbnailId: args.thumbnailId,
    });
  },
});

// お知らせを削除
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

    const news = await ctx.db.get(args.id);
    if (!news) {
      throw new Error("お知らせが見つかりません");
    }

    // 関連するストレージファイルがあれば削除
    if (news.thumbnailId) {
      await ctx.storage.delete(news.thumbnailId);
    }

    await ctx.db.delete(args.id);
  },
});

// カテゴリ一覧を取得
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const news = await ctx.db
      .query("news")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    const categories = [...new Set(news.map((item) => item.category))];
    return categories.sort();
  },
});

// 最新のお知らせを取得（ダッシュボード用）
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const news = await ctx.db
      .query("news")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .order("desc")
      .take(args.limit || 5);

    return Promise.all(
      news.map(async (item) => {
        const author = await ctx.db.get(item.authorId);
        let thumbnailUrl = item.thumbnailUrl || null;
        
        // ストレージIDがある場合は署名付きURLを取得
        if (item.thumbnailId) {
          thumbnailUrl = await ctx.storage.getUrl(item.thumbnailId);
        }
        
        return {
          ...item,
          author: author ? { name: author.name || "匿名", email: author.email } : null,
          thumbnailUrl,
        };
      })
    );
  },
});

// サムネイル画像のアップロードURL生成
export const generateThumbnailUploadUrl = mutation({
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

    return await ctx.storage.generateUploadUrl();
  },
});
