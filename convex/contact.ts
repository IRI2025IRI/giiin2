import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submitContactForm = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.optional(v.string()),
    message: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    // お問い合わせをデータベースに保存
    const contactId = await ctx.db.insert("contactMessages", {
      name: args.name,
      email: args.email,
      subject: args.subject || "",
      message: args.message,
      category: args.category,
      status: "new",
      submittedAt: Date.now(),
    });

    // 管理者にメール通知を送信（実装例）
    // 実際の運用では、メール送信機能を実装する
    
    return contactId;
  },
});

export const getContactMessages = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("contactMessages");
    
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    return await query.order("desc").collect();
  },
});

export const updateContactStatus = mutation({
  args: {
    id: v.id("contactMessages"),
    status: v.union(v.literal("new"), v.literal("in_progress"), v.literal("resolved")),
    response: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      response: args.response,
      updatedAt: Date.now(),
    });
  },
});
