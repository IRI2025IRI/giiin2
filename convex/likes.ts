import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const toggle = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 既存のいいねを確認
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_and_question", (q) => 
        q.eq("userId", userId).eq("questionId", args.questionId)
      )
      .unique();

    if (existingLike) {
      // いいねを削除
      await ctx.db.delete(existingLike._id);
      return { liked: false };
    } else {
      // いいねを追加
      await ctx.db.insert("likes", {
        userId: userId,
        questionId: args.questionId,
      });
      return { liked: true };
    }
  },
});

export const getUserLikes = query({
  args: { questionIds: v.array(v.id("questions")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const likes = await ctx.db
      .query("likes")
      .withIndex("by_user_and_question", (q) => q.eq("userId", userId))
      .collect();

    return likes
      .filter(like => like.questionId && args.questionIds.includes(like.questionId))
      .map(like => like.questionId!);
  },
});

export const getQuestionLikeCount = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_question", (q) => q.eq("questionId", args.questionId))
      .collect();

    // 新しいスキーマのlikesのみをカウント
    return likes.filter(like => like.questionId === args.questionId).length;
  },
});

export const getCount = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_question", (q) => q.eq("questionId", args.questionId))
      .collect();
    
    return likes.length;
  },
});

export const getUserLike = query({
  args: { userId: v.id("users"), questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const like = await ctx.db
      .query("likes")
      .withIndex("by_user_and_question", (q) => 
        q.eq("userId", args.userId).eq("questionId", args.questionId)
      )
      .unique();
    
    return like;
  },
});
