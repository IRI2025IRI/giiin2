import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
    memberId: v.optional(v.id("councilMembers")),
    councilMemberId: v.optional(v.id("councilMembers")), // 後方互換性のため
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let questions;
    
    const targetMemberId = args.memberId || args.councilMemberId;
    
    if (targetMemberId) {
      questions = await ctx.db
        .query("questions")
        .withIndex("by_council_member", (q) => 
          q.eq("councilMemberId", targetMemberId)
        )
        .order("desc")
        .collect();
    } else {
      questions = await ctx.db
        .query("questions")
        .withIndex("by_session_date")
        .order("desc")
        .collect();
    }
    
    // フィルタリング
    if (args.category) {
      questions = questions.filter(q => q.category === args.category);
    }
    
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      questions = questions.filter(q => 
        q.title.toLowerCase().includes(searchLower) ||
        q.content.toLowerCase().includes(searchLower)
      );
    }
    
    // 制限
    if (args.limit) {
      questions = questions.slice(0, args.limit);
    }
    
    // 議員情報を取得
    const questionsWithMembers = await Promise.all(
      questions.map(async (question) => {
        const member = await ctx.db.get(question.councilMemberId);
        const responses = await ctx.db
          .query("responses")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();
        
        // いいね数を取得
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();
        
        // 現在のユーザーがいいねしているかチェック
        const userId = await getAuthUserId(ctx);
        const isLiked = userId ? likes.some(like => like.userId === userId) : false;
        
        return {
          ...question,
          memberName: member?.name || "不明",
          memberParty: member?.party,
          memberPhotoUrl: member?.photoUrl,
          responseCount: responses.length,
          likeCount: likes.length,
          isLiked,
        };
      })
    );
    
    return questionsWithMembers;
  },
});

export const getById = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId);
    if (!question) return null;
    
    const member = await ctx.db.get(question.councilMemberId);
    const responses = await ctx.db
      .query("responses")
      .withIndex("by_question", (q) => q.eq("questionId", question._id))
      .collect();
    
    // いいね数を取得
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_question", (q) => q.eq("questionId", question._id))
      .collect();
    
    // 現在のユーザーがいいねしているかチェック
    const userId = await getAuthUserId(ctx);
    const isLiked = userId ? likes.some(like => like.userId === userId) : false;
    
    return {
      ...question,
      memberName: member?.name || "不明",
      memberParty: member?.party,
      memberPhotoUrl: member?.photoUrl,
      responseCount: responses.length,
      likeCount: likes.length,
      isLiked,
      responses,
    };
  },
});

export const getResponses = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("responses")
      .withIndex("by_question", (q) => q.eq("questionId", args.questionId))
      .order("asc")
      .collect();
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_session_date")
      .order("desc")
      .take(limit);
    
    // 議員情報を取得
    const questionsWithMembers = await Promise.all(
      questions.map(async (question) => {
        const member = await ctx.db.get(question.councilMemberId);
        const responses = await ctx.db
          .query("responses")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();
        
        // いいね数を取得
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();
        
        // 現在のユーザーがいいねしているかチェック
        const userId = await getAuthUserId(ctx);
        const isLiked = userId ? likes.some(like => like.userId === userId) : false;
        
        return {
          ...question,
          memberName: member?.name || "不明",
          memberParty: member?.party,
          memberPhotoUrl: member?.photoUrl,
          responseCount: responses.length,
          likeCount: likes.length,
          isLiked,
        };
      })
    );
    
    return questionsWithMembers;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.string(),
    councilMemberId: v.id("councilMembers"),
    sessionDate: v.number(),
    sessionNumber: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    documentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }
    
    return await ctx.db.insert("questions", {
      ...args,
      status: "pending" as const,
    });
  },
});

export const update = mutation({
  args: {
    questionId: v.id("questions"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
    sessionDate: v.optional(v.number()),
    sessionNumber: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    documentUrl: v.optional(v.string()),
    status: v.optional(v.union(v.literal("pending"), v.literal("answered"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }
    
    const { questionId, ...updates } = args;
    
    // 空の値を除去
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error("更新する項目がありません");
    }
    
    return await ctx.db.patch(questionId, filteredUpdates);
  },
});

export const remove = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }
    
    // 関連する回答も削除
    const responses = await ctx.db
      .query("responses")
      .withIndex("by_question", (q) => q.eq("questionId", args.questionId))
      .collect();
    
    for (const response of responses) {
      await ctx.db.delete(response._id);
    }
    
    // いいねも削除
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_question", (q) => q.eq("questionId", args.questionId))
      .collect();
    
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }
    
    return await ctx.db.delete(args.questionId);
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("questions").collect();
    const categories = [...new Set(questions.map(q => q.category))];
    return categories.sort();
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("questions").collect();
    const responses = await ctx.db.query("responses").collect();
    
    const totalQuestions = questions.length;
    const answeredQuestions = questions.filter(q => q.status === "answered").length;
    const totalResponses = responses.length;
    
    const categoryStats = questions.reduce((acc, question) => {
      acc[question.category] = (acc[question.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalQuestions,
      answeredQuestions,
      totalResponses,
      answerRate: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
      categoryStats,
    };
  },
});

// 後方互換性のための関数
export const deleteQuestion = mutation({
  args: { id: v.id("questions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }
    
    // 関連する回答も削除
    const responses = await ctx.db
      .query("responses")
      .withIndex("by_question", (q) => q.eq("questionId", args.id))
      .collect();
    
    for (const response of responses) {
      await ctx.db.delete(response._id);
    }
    
    // いいねも削除
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_question", (q) => q.eq("questionId", args.id))
      .collect();
    
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }
    
    return await ctx.db.delete(args.id);
  },
});

export const getSessionNumbers = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("questions").collect();
    const sessionNumbers = [...new Set(questions.map(q => q.sessionNumber).filter(Boolean))];
    return sessionNumbers.sort();
  },
});

export const getTopLikedQuestions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const questions = await ctx.db.query("questions").collect();
    
    const questionsWithLikes = await Promise.all(
      questions.map(async (question) => {
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();
        
        const responses = await ctx.db
          .query("responses")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();
        
        const member = await ctx.db.get(question.councilMemberId);
        
        // 現在のユーザーがいいねしているかチェック
        const userId = await getAuthUserId(ctx);
        const isLiked = userId ? likes.some(like => like.userId === userId) : false;
        
        return {
          ...question,
          memberName: member?.name || "不明",
          memberParty: member?.party,
          memberPhotoUrl: member?.photoUrl,
          likeCount: likes.length,
          responseCount: responses.length,
          isLiked,
        };
      })
    );
    
    return questionsWithLikes
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, limit);
  },
});

export const addResponse = mutation({
  args: {
    questionId: v.id("questions"),
    content: v.string(),
    respondentTitle: v.optional(v.string()),
    department: v.optional(v.string()),
    responseDate: v.number(),
    documentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }
    
    return await ctx.db.insert("responses", args);
  },
});

export const updateResponse = mutation({
  args: {
    responseId: v.id("responses"),
    content: v.optional(v.string()),
    respondentTitle: v.optional(v.string()),
    department: v.optional(v.string()),
    responseDate: v.optional(v.number()),
    documentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }
    
    const { responseId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error("更新する項目がありません");
    }
    
    return await ctx.db.patch(responseId, filteredUpdates);
  },
});

export const deleteResponse = mutation({
  args: { responseId: v.id("responses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }
    
    return await ctx.db.delete(args.responseId);
  },
});
