import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  councilMembers: defineTable({
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
  }),

  questions: defineTable({
    title: v.string(),
    content: v.string(),
    category: v.string(),
    councilMemberId: v.id("councilMembers"),
    sessionDate: v.number(),
    sessionNumber: v.optional(v.string()),
    youtubeUrl: v.optional(v.string()),
    documentUrl: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("answered"), v.literal("archived")),
  })
    .index("by_council_member", ["councilMemberId"])
    .index("by_session_date", ["sessionDate"]),

  responses: defineTable({
    questionId: v.id("questions"),
    content: v.string(),
    respondentTitle: v.optional(v.string()),
    department: v.optional(v.string()),
    responseDate: v.number(),
    documentUrl: v.optional(v.string()),
  }).index("by_question", ["questionId"]),

  likes: defineTable({
    userId: v.id("users"),
    questionId: v.optional(v.id("questions")),
    // 古いスキーマとの互換性のため
    targetId: v.optional(v.string()),
    targetType: v.optional(v.string()),
  })
    .index("by_user_and_question", ["userId", "questionId"])
    .index("by_question", ["questionId"])
    .index("by_user", ["userId"]),

  news: defineTable({
    title: v.string(),
    content: v.string(),
    category: v.string(),
    publishDate: v.number(),
    isPublished: v.boolean(),
    authorId: v.id("users"),
    // サムネイル画像の追加
    thumbnailUrl: v.optional(v.string()),
    thumbnailId: v.optional(v.id("_storage")),
  }),

  adminUsers: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("superAdmin")),
    grantedBy: v.id("users"),
    grantedAt: v.number(),
  }).index("by_user", ["userId"]),

  slideshowSlides: defineTable({
    title: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    linkUrl: v.optional(v.string()),
    backgroundColor: v.string(),
    order: v.number(),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    updatedBy: v.optional(v.id("users")),
  }).index("by_order", ["order", "isActive"]),

  // メール認証用のテーブル
  emailVerificationTokens: defineTable({
    email: v.string(),
    token: v.string(),
    type: v.union(v.literal("verification"), v.literal("password_reset")),
    expiresAt: v.number(),
    used: v.boolean(),
    userId: v.optional(v.id("users")),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"])
    .index("by_email_and_type", ["email", "type"]),

  // ユーザーのメール認証状態を管理
  userEmailStatus: defineTable({
    userId: v.id("users"),
    email: v.string(),
    isVerified: v.boolean(),
    verifiedAt: v.optional(v.number()),
    verificationRequestedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
