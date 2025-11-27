import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { query } from "./_generated/server";
import { v } from "convex/values";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        };
      },
    }),
    Anonymous
  ],
});

export const loggedInUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return user;
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
    return user;
  },
});

// サインアップ可能性チェック
export const checkSignUpAvailability = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
    
    if (existingUser) {
      return { available: false, reason: "user_exists" };
    }

    try {
      const authAccounts = await ctx.db.query("authAccounts").collect();
      const existingAuthAccount = authAccounts.find(account => 
        account.provider === "password" && 
        (account.providerAccountId === args.email ||
         (account.providerAccountId && account.providerAccountId.includes(args.email)))
      );
      
      if (existingAuthAccount) {
        return { available: false, reason: "auth_account_exists" };
      }
    } catch (error) {
      console.log("Auth account check failed:", error);
    }

    return { available: true };
  },
});
