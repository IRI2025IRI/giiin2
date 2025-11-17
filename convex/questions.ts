import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_session_date")
      .order("desc")
      .collect();

    const questionsWithDetails = await Promise.all(
      questions.map(async (question) => {
        const member = await ctx.db.get(question.councilMemberId);
        const responses = await ctx.db
          .query("responses")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();

        // Get like count and user's like status
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();
        
        const likeCount = likes.length;
        const isLiked = userId ? likes.some(like => like.userId === userId) : false;

        return {
          ...question,
          memberName: member?.name || "不明",
          memberParty: member?.party,
          responseCount: responses.length,
          likeCount,
          isLiked,
        };
      })
    );

    return questionsWithDetails;
  },
});

export const getByCouncilMember = query({
  args: { councilMemberId: v.id("councilMembers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_council_member", (q) => q.eq("councilMemberId", args.councilMemberId))
      .order("desc")
      .collect();

    const questionsWithDetails = await Promise.all(
      questions.map(async (question) => {
        const responses = await ctx.db
          .query("responses")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();

        // Get like count and user's like status
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();
        
        const likeCount = likes.length;
        const isLiked = userId ? likes.some(like => like.userId === userId) : false;

        return {
          ...question,
          responseCount: responses.length,
          likeCount,
          isLiked,
        };
      })
    );

    return questionsWithDetails;
  },
});

export const getById = query({
  args: { id: v.id("questions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const question = await ctx.db.get(args.id);
    if (!question) return null;

    const member = await ctx.db.get(question.councilMemberId);
    const responses = await ctx.db
      .query("responses")
      .withIndex("by_question", (q) => q.eq("questionId", question._id))
      .collect();

    // Get like count and user's like status
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_question", (q) => q.eq("questionId", question._id))
      .collect();
    
    const likeCount = likes.length;
    const isLiked = userId ? likes.some(like => like.userId === userId) : false;

    return {
      ...question,
      memberName: member?.name || "不明",
      memberParty: member?.party,
      responses,
      likeCount,
      isLiked,
    };
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
    id: v.id("questions"),
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

    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("questions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    return await ctx.db.delete(args.id);
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const limit = args.limit || 5;
    
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_session_date")
      .order("desc")
      .take(limit);

    const questionsWithDetails = await Promise.all(
      questions.map(async (question) => {
        const member = await ctx.db.get(question.councilMemberId);
        const responses = await ctx.db
          .query("responses")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();

        // Get like count and user's like status
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();
        
        const likeCount = likes.length;
        const isLiked = userId ? likes.some(like => like.userId === userId) : false;

        return {
          ...question,
          memberName: member?.name || "不明",
          memberParty: member?.party,
          responseCount: responses.length,
          likeCount,
          isLiked,
        };
      })
    );

    return questionsWithDetails;
  },
});

export const getPopular = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const limit = args.limit || 5;
    
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_session_date")
      .order("desc")
      .take(50); // Get more questions to sort by likes

    const questionsWithDetails = await Promise.all(
      questions.map(async (question) => {
        const member = await ctx.db.get(question.councilMemberId);
        const responses = await ctx.db
          .query("responses")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();

        // Get like count and user's like status
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();
        
        const likeCount = likes.length;
        const isLiked = userId ? likes.some(like => like.userId === userId) : false;

        return {
          ...question,
          memberName: member?.name || "不明",
          memberParty: member?.party,
          responseCount: responses.length,
          likeCount,
          isLiked,
        };
      })
    );

    // Sort by like count and return top results
    return questionsWithDetails
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, limit);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("questions").collect();
    const responses = await ctx.db.query("responses").collect();
    const members = await ctx.db.query("councilMembers").collect();
    
    return {
      totalQuestions: questions.length,
      totalResponses: responses.length,
      totalMembers: members.filter(m => m.isActive).length,
      answeredQuestions: questions.filter(q => q.status === "answered").length,
    };
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("questions").collect();
    const categoryCount: Record<string, number> = {};
    
    questions.forEach(q => {
      categoryCount[q.category] = (categoryCount[q.category] || 0) + 1;
    });
    
    return Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
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

export const getResponses = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("responses")
      .withIndex("by_question", (q) => q.eq("questionId", args.questionId))
      .collect();
  },
});

export const addResponse = mutation({
  args: {
    questionId: v.id("questions"),
    content: v.string(),
    respondentTitle: v.string(),
    department: v.optional(v.string()),
    documentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    const responseId = await ctx.db.insert("responses", {
      ...args,
      responseDate: Date.now(),
    });

    // Update question status to answered
    await ctx.db.patch(args.questionId, { status: "answered" as const });

    return responseId;
  },
});

export const deleteResponse = mutation({
  args: { id: v.id("responses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    return await ctx.db.delete(args.id);
  },
});

export const getTopLikedQuestions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const limit = args.limit || 10;
    
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_session_date")
      .order("desc")
      .take(100); // Get more questions to sort by likes

    const questionsWithDetails = await Promise.all(
      questions.map(async (question) => {
        const member = await ctx.db.get(question.councilMemberId);
        const responses = await ctx.db
          .query("responses")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();

        // Get like count and user's like status
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();
        
        const likeCount = likes.length;
        const isLiked = userId ? likes.some(like => like.userId === userId) : false;

        return {
          ...question,
          memberName: member?.name || "不明",
          memberParty: member?.party,
          responseCount: responses.length,
          likeCount,
          isLiked,
        };
      })
    );

    // Sort by like count and return top results
    return questionsWithDetails
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, limit);
  },
});

export const listPaginated = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const page = args.page || 1;
    const limit = args.limit || 20;
    const offset = (page - 1) * limit;
    
    const allQuestions = await ctx.db
      .query("questions")
      .withIndex("by_session_date")
      .order("desc")
      .collect();

    const totalCount = allQuestions.length;
    const questions = allQuestions.slice(offset, offset + limit);

    const questionsWithDetails = await Promise.all(
      questions.map(async (question) => {
        const member = await ctx.db.get(question.councilMemberId);
        const responses = await ctx.db
          .query("responses")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();

        // Get like count and user's like status
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();
        
        const likeCount = likes.length;
        const isLiked = userId ? likes.some(like => like.userId === userId) : false;

        return {
          ...question,
          memberName: member?.name || "不明",
          memberParty: member?.party,
          responseCount: responses.length,
          likeCount,
          isLiked,
        };
      })
    );

    return {
      questions: questionsWithDetails,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    };
  },
});
