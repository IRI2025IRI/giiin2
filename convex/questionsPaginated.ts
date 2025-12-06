import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    category: v.optional(v.string()),
    memberId: v.optional(v.id("councilMembers")),
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let queryBuilder;
    
    if (args.memberId) {
      queryBuilder = ctx.db
        .query("questions")
        .withIndex("by_council_member", (q) => 
          q.eq("councilMemberId", args.memberId!)
        );
    } else {
      queryBuilder = ctx.db
        .query("questions")
        .withIndex("by_session_date");
    }
    
    // ページネーション適用
    const result = await queryBuilder.order("desc").paginate(args.paginationOpts);
    
    // フィルタリング（ページネーション後）
    let filteredQuestions = result.page;
    
    if (args.category) {
      filteredQuestions = filteredQuestions.filter(q => q.category === args.category);
    }
    
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      filteredQuestions = filteredQuestions.filter(q => 
        q.title.toLowerCase().includes(searchLower) ||
        q.content.toLowerCase().includes(searchLower)
      );
    }
    
    // 議員情報を取得
    const questionsWithMembers = await Promise.all(
      filteredQuestions.map(async (question) => {
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
    
    return {
      page: questionsWithMembers,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});
