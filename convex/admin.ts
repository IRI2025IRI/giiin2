import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// 管理者権限チェック
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return !!adminUser;
  },
});

// スーパー管理者権限チェック
export const isSuperAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return adminUser?.role === "superAdmin";
  },
});

// ユーザーの役割を取得
export const getUserRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return "guest";
    }

    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser) {
      return "user";
    }

    return adminUser.role;
  },
});

// 最初のユーザーをスーパー管理者にする
export const makeFirstUserSuperAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 既に管理者ユーザーが存在するかチェック
    const existingAdmins = await ctx.db.query("adminUsers").collect();
    if (existingAdmins.length > 0) {
      return null; // 既に管理者が存在する場合は何もしない
    }

    // 最初のユーザーをスーパー管理者にする
    await ctx.db.insert("adminUsers", {
      userId,
      role: "superAdmin",
      grantedBy: userId,
      grantedAt: Date.now(),
    });

    return userId;
  },
});

// 全ユーザーを取得（スーパー管理者のみ）
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // スーパー管理者権限チェック
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser || adminUser.role !== "superAdmin") {
      throw new Error("スーパー管理者権限が必要です");
    }

    // 全ユーザーを取得
    const users = await ctx.db.query("users").collect();
    
    // 各ユーザーの管理者情報と属性情報を取得
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const adminInfo = await ctx.db
          .query("adminUsers")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        const demographics = await ctx.db
          .query("userDemographics")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        const emailStatus = await ctx.db
          .query("userEmailStatus")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        return {
          ...user,
          role: adminInfo?.role || "user",
          isAdmin: !!adminInfo,
          demographics,
          emailStatus,
          grantedAt: adminInfo?.grantedAt,
        };
      })
    );

    return usersWithDetails.sort((a, b) => b._creationTime - a._creationTime);
  },
});

// 管理者権限を付与
export const grantAdminRole = mutation({
  args: {
    targetUserId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("superAdmin")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // スーパー管理者権限チェック
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser || adminUser.role !== "superAdmin") {
      throw new Error("スーパー管理者権限が必要です");
    }

    // 対象ユーザーが存在するかチェック
    const targetUser = await ctx.db.get(args.targetUserId);
    if (!targetUser) {
      throw new Error("ユーザーが見つかりません");
    }

    // 既存の管理者権限をチェック
    const existingAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .first();

    if (existingAdmin) {
      // 既存の権限を更新
      await ctx.db.patch(existingAdmin._id, {
        role: args.role,
        grantedBy: userId,
        grantedAt: Date.now(),
      });
    } else {
      // 新しい管理者権限を作成
      await ctx.db.insert("adminUsers", {
        userId: args.targetUserId,
        role: args.role,
        grantedBy: userId,
        grantedAt: Date.now(),
      });
    }

    return args.targetUserId;
  },
});

// 管理者権限を削除
export const revokeAdminRole = mutation({
  args: {
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // スーパー管理者権限チェック
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser || adminUser.role !== "superAdmin") {
      throw new Error("スーパー管理者権限が必要です");
    }

    // 自分自身の権限は削除できない
    if (args.targetUserId === userId) {
      throw new Error("自分自身の管理者権限は削除できません");
    }

    // 管理者権限を削除
    const existingAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .first();

    if (existingAdmin) {
      await ctx.db.delete(existingAdmin._id);
    }

    return args.targetUserId;
  },
});

// ユーザー情報を更新
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("認証が必要です");
    }

    // スーパー管理者権限チェック
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .first();

    if (!adminUser || adminUser.role !== "superAdmin") {
      throw new Error("スーパー管理者権限が必要です");
    }

    // 対象ユーザーが存在するかチェック
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("ユーザーが見つかりません");
    }

    // メールアドレスの重複チェック
    if (args.email && args.email !== targetUser.email) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", args.email))
        .first();

      if (existingUser && existingUser._id !== args.userId) {
        throw new Error("このメールアドレスは既に使用されています");
      }
    }

    // ユーザー情報を更新
    const updateData: any = {};
    if (args.name !== undefined) updateData.name = args.name;
    if (args.email !== undefined) updateData.email = args.email;

    await ctx.db.patch(args.userId, updateData);

    // メールアドレスが変更された場合、メール認証状態をリセット
    if (args.email && args.email !== targetUser.email) {
      const emailStatus = await ctx.db
        .query("userEmailStatus")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .first();

      if (emailStatus) {
        await ctx.db.patch(emailStatus._id, {
          email: args.email,
          isVerified: false,
          verifiedAt: undefined,
          verificationRequestedAt: undefined,
        });
      } else {
        await ctx.db.insert("userEmailStatus", {
          userId: args.userId,
          email: args.email,
          isVerified: false,
        });
      }
    }

    return args.userId;
  },
});

