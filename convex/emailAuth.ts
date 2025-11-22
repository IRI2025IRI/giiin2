import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

// メール認証トークンを検証
export const verifyEmailToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    try {
      // トークンを検索
      const tokenRecord = await ctx.db
        .query("emailVerificationTokens")
        .withIndex("by_token", (q) => q.eq("token", args.token))
        .filter((q) => q.eq(q.field("used"), false))
        .filter((q) => q.eq(q.field("type"), "verification"))
        .first();

      if (!tokenRecord) {
        return { success: false, error: "無効な認証トークンです。" };
      }

      // トークンの有効期限をチェック
      if (tokenRecord.expiresAt < Date.now()) {
        return { success: false, error: "認証トークンの有効期限が切れています。" };
      }

      // ユーザーのメール認証状態を更新
      if (tokenRecord.userId) {
        const existingStatus = await ctx.db
          .query("userEmailStatus")
          .withIndex("by_user", (q) => q.eq("userId", tokenRecord.userId!))
          .first();

        if (existingStatus) {
          await ctx.db.patch(existingStatus._id, {
            isVerified: true,
            verifiedAt: Date.now(),
          });
        } else {
          await ctx.db.insert("userEmailStatus", {
            userId: tokenRecord.userId,
            email: tokenRecord.email,
            isVerified: true,
            verifiedAt: Date.now(),
          });
        }
      }

      // トークンを使用済みにマーク
      await ctx.db.patch(tokenRecord._id, { used: true });

      return { success: true };
    } catch (error) {
      console.error("Email verification error:", error);
      return { success: false, error: "認証処理中にエラーが発生しました。" };
    }
  },
});

// パスワードリセット
export const resetPassword = mutation({
  args: { 
    token: v.string(),
    newPassword: v.string()
  },
  handler: async (ctx, args) => {
    try {
      // トークンを検索
      const tokenRecord = await ctx.db
        .query("emailVerificationTokens")
        .withIndex("by_token", (q) => q.eq("token", args.token))
        .filter((q) => q.eq(q.field("used"), false))
        .filter((q) => q.eq(q.field("type"), "password_reset"))
        .first();

      if (!tokenRecord) {
        return { success: false, error: "無効なリセットトークンです。" };
      }

      // トークンの有効期限をチェック
      if (tokenRecord.expiresAt < Date.now()) {
        return { success: false, error: "リセットトークンの有効期限が切れています。" };
      }

      if (!tokenRecord.userId) {
        return { success: false, error: "ユーザーが見つかりません。" };
      }

      // パスワードの長さをチェック
      if (args.newPassword.length < 8) {
        return { success: false, error: "パスワードは8文字以上で入力してください。" };
      }

      // トークンを使用済みにマーク
      await ctx.db.patch(tokenRecord._id, { used: true });

      return { success: true };
    } catch (error) {
      console.error("Password reset error:", error);
      return { success: false, error: "パスワードリセット処理中にエラーが発生しました。" };
    }
  },
});

// 内部関数: 認証トークンを作成
export const createVerificationToken = internalMutation({
  args: {
    email: v.string(),
    token: v.string(),
    type: v.union(v.literal("verification"), v.literal("password_reset")),
    expiresAt: v.number(),
    userId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("emailVerificationTokens", {
      email: args.email,
      token: args.token,
      type: args.type,
      expiresAt: args.expiresAt,
      used: false,
      userId: args.userId
    });
  },
});

// 内部関数: メールアドレスでユーザーを検索
export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
  },
});

// ユーザーのメール認証状態を取得
export const getEmailVerificationStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const status = await ctx.db
      .query("userEmailStatus")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return status;
  },
});
