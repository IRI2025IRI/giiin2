import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const slides = await ctx.db
      .query("slideshowSlides")
      .withIndex("by_order")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // 画像URLを取得して返す
    return await Promise.all(
      slides.map(async (slide) => {
        let imageUrl = slide.imageUrl;
        
        // imageIdがある場合は、storageから画像URLを取得
        if (slide.imageId) {
          const url = await ctx.storage.getUrl(slide.imageId);
          if (url) {
            imageUrl = url;
          }
        }
        
        return {
          ...slide,
          imageUrl,
        };
      })
    );
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

    const slides = await ctx.db
      .query("slideshowSlides")
      .withIndex("by_order")
      .collect();

    // 画像URLを取得して返す
    return await Promise.all(
      slides.map(async (slide) => {
        let imageUrl = slide.imageUrl;
        
        // imageIdがある場合は、storageから画像URLを取得
        if (slide.imageId) {
          const url = await ctx.storage.getUrl(slide.imageId);
          if (url) {
            imageUrl = url;
          }
        }
        
        return {
          ...slide,
          imageUrl,
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    backgroundColor: v.string(),
    order: v.number(),
    isActive: v.boolean(),
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

    // imageUrlからstorageIdを抽出してimageIdとして保存
    let imageId = undefined;
    if (args.imageUrl && args.imageUrl.includes('/api/storage/')) {
      const urlParts = args.imageUrl.split('/');
      const storageIdPart = urlParts[urlParts.length - 1];
      if (storageIdPart) {
        imageId = storageIdPart as any;
      }
    }

    return await ctx.db.insert("slideshowSlides", {
      ...args,
      imageId,
      createdBy: userId,
    });
  },
});

export const update = mutation({
  args: {
    slideId: v.id("slideshowSlides"),
    title: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    backgroundColor: v.string(),
    order: v.number(),
    isActive: v.boolean(),
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

    // imageUrlからstorageIdを抽出してimageIdとして保存
    let imageId = undefined;
    if (args.imageUrl && args.imageUrl.includes('/api/storage/')) {
      const urlParts = args.imageUrl.split('/');
      const storageIdPart = urlParts[urlParts.length - 1];
      if (storageIdPart) {
        imageId = storageIdPart as any;
      }
    }

    const { slideId, ...updateData } = args;
    return await ctx.db.patch(slideId, {
      ...updateData,
      imageId,
      updatedBy: userId,
    });
  },
});

export const remove = mutation({
  args: {
    slideId: v.id("slideshowSlides"),
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

    return await ctx.db.delete(args.slideId);
  },
});

export const generateUploadUrl = mutation({
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

export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
