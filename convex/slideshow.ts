import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const slides = await ctx.db
      .query("slideshowSlides")
      .withIndex("by_order")
      .collect();

    return Promise.all(
      slides.map(async (slide) => {
        let imageUrl = slide.imageUrl || null;
        
        // ストレージIDがある場合は署名付きURLを取得
        if (slide.imageId) {
          imageUrl = await ctx.storage.getUrl(slide.imageId);
        }
        
        return {
          ...slide,
          imageUrl,
        };
      })
    );
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const slides = await ctx.db
      .query("slideshowSlides")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // 順序でソート
    const sortedSlides = slides.sort((a, b) => a.order - b.order);

    return Promise.all(
      sortedSlides.map(async (slide) => {
        let imageUrl = slide.imageUrl || null;
        
        // ストレージIDがある場合は署名付きURLを取得
        if (slide.imageId) {
          imageUrl = await ctx.storage.getUrl(slide.imageId);
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

    return await ctx.db.insert("slideshowSlides", {
      title: args.title,
      description: args.description,
      imageUrl: args.imageUrl,
      imageId: args.imageId,
      linkUrl: args.linkUrl,
      backgroundColor: args.backgroundColor,
      order: args.order,
      isActive: args.isActive,
      createdBy: userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("slideshowSlides"),
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

    const updateData: any = {
      title: args.title,
      description: args.description,
      imageUrl: args.imageUrl,
      linkUrl: args.linkUrl,
      backgroundColor: args.backgroundColor,
      order: args.order,
      isActive: args.isActive,
      updatedBy: userId,
    };

    if (args.imageId) {
      updateData.imageId = args.imageId;
    }

    return await ctx.db.patch(args.id, updateData);
  },
});

export const remove = mutation({
  args: {
    id: v.id("slideshowSlides"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    return await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    return await ctx.storage.generateUploadUrl();
  },
});
