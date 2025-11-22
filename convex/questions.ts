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

        // Get member photo URL
        let memberPhotoUrl = null;
        if (member?.photoId) {
          memberPhotoUrl = await ctx.storage.getUrl(member.photoId);
        } else if (member?.photoUrl) {
          memberPhotoUrl = member.photoUrl;
        }

        return {
          ...question,
          memberName: member?.name || "不明",
          memberParty: member?.party,
          memberPhotoUrl,
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

        // Get member photo URL
        let memberPhotoUrl = null;
        if (member?.photoId) {
          memberPhotoUrl = await ctx.storage.getUrl(member.photoId);
        } else if (member?.photoUrl) {
          memberPhotoUrl = member.photoUrl;
        }

        return {
          ...question,
          memberName: member?.name || "不明",
          memberParty: member?.party,
          memberPhotoUrl,
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

    // Get member photo URL
    let memberPhotoUrl = null;
    if (member?.photoId) {
      memberPhotoUrl = await ctx.storage.getUrl(member.photoId);
    } else if (member?.photoUrl) {
      memberPhotoUrl = member.photoUrl;
    }

    return {
      ...question,
      memberName: member?.name || "不明",
      memberParty: member?.party,
      memberPhotoUrl,
      responses,
      likeCount,
      isLiked,
    };
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

        // Get member photo URL
        let memberPhotoUrl = null;
        if (member?.photoId) {
          memberPhotoUrl = await ctx.storage.getUrl(member.photoId);
        } else if (member?.photoUrl) {
          memberPhotoUrl = member.photoUrl;
        }

        return {
          ...question,
          memberName: member?.name || "不明",
          memberParty: member?.party,
          memberPhotoUrl,
          responseCount: responses.length,
          likeCount,
          isLiked,
        };
      })
    );

    return questionsWithDetails;
  },
});

export const getByMemberId = query({
  args: { memberId: v.id("councilMembers") },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_council_member", (q) => q.eq("councilMemberId", args.memberId))
      .order("desc")
      .collect();

    return Promise.all(
      questions.map(async (question) => {
        const responses = await ctx.db
          .query("responses")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();

        return {
          ...question,
          responses,
          responseCount: responses.length,
        };
      })
    );
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

        // Get member photo URL
        let memberPhotoUrl = null;
        if (member?.photoId) {
          memberPhotoUrl = await ctx.storage.getUrl(member.photoId);
        } else if (member?.photoUrl) {
          memberPhotoUrl = member.photoUrl;
        }

        return {
          ...question,
          memberName: member?.name || "不明",
          memberParty: member?.party,
          memberPhotoUrl,
          responseCount: responses.length,
          likeCount,
          isLiked,
        };
      })
    );

    // Sort by like count and take the limit
    return questionsWithDetails
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, limit);
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

        // Get member photo URL
        let memberPhotoUrl = null;
        if (member?.photoId) {
          memberPhotoUrl = await ctx.storage.getUrl(member.photoId);
        } else if (member?.photoUrl) {
          memberPhotoUrl = member.photoUrl;
        }

        return {
          ...question,
          memberName: member?.name || "不明",
          memberParty: member?.party,
          memberPhotoUrl,
          responseCount: responses.length,
          likeCount,
          isLiked,
        };
      })
    );

    // Sort by like count and take the limit
    return questionsWithDetails
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, limit);
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("questions").collect();
    const categoryCount: Record<string, number> = {};
    
    questions.forEach(question => {
      categoryCount[question.category] = (categoryCount[question.category] || 0) + 1;
    });
    
    return Object.entries(categoryCount).map(([name, count]) => ({
      name,
      count
    }));
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
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("questions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    await ctx.db.delete(args.id);
  },
});

export const addResponse = mutation({
  args: {
    questionId: v.id("questions"),
    content: v.string(),
    respondentTitle: v.optional(v.string()),
    department: v.optional(v.string()),
    documentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    return await ctx.db.insert("responses", {
      ...args,
      responseDate: Date.now(),
    });
  },
});

export const updateResponse = mutation({
  args: {
    id: v.id("responses"),
    content: v.optional(v.string()),
    respondentTitle: v.optional(v.string()),
    department: v.optional(v.string()),
    documentUrl: v.optional(v.string()),
    responseDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteResponse = mutation({
  args: { id: v.id("responses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    await ctx.db.delete(args.id);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("questions").collect();
    const totalQuestions = questions.length;
    const answeredQuestions = questions.filter(q => q.status === "answered").length;
    const pendingQuestions = questions.filter(q => q.status === "pending").length;

    return {
      totalQuestions,
      answeredQuestions,
      pendingQuestions,
      answerRate: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
    };
  },
});
