import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Check if user has admin privileges (admin or superAdmin)
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }
    
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .unique();
    
    return adminUser?.role === "admin" || adminUser?.role === "superAdmin";
  },
});

// Check if user is super admin
export const isSuperAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }
    
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .unique();
    
    return adminUser?.role === "superAdmin";
  },
});

// Get user role
export const getUserRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return "user";
    }
    
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .unique();
    
    return adminUser?.role || "user";
  },
});

// Get current user with admin status
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    
    const user = await ctx.db.get(userId);
    return user;
  },
});

// List all users (admin only)
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }
    
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .unique();
    
    if (adminUser?.role !== "superAdmin") {
      throw new Error("運営者権限が必要です");
    }
    
    const users = await ctx.db.query("users").collect();
    const adminUsers = await ctx.db.query("adminUsers").collect();
    
    return users.map(user => {
      const admin = adminUsers.find(a => a.userId === user._id);
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: admin?.role || "user",
        _creationTime: user._creationTime,
      };
    });
  },
});

// Change user role (superAdmin only)
export const changeUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("admin"), v.literal("superAdmin")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("認証が必要です");
    }
    
    const currentAdminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q: any) => q.eq("userId", currentUserId))
      .unique();
    
    if (currentAdminUser?.role !== "superAdmin") {
      throw new Error("運営者権限が必要です");
    }
    
    // Prevent removing superAdmin from self
    if (args.userId === currentUserId && args.role !== "superAdmin") {
      throw new Error("自分の運営者権限は削除できません");
    }
    
    // Find existing admin record
    const existingAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .unique();
    
    if (args.role === "user") {
      // Remove admin privileges
      if (existingAdmin) {
        await ctx.db.delete(existingAdmin._id);
      }
    } else {
      // Add or update admin privileges
      if (existingAdmin) {
        await ctx.db.patch(existingAdmin._id, { role: args.role });
      } else {
        await ctx.db.insert("adminUsers", {
          userId: args.userId,
          role: args.role,
          grantedBy: currentUserId,
          grantedAt: Date.now(),
        });
      }
    }
    
    return args.userId;
  },
});

// Make first user superAdmin (for initial setup)
export const makeFirstUserSuperAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }
    
    // Check if there are any superAdmins
    const existingSuperAdmins = await ctx.db
      .query("adminUsers")
      .filter((q) => q.eq(q.field("role"), "superAdmin"))
      .collect();
    
    if (existingSuperAdmins.length === 0) {
      // Make current user superAdmin if no superAdmins exist
      await ctx.db.insert("adminUsers", {
        userId,
        role: "superAdmin",
        grantedBy: userId,
        grantedAt: Date.now(),
      });
      return true;
    }
    
    return false;
  },
});

// Update user profile (superAdmin only)
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
    
    const currentAdminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q: any) => q.eq("userId", currentUserId))
      .unique();
    
    if (currentAdminUser?.role !== "superAdmin") {
      throw new Error("運営者権限が必要です");
    }
    
    const updateData: any = {};
    if (args.name !== undefined) {
      updateData.name = args.name;
    }
    if (args.email !== undefined) {
      updateData.email = args.email;
    }
    
    await ctx.db.patch(args.userId, updateData);
    
    return args.userId;
  },
});

// Delete user account (superAdmin only)
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("認証が必要です");
    }
    
    const currentAdminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q: any) => q.eq("userId", currentUserId))
      .unique();
    
    if (currentAdminUser?.role !== "superAdmin") {
      throw new Error("運営者権限が必要です");
    }
    
    // Prevent deleting self
    if (args.userId === currentUserId) {
      throw new Error("自分のアカウントは削除できません");
    }
    
    // Delete admin record if exists
    const existingAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
      .unique();
    
    if (existingAdmin) {
      await ctx.db.delete(existingAdmin._id);
    }
    
    // Delete all user's likes
    const userLikes = await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const like of userLikes) {
      await ctx.db.delete(like._id);
    }
    
    // Delete all user's news
    const userNews = await ctx.db
      .query("news")
      .filter((q) => q.eq(q.field("authorId"), args.userId))
      .collect();
    
    for (const news of userNews) {
      await ctx.db.delete(news._id);
    }
    
    // Delete user account
    await ctx.db.delete(args.userId);
    
    return args.userId;
  },
});

// Helper function to check admin status (admin or superAdmin) in other functions
export async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("認証が必要です");
  }
  
  const adminUser = await ctx.db
    .query("adminUsers")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();
  
  if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "superAdmin")) {
    throw new Error("編集者権限以上が必要です");
  }
  
  return adminUser;
}

// Helper function to check superAdmin status in other functions
export async function requireSuperAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("認証が必要です");
  }
  
  const adminUser = await ctx.db
    .query("adminUsers")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();
  
  if (!adminUser || adminUser.role !== "superAdmin") {
    throw new Error("運営者権限が必要です");
  }
  
  return adminUser;
}
