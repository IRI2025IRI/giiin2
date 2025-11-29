import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// データベースの状況を確認するためのクエリ
export const checkDataStatus = query({
  args: {},
  handler: async (ctx) => {
    const memberCount = await ctx.db.query("councilMembers").collect();
    const questionCount = await ctx.db.query("questions").collect();
    const userCount = await ctx.db.query("users").collect();
    
    return {
      memberCount: memberCount.length,
      questionCount: questionCount.length,
      userCount: userCount.length,
      members: memberCount.slice(0, 3), // 最初の3件のサンプル
      questions: questionCount.slice(0, 3), // 最初の3件のサンプル
    };
  },
});

export const list = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let query = ctx.db.query("councilMembers");
    
    if (args.activeOnly) {
      query = query.filter((q) => q.eq(q.field("isActive"), true));
    }
    
    const members = await query.order("desc").collect();
    
    // 各議員の写真URLを取得
    const membersWithPhotos = await Promise.all(
      members.map(async (member) => {
        let memberPhotoUrl = null;
        if (member.photoId) {
          memberPhotoUrl = await ctx.storage.getUrl(member.photoId);
        } else if (member.photoUrl) {
          memberPhotoUrl = member.photoUrl;
        }
        
        return {
          ...member,
          memberPhotoUrl,
        };
      })
    );
    
    return membersWithPhotos;
  },
});

export const get = query({
  args: { id: v.id("councilMembers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getById = query({
  args: { id: v.id("councilMembers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    party: v.optional(v.string()),
    position: v.optional(v.string()),
    politicalParty: v.optional(v.string()),
    electionCount: v.optional(v.number()),
    committee: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    blogUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    notes: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
    termStart: v.number(),
    termEnd: v.optional(v.number()),
    isActive: v.boolean(),
    contactInfo: v.optional(v.object({
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      website: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    return await ctx.db.insert("councilMembers", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("councilMembers"),
    name: v.string(),
    party: v.optional(v.string()),
    position: v.optional(v.string()),
    politicalParty: v.optional(v.string()),
    electionCount: v.optional(v.number()),
    committee: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    blogUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    notes: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
    termStart: v.number(),
    termEnd: v.optional(v.number()),
    isActive: v.boolean(),
    contactInfo: v.optional(v.object({
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      website: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    const { id, ...updateData } = args;
    await ctx.db.patch(id, updateData);
  },
});

export const remove = mutation({
  args: { id: v.id("councilMembers") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    await ctx.db.delete(args.id);
  },
});

export const getStats = query({
  args: { memberId: v.id("councilMembers") },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) {
      throw new Error("議員が見つかりません");
    }

    const allQuestions = await ctx.db
      .query("questions")
      .withIndex("by_council_member", (q) => q.eq("councilMemberId", args.memberId))
      .collect();

    // 任期期間中の質問のみをフィルタリング
    const questions = allQuestions.filter(q => {
      const sessionDate = q.sessionDate;
      const termStart = member.termStart;
      const termEnd = member.termEnd;
      
      // 任期開始日以降の質問
      if (sessionDate < termStart) return false;
      
      // 任期終了日が設定されている場合は、その日以前の質問のみ
      if (termEnd && sessionDate > termEnd) return false;
      
      return true;
    });

    const currentYear = new Date().getFullYear();
    const questionsThisYear = questions.filter(q => 
      new Date(q.sessionDate).getFullYear() === currentYear
    ).length;

    // いいね数を計算
    let totalLikes = 0;
    for (const question of questions) {
      const likes = await ctx.db
        .query("likes")
        .withIndex("by_question", (q) => q.eq("questionId", question._id))
        .collect();
      totalLikes += likes.length;
    }

    // カテゴリー別統計
    const categoryStats: Record<string, number> = {};
    questions.forEach(q => {
      categoryStats[q.category] = (categoryStats[q.category] || 0) + 1;
    });

    const categories = Object.entries(categoryStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalQuestions: questions.length,
      questionsThisYear,
      totalLikes,
      categories,
    };
  },
});

export const getRankings = query({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db.query("councilMembers").collect();
    const rankings = [];
    const excludedMembers = []; // 議長など質問できない議員

    for (const member of members) {
      // 議長は質問できないため除外
      if (member.position && (
        member.position.includes("議長") || 
        member.position.includes("副議長")
      )) {
        excludedMembers.push(member);
        continue;
      }
      const allQuestions = await ctx.db
        .query("questions")
        .withIndex("by_council_member", (q) => q.eq("councilMemberId", member._id))
        .collect();

      // 任期期間中の質問のみをフィルタリング
      const questions = allQuestions.filter(q => {
        const sessionDate = q.sessionDate;
        const termStart = member.termStart;
        const termEnd = member.termEnd;
        
        // 任期開始日以降の質問
        if (sessionDate < termStart) return false;
        
        // 任期終了日が設定されている場合は、その日以前の質問のみ
        if (termEnd && sessionDate > termEnd) return false;
        
        return true;
      });

      const currentYear = new Date().getFullYear();
      const questionsThisYear = questions.filter(q => 
        new Date(q.sessionDate).getFullYear() === currentYear
      ).length;

      // いいね数を計算
      let totalLikes = 0;
      for (const question of questions) {
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();
        totalLikes += likes.length;
      }

      rankings.push({
        member,
        stats: {
          totalQuestions: questions.length,
          questionsThisYear,
          totalLikes,
        },
      });
    }

    // 質問数でソート
    const sortedRankings = rankings.sort((a, b) => b.stats.totalQuestions - a.stats.totalQuestions);
    
    return {
      rankings: sortedRankings,
      excludedMembers: excludedMembers.map(member => ({
        member,
        reason: member.position || "役職者"
      }))
    };
  },
});

export const getPartyRankings = query({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db.query("councilMembers").collect();
    const partyStats: Record<string, { memberCount: number; totalQuestions: number; totalLikes: number }> = {};

    for (const member of members) {
      const party = member.party || "無所属";
      
      if (!partyStats[party]) {
        partyStats[party] = { memberCount: 0, totalQuestions: 0, totalLikes: 0 };
      }
      
      partyStats[party].memberCount++;

      const allQuestions = await ctx.db
        .query("questions")
        .withIndex("by_council_member", (q) => q.eq("councilMemberId", member._id))
        .collect();

      // 任期期間中の質問のみをフィルタリング
      const questions = allQuestions.filter(q => {
        const sessionDate = q.sessionDate;
        const termStart = member.termStart;
        const termEnd = member.termEnd;
        
        // 任期開始日以降の質問
        if (sessionDate < termStart) return false;
        
        // 任期終了日が設定されている場合は、その日以前の質問のみ
        if (termEnd && sessionDate > termEnd) return false;
        
        return true;
      });

      partyStats[party].totalQuestions += questions.length;

      // いいね数を計算
      for (const question of questions) {
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_question", (q) => q.eq("questionId", question._id))
          .collect();
        partyStats[party].totalLikes += likes.length;
      }
    }

    return Object.entries(partyStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.totalQuestions - a.totalQuestions);
  },
});

export const getPhotoUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }
    return await ctx.storage.generateUploadUrl();
  },
});
