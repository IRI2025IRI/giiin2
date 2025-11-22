import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// 公開されているFAQアイテムを取得
export const getPublishedFAQs = query({
  args: {},
  handler: async (ctx) => {
    const faqs = await ctx.db
      .query("faqItems")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();
    
    // カテゴリ別にグループ化（Mapを使用してASCII制限を回避）
    const categoryMap = new Map<string, typeof faqs>();
    
    faqs.forEach(faq => {
      if (!categoryMap.has(faq.category)) {
        categoryMap.set(faq.category, []);
      }
      categoryMap.get(faq.category)!.push(faq);
    });

    // 各カテゴリ内で順序でソート
    categoryMap.forEach(items => {
      items.sort((a, b) => a.order - b.order);
    });

    // 配列形式に変換（日本語キー問題を回避）
    const result = Array.from(categoryMap.entries()).map(([category, items]) => ({
      category,
      items,
    }));

    return result;
  },
});

// 管理者用：全てのFAQアイテムを取得
export const getAllFAQs = query({
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

    const faqs = await ctx.db
      .query("faqItems")
      .withIndex("by_created_at")
      .order("desc")
      .collect();

    return faqs;
  },
});

// FAQアイテムを作成
export const createFAQ = mutation({
  args: {
    question: v.string(),
    answer: v.string(),
    category: v.string(),
    order: v.number(),
    isPublished: v.boolean(),
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

    const now = Date.now();

    return await ctx.db.insert("faqItems", {
      question: args.question,
      answer: args.answer,
      category: args.category,
      order: args.order,
      isPublished: args.isPublished,
      createdBy: userId,
      createdAt: now,
    });
  },
});

// FAQアイテムを更新
export const updateFAQ = mutation({
  args: {
    id: v.id("faqItems"),
    question: v.string(),
    answer: v.string(),
    category: v.string(),
    order: v.number(),
    isPublished: v.boolean(),
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

    const existingFaq = await ctx.db.get(args.id);
    if (!existingFaq) {
      throw new Error("FAQアイテムが見つかりません");
    }

    const now = Date.now();

    return await ctx.db.patch(args.id, {
      question: args.question,
      answer: args.answer,
      category: args.category,
      order: args.order,
      isPublished: args.isPublished,
      updatedBy: userId,
      updatedAt: now,
    });
  },
});

// FAQアイテムを削除
export const deleteFAQ = mutation({
  args: {
    id: v.id("faqItems"),
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

    const existingFaq = await ctx.db.get(args.id);
    if (!existingFaq) {
      throw new Error("FAQアイテムが見つかりません");
    }

    return await ctx.db.delete(args.id);
  },
});

// カテゴリ一覧を取得
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const faqs = await ctx.db.query("faqItems").collect();
    const categories = [...new Set(faqs.map(faq => faq.category))];
    return categories.sort();
  },
});
