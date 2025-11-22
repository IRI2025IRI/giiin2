import { mutation, query, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { internal } from "./_generated/api";

export const submitContactForm = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.optional(v.string()),
    message: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const contactId = await ctx.db.insert("contactMessages", {
      name: args.name,
      email: args.email,
      subject: args.subject || "",
      message: args.message,
      category: args.category,
      status: "new",
      submittedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.contact.sendContactEmail, {
      contactId,
      name: args.name,
      email: args.email,
      subject: args.subject || "",
      message: args.message,
      category: args.category,
    });
    
    return contactId;
  },
});

export const getContactMessages = query({
  args: { status: v.optional(v.string()) },
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

export const sendContactEmail = internalAction({
  args: {
    contactId: v.id("contactMessages"),
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const resend = new Resend(process.env.CONVEX_RESEND_API_KEY);

    const getCategoryLabel = (category: string) => {
      const labels: Record<string, string> = {
        general: "一般的なお問い合わせ",
        bug: "バグ報告",
        feature: "機能要望",
        data: "データに関するお問い合わせ",
        partnership: "連携・協力のご相談",
        other: "その他"
      };
      return labels[category] || category;
    };

    const categoryLabel = getCategoryLabel(args.category);
    const emailSubject = args.subject 
      ? `【GIIIN/ギイーン】${args.subject}` 
      : `【GIIIN/ギイーン】${categoryLabel}`;

    const emailContent = `GIIIN/ギイーンのお問い合わせフォームから新しいメッセージが届きました。

■ お問い合わせ情報
・お名前: ${args.name}
・メールアドレス: ${args.email}
・お問い合わせ種別: ${categoryLabel}
・件名: ${args.subject || "（件名なし）"}

■ メッセージ内容
${args.message}

■ 管理情報
・受信日時: ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
・お問い合わせID: ${args.contactId}

---
このメールはGIIIN/ギイーンのお問い合わせフォームから自動送信されています。`;

    try {
      const { data, error } = await resend.emails.send({
        from: "GIIIN/ギイーン お問い合わせ <noreply@giiin.info>",
        to: "info@giiin.info",
        subject: emailSubject,
        text: emailContent,
      });

      if (error) {
        console.error("メール送信エラー:", error);
        throw new Error(`メール送信に失敗しました: ${JSON.stringify(error)}`);
      }

      console.log("メール送信成功:", data);
      return data;
    } catch (error) {
      console.error("メール送信処理でエラーが発生:", error);
      throw error;
    }
  },
});
