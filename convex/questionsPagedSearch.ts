import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const searchWithPagination = query({
  args: {
    page: v.number(),
    pageSize: v.optional(v.number()),
    category: v.optional(v.string()),
    memberId: v.optional(v.id("councilMembers")),
    searchTerm: v.optional(v.string()),
    sessionNumber: v.optional(v.string()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pageSize = args.pageSize || 20;
    const offset = (args.page - 1) * pageSize;
    
    let query = ctx.db.query("questions");
    
    // インデックスを使用してフィルタリング
    if (args.memberId) {
      query = query.withIndex("by_council_member", (q) => 
        q.eq("councilMemberId", args.memberId!)
      );
    } else {
      query = query.withIndex("by_session_date");
    }
    
    // 全ての質問を取得してフィルタリング
    let allQuestions = await query.order("desc").collect();
    
    // カテゴリーフィルター
    if (args.category) {
      allQuestions = allQuestions.filter(q => q.category === args.category);
    }
    
    // 検索フィルター
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      allQuestions = allQuestions.filter(q => 
        q.title.toLowerCase().includes(searchLower) ||
        q.content.toLowerCase().includes(searchLower)
      );
    }
    
    // セッション番号フィルター
    if (args.sessionNumber) {
      allQuestions = allQuestions.filter(q => q.sessionNumber === args.sessionNumber);
    }
    
    // ソート
    if (args.sortBy) {
      allQuestions.sort((a, b) => {
        switch (args.sortBy) {
          case "newest":
            return b.sessionDate - a.sessionDate;
          case "oldest":
            return a.sessionDate - b.sessionDate;
          case "title":
            return a.title.localeCompare(b.title, 'ja');
          default:
            return 0;
        }
      });
    }
    
    // 総件数
    const totalCount = allQuestions.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // ページネーション
    const paginatedQuestions = allQuestions.slice(offset, offset + pageSize);
    
    // 議員情報を取得
    const questionsWithMembers = await Promise.all(
      paginatedQuestions.map(async (question) => {
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
      questions: questionsWithMembers,
      pagination: {
        currentPage: args.page,
        totalPages,
        totalCount,
        pageSize,
        hasNextPage: args.page < totalPages,
        hasPrevPage: args.page > 1,
      }
    };
  },
});
