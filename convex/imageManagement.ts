import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// 画像一覧を取得
export const listImages = query({
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

    // ストレージ内の全ファイルを取得
    const files = await ctx.db.system.query("_storage").collect();
    
    // 画像ファイルのみをフィルタリング（contentTypeで判定）
    const imageFiles = files.filter(file => 
      file.contentType && file.contentType.startsWith('image/')
    );

    // ファイル情報とURLを含むオブジェクトを作成
    const imagesWithUrls = await Promise.all(
      imageFiles.map(async (file) => {
        const url = await ctx.storage.getUrl(file._id);
        return {
          _id: file._id,
          _creationTime: file._creationTime,
          contentType: file.contentType,
          size: file.size,
          sha256: file.sha256,
          url: url,
        };
      })
    );

    // 作成日時の降順でソート
    return imagesWithUrls.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// 画像アップロード用のURL生成
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

// 画像削除
export const deleteImage = mutation({
  args: { imageId: v.id("_storage") },
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

    // ファイルを削除
    await ctx.storage.delete(args.imageId);
  },
});