// ユーザーを削除
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("認証が必要です");
    }

    // スーパー管理者権限チェック
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .first();

    if (!adminUser || adminUser.role !== "superAdmin") {
      throw new Error("スーパー管理者権限が必要です");
    }

    // 自分自身は削除できない
    if (args.userId === currentUserId) {
      throw new Error("自分自身のアカウントは削除できません");
    }

    // 対象ユーザーが存在するかチェック
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("ユーザーが見つかりません");
    }

    // 関連データを削除
    // 1. Convex Auth関連テーブルの完全クリーンアップ
    const userEmail = targetUser.email;
    
    // authAccountsテーブルから該当ユーザーのアカウントを削除（ユーザーIDとメールアドレス両方で検索）
    try {
      const authAccounts = await ctx.db.query("authAccounts").collect();
      for (const account of authAccounts) {
        // ユーザーIDまたはメールアドレスが一致する場合に削除
        if (account.userId === args.userId || 
            (userEmail && account.providerAccountId === userEmail) ||
            (userEmail && account.providerAccountId && account.providerAccountId.includes(userEmail))) {
          await ctx.db.delete(account._id);
          console.log(`Deleted auth account: ${account._id} for ${account.providerAccountId}`);
        }
      }
    } catch (error) {
      console.log("authAccounts cleanup failed:", error);
    }
    
    // authSessionsとauthRefreshTokensのクリーンアップ
    try {
      const authSessions = await ctx.db.query("authSessions").collect();
      const userSessionIds: string[] = [];
      
      for (const session of authSessions) {
        if (session.userId === args.userId) {
          userSessionIds.push(session._id);
          await ctx.db.delete(session._id);
        }
      }
      
      // セッションIDを使ってリフレッシュトークンを削除
      const authRefreshTokens = await ctx.db.query("authRefreshTokens").collect();
      for (const token of authRefreshTokens) {
        if (userSessionIds.includes(token.sessionId)) {
          await ctx.db.delete(token._id);
        }
      }
    } catch (error) {
      console.log("auth sessions/tokens cleanup failed:", error);
    }
    
    // authVerificationCodesテーブルのクリーンアップ（メールアドレスベース）
    try {
      if (userEmail) {
        const authVerificationCodes = await ctx.db.query("authVerificationCodes").collect();
        for (const code of authVerificationCodes) {
          if (code.accountId && code.accountId.includes(userEmail)) {
            await ctx.db.delete(code._id);
          }
        }
      }
    } catch (error) {
      console.log("authVerificationCodes cleanup failed:", error);
    }

    // authRateLimitsテーブルのクリーンアップ
    try {
      if (userEmail) {
        const authRateLimits = await ctx.db.query("authRateLimits").collect();
        for (const limit of authRateLimits) {
          if (limit.identifier && limit.identifier.includes(userEmail)) {
            await ctx.db.delete(limit._id);
          }
        }
      }
    } catch (error) {
      console.log("authRateLimits cleanup failed:", error);
    }
    
    // 2. 管理者権限
    const adminRecord = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (adminRecord) {
      await ctx.db.delete(adminRecord._id);
    }

    // 3. メール認証関連
    const emailStatus = await ctx.db
      .query("userEmailStatus")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (emailStatus) {
      await ctx.db.delete(emailStatus._id);
    }

    // メール認証トークン（該当ユーザーのメールアドレスに関連するもの）
    if (userEmail) {
      const emailTokens = await ctx.db
        .query("emailVerificationTokens")
        .withIndex("by_email", (q) => q.eq("email", userEmail))
        .collect();
      for (const token of emailTokens) {
        await ctx.db.delete(token._id);
      }
    }

    // 4. ユーザー属性情報
    const demographics = await ctx.db
      .query("userDemographics")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (demographics) {
      await ctx.db.delete(demographics._id);
    }

    // 5. いいね
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // 6. ニュース記事（作成者の場合）
    const news = await ctx.db.query("news").collect();
    for (const article of news) {
      if (article.authorId === args.userId) {
        await ctx.db.delete(article._id);
      }
    }

    // 7. スライドショー（作成者の場合）
    const slides = await ctx.db.query("slideshowSlides").collect();
    for (const slide of slides) {
      if (slide.createdBy === args.userId) {
        await ctx.db.delete(slide._id);
      }
    }

    // 8. FAQ（作成者の場合）
    const faqs = await ctx.db.query("faqItems").collect();
    for (const faq of faqs) {
      if (faq.createdBy === args.userId) {
        await ctx.db.delete(faq._id);
      }
    }

    // 最後にユーザー自体を削除
    await ctx.db.delete(args.userId);

    // Convex Authのキャッシュクリアのため、少し待つ
    console.log(`User ${args.userId} (${userEmail}) has been deleted completely`);
    
    // 追加のクリーンアップ：すべてのConvex Authテーブルを再チェック
    try {
      const allAuthAccounts = await ctx.db.query("authAccounts").collect();
      for (const account of allAuthAccounts) {
        if (userEmail && (
          account.providerAccountId === userEmail ||
          (account.provider === "password" && account.providerAccountId === userEmail)
        )) {
          await ctx.db.delete(account._id);
          console.log(`Deleted remaining auth account: ${account._id}`);
        }
      }
    } catch (error) {
      console.log("Final cleanup failed:", error);
    }

    return args.userId;
  },
});

// メールアドレスの認証データクリーンアップ
export const cleanupAuthByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("認証が必要です");

    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser || adminUser.role !== "superAdmin") {
      throw new Error("スーパー管理者権限が必要です");
    }

    let count = 0;
    const authAccounts = await ctx.db.query("authAccounts").collect();
    for (const account of authAccounts) {
      if (account.providerAccountId === args.email) {
        await ctx.db.delete(account._id);
        count++;
      }
    }

    return { cleanedCount: count, email: args.email };
  },
});

// ユーザー統計を取得
export const getUserStats = query({
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

    const totalUsers = await ctx.db.query("users").collect();
    const adminUsers = await ctx.db.query("adminUsers").collect();
    const demographics = await ctx.db.query("userDemographics").collect();
    const emailStatuses = await ctx.db.query("userEmailStatus").collect();

    const verifiedEmails = emailStatuses.filter(status => status.isVerified).length;

    return {
      totalUsers: totalUsers.length,
      adminUsers: adminUsers.length,
      regularUsers: totalUsers.length - adminUsers.length,
      demographicsCompleted: demographics.length,
      emailsVerified: verifiedEmails,
      emailsUnverified: emailStatuses.length - verifiedEmails,
    };
  },
});
