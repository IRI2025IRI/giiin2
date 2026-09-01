import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { Doc } from "./_generated/dataModel";
import { GenericQueryCtx } from "convex/server";
import { DataModel } from "./_generated/dataModel";

// 議員情報・回答数・いいね数を付加する（一覧系クエリで共通利用）
async function enrichQuestion(ctx: GenericQueryCtx<DataModel>, question: Doc<"questions">) {
  const member = await ctx.db.get(question.councilMemberId);
  const responses = await ctx.db
    .query("responses")
    .withIndex("by_question", (q) => q.eq("questionId", question._id))
    .collect();

  const likes = await ctx.db
    .query("likes")
    .withIndex("by_question", (q) => q.eq("questionId", question._id))
    .collect();

  const userId = await getAuthUserId(ctx);
  const isLiked = userId ? likes.some((like) => like.userId === userId) : false;

  return {
    ...question,
    memberName: member?.name || "不明",
    memberParty: member?.party,
    memberPhotoUrl: member?.photoUrl,
    responseCount: responses.length,
    likeCount: likes.length,
    isLiked,
  };
}

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    category: v.optional(v.string()),
    memberId: v.optional(v.id("councilMembers")),
    searchTerm: v.optional(v.string()),
    sessionNumber: v.optional(v.string()),
    sortBy: v.optional(v.union(v.literal("newest"), v.literal("oldest"))),
  },
  handler: async (ctx, args) => {
    // 自由文検索がある場合は全文検索インデックスを使用（関連度順に返る）
    if (args.searchTerm) {
      const result = await ctx.db
        .query("questions")
        .withSearchIndex("search_content", (q) => {
          let searchQuery = q.search("searchText", args.searchTerm!);
          if (args.category) searchQuery = searchQuery.eq("category", args.category);
          if (args.memberId) searchQuery = searchQuery.eq("councilMemberId", args.memberId);
          if (args.sessionNumber) searchQuery = searchQuery.eq("sessionNumber", args.sessionNumber);
          return searchQuery;
        })
        .paginate(args.paginationOpts);

      const page = await Promise.all(result.page.map((question) => enrichQuestion(ctx, question)));

      return {
        page,
        isDone: result.isDone,
        continueCursor: result.continueCursor,
      };
    }

    const order = args.sortBy === "oldest" ? "asc" : "desc";
    let queryBuilder;

    // 最も効率的なインデックスを選択（優先順位: 会議番号 > 議員 > カテゴリー）
    if (args.sessionNumber) {
      queryBuilder = ctx.db
        .query("questions")
        .withIndex("by_session_number", (q) =>
          q.eq("sessionNumber", args.sessionNumber!)
        );
    } else if (args.memberId) {
      queryBuilder = ctx.db
        .query("questions")
        .withIndex("by_council_member", (q) =>
          q.eq("councilMemberId", args.memberId!)
        );
    } else if (args.category) {
      queryBuilder = ctx.db
        .query("questions")
        .withIndex("by_category", (q) =>
          q.eq("category", args.category!)
        );
    } else {
      queryBuilder = ctx.db
        .query("questions")
        .withIndex("by_session_date");
    }

    // ページネーション適用
    const result = await queryBuilder.order(order).paginate(args.paginationOpts);

    // 追加フィルタリング（インデックスで使用されなかった条件を適用）
    let filteredQuestions = result.page;

    // カテゴリーフィルター（カテゴリーインデックスを使用していない場合）
    if (args.category && (args.sessionNumber || args.memberId)) {
      filteredQuestions = filteredQuestions.filter(q => q.category === args.category);
    }

    // 議員フィルター（議員インデックスを使用していない場合）
    if (args.memberId && args.sessionNumber) {
      filteredQuestions = filteredQuestions.filter(q => q.councilMemberId === args.memberId);
    }

    const page = await Promise.all(filteredQuestions.map((question) => enrichQuestion(ctx, question)));

    return {
      page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});
