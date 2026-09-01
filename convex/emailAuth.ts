import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalQuery, internalAction } from "./_generated/server";
import { getAuthUserId, modifyAccountCredentials } from "@convex-dev/auth/server";
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

// パスワードリセット（実際にパスワードを変更する）
export const resetPassword = action({
  args: {
    token: v.string(),
    newPassword: v.string()
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    try {
      // パスワードの長さをチェック
      if (args.newPassword.length < 8) {
        return { success: false, error: "パスワードは8文字以上で入力してください。" };
      }

      // トークンを検証
      const tokenRecord = await ctx.runQuery(internal.emailAuth.getValidPasswordResetToken, {
        token: args.token,
      });

      if (!tokenRecord) {
        return { success: false, error: "無効なリセットトークンです。" };
      }

      if (tokenRecord.expiresAt < Date.now()) {
        return { success: false, error: "リセットトークンの有効期限が切れています。" };
      }

      if (!tokenRecord.userId) {
        return { success: false, error: "ユーザーが見つかりません。" };
      }

      const user = await ctx.runQuery(internal.emailAuth.getUserRecordById, {
        userId: tokenRecord.userId,
      });

      if (!user || !user.email) {
        return { success: false, error: "ユーザーが見つかりません。" };
      }

      // 実際にパスワード（認証情報）を更新
      await modifyAccountCredentials(ctx, {
        provider: "password",
        account: { id: user.email, secret: args.newPassword },
      });

      // トークンを使用済みにマーク
      await ctx.runMutation(internal.emailAuth.markTokenUsed, { tokenId: tokenRecord._id });

      return { success: true };
    } catch (error) {
      console.error("Password reset error:", error);
      return { success: false, error: "パスワードリセット処理中にエラーが発生しました。" };
    }
  },
});

// 開発用: CLI経由でのみ実行可能なパスワード直接リセット（クライアントからは呼び出せない）
export const adminSetPassword = internalAction({
  args: { email: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    if (args.newPassword.length < 8) {
      throw new Error("パスワードは8文字以上で入力してください。");
    }

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: args.email, secret: args.newPassword },
    });
  },
});

// 内部関数: 直近一定時間内に同じメールアドレス宛てに送信されたトークン数を取得（レート制限用）
export const countRecentTokens = internalQuery({
  args: {
    email: v.string(),
    type: v.union(v.literal("verification"), v.literal("password_reset")),
    sinceTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const tokens = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_email_and_type", (q) =>
        q.eq("email", args.email).eq("type", args.type)
      )
      .collect();

    return tokens.filter((t) => t._creationTime >= args.sinceTimestamp).length;
  },
});

// 内部関数: 有効なパスワードリセットトークンを検索（未使用のもののみ）
export const getValidPasswordResetToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .filter((q) => q.eq(q.field("used"), false))
      .filter((q) => q.eq(q.field("type"), "password_reset"))
      .first();
  },
});

// 内部関数: トークンを使用済みにマーク
export const markTokenUsed = internalMutation({
  args: { tokenId: v.id("emailVerificationTokens") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tokenId, { used: true });
  },
});

// 内部関数: ユーザーIDでユーザーを取得
export const getUserRecordById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
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

// ユーザー作成時にメール認証状態を初期化
export const initializeEmailStatus = internalMutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // 既存の状態があるかチェック
    const existing = await ctx.db
      .query("userEmailStatus")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!existing) {
      await ctx.db.insert("userEmailStatus", {
        userId: args.userId,
        email: args.email,
        isVerified: false,
        verificationRequestedAt: Date.now(),
      });
    }
  },
});
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

// 削除されたユーザーのデータクリーンアップ
export const cleanupDeletedUserData = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!existingUser) {
      // 古い認証トークンを削除
      const oldTokens = await ctx.db
        .query("emailVerificationTokens")
        .filter((q) => q.eq(q.field("email"), args.email))
        .collect();

      for (const token of oldTokens) {
        await ctx.db.delete(token._id);
      }

      // 古いメール認証状態を削除
      const oldEmailStatus = await ctx.db
        .query("userEmailStatus")
        .filter((q) => q.eq(q.field("email"), args.email))
        .collect();

      for (const status of oldEmailStatus) {
        await ctx.db.delete(status._id);
      }

      // 古いauthAccountsを削除（重要：これが重複エラーの主な原因）
      try {
        const authAccounts = await ctx.db.query("authAccounts").collect();
        const orphanedAuthAccounts = authAccounts.filter(account => 
          account.provider === "password" && 
          (account.providerAccountId === args.email ||
           (account.providerAccountId && account.providerAccountId.includes(args.email)))
        );

        for (const account of orphanedAuthAccounts) {
          await ctx.db.delete(account._id);
        }
      } catch (error) {
        console.error("Failed to cleanup auth accounts:", error);
      }
    }
  },
});
