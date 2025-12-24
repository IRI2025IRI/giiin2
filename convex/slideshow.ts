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
    imageId: v.optional(v.id("_storage")),
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

    // 新しくアップロードされた画像IDがある場合はそれを使用
    let finalImageId = args.imageId;
    
    // imageUrlからstorageIdを抽出してimageIdとして保存（後方互換性のため）
    if (!finalImageId && args.imageUrl && args.imageUrl.includes('/api/storage/')) {
      try {
        const urlParts = args.imageUrl.split('/');
        const storageIdPart = urlParts[urlParts.length - 1];
        if (storageIdPart && storageIdPart.length > 0) {
          // storageIdが有効なID形式かチェック
          try {
            const storageDoc = await ctx.db.system.get(storageIdPart as any);
            if (storageDoc) {
              finalImageId = storageIdPart as any;
            }
          } catch (storageError) {
            console.error("Storage ID検証エラー:", storageError);
          }
        }
      } catch (error) {
        console.error("画像URL解析エラー:", error);
      }
    }

    return await ctx.db.insert("slideshowSlides", {
      ...args,
      imageId: finalImageId,
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
    imageId: v.optional(v.id("_storage")),
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

    // 新しくアップロードされた画像IDがある場合はそれを使用
    let finalImageId = args.imageId;
    
    // imageUrlからstorageIdを抽出してimageIdとして保存（後方互換性のため）
    if (!finalImageId && args.imageUrl && args.imageUrl.includes('/api/storage/')) {
      try {
        const urlParts = args.imageUrl.split('/');
        const storageIdPart = urlParts[urlParts.length - 1];
        if (storageIdPart && storageIdPart.length > 0) {
          // storageIdが有効なID形式かチェック
          try {
            const storageDoc = await ctx.db.system.get(storageIdPart as any);
            if (storageDoc) {
              finalImageId = storageIdPart as any;
            }
          } catch (storageError) {
            console.error("Storage ID検証エラー:", storageError);
          }
        }
      } catch (error) {
        console.error("画像URL解析エラー:", error);
      }
    }

    const { slideId, ...updateData } = args;
    return await ctx.db.patch(slideId, {
      ...updateData,
      imageId: finalImageId,
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
