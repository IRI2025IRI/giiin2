import { v } from "convex/values";
import { action, internalQuery, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// データをエクスポートするアクション
export const exportAllData = action({
  args: {},
  handler: async (ctx): Promise<{ exportedAt: number; data: any }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 管理者権限チェック
    const adminUser = await ctx.runQuery(internal.dataMigration.checkAdminPermission, { userId });
    if (!adminUser) {
      throw new Error("管理者権限が必要です");
    }

    // 全テーブルのデータを取得（関連情報も含める）
    const data: any = await ctx.runQuery(internal.dataMigration.getAllDataWithRelations, {});
    
    return {
      exportedAt: Date.now(),
      data
    };
  },
});

// データをインポートするアクション
export const importAllData = action({
  args: { 
    jsonData: v.string(),
    options: v.object({
      clearExistingData: v.boolean(),
      skipDuplicates: v.boolean(),
    })
  },
  handler: async (ctx, args): Promise<{ success: boolean; message: string; stats: any }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 管理者権限チェック
    const adminUser = await ctx.runQuery(internal.dataMigration.checkAdminPermission, { userId });
    if (!adminUser) {
      throw new Error("管理者権限が必要です");
    }

    try {
      // JSONデータをパース
      const importData = JSON.parse(args.jsonData);
      
      // データ構造の検証
      if (!importData.data) {
        throw new Error("無効なデータ形式です。エクスポートされたJSONファイルを使用してください。");
      }

      const data = importData.data;
      
      // 既存データのクリア（オプション）
      if (args.options.clearExistingData) {
        await ctx.runMutation(internal.dataMigration.clearAllData, {});
      }

      // データのインポート実行
      const stats = await ctx.runMutation(internal.dataMigration.importData, {
        data,
        skipDuplicates: args.options.skipDuplicates,
        currentUserId: userId
      });

      return {
        success: true,
        message: "データのインポートが完了しました",
        stats
      };
    } catch (error) {
      console.error("Import error:", error);
      return {
        success: false,
        message: `インポートエラー: ${error instanceof Error ? error.message : String(error)}`,
        stats: null
      };
    }
  },
});

// 管理者権限チェック（内部クエリ）
export const checkAdminPermission = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    return adminUser ? (adminUser.role === "admin" || adminUser.role === "superAdmin") : false;
  },
});

// 全データを関連情報と共に取得（内部クエリ）
export const getAllDataWithRelations = internalQuery({
  args: {},
  handler: async (ctx): Promise<any> => {
    const [
      councilMembers,
      questions,
      responses,
      news,
      slideshowSlides,
      faqItems,
      contactMessages,
      likes,
      userDemographics,
    ] = await Promise.all([
      ctx.db.query("councilMembers").collect(),
      ctx.db.query("questions").collect(),
      ctx.db.query("responses").collect(),
      ctx.db.query("news").collect(),
      ctx.db.query("slideshowSlides").collect(),
      ctx.db.query("faqItems").collect(),
      ctx.db.query("contactMessages").collect(),
      ctx.db.query("likes").collect(),
      ctx.db.query("userDemographics").collect(),
    ]);

    // 質問に議員名を追加
    const questionsWithMemberNames = await Promise.all(
      questions.map(async (question) => {
        const member = await ctx.db.get(question.councilMemberId);
        return {
          ...question,
          councilMemberName: member?.name || ""
        };
      })
    );

    // 回答に質問タイトルを追加
    const responsesWithQuestionTitles = await Promise.all(
      responses.map(async (response) => {
        const question = await ctx.db.get(response.questionId);
        return {
          ...response,
          questionTitle: question?.title || ""
        };
      })
    );

    return {
      councilMembers,
      questions: questionsWithMemberNames,
      responses: responsesWithQuestionTitles,
      news,
      slideshowSlides,
      faqItems,
      contactMessages,
      likes,
      userDemographics,
    };
  },
});

// 既存データをクリア（内部ミューテーション）
export const clearAllData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 関連データから順番に削除
    const responses = await ctx.db.query("responses").collect();
    for (const response of responses) {
      await ctx.db.delete(response._id);
    }

    const questions = await ctx.db.query("questions").collect();
    for (const question of questions) {
      await ctx.db.delete(question._id);
    }

    const councilMembers = await ctx.db.query("councilMembers").collect();
    for (const member of councilMembers) {
      await ctx.db.delete(member._id);
    }

    const news = await ctx.db.query("news").collect();
    for (const newsItem of news) {
      await ctx.db.delete(newsItem._id);
    }

    const slideshowSlides = await ctx.db.query("slideshowSlides").collect();
    for (const slide of slideshowSlides) {
      await ctx.db.delete(slide._id);
    }

    const faqItems = await ctx.db.query("faqItems").collect();
    for (const faq of faqItems) {
      await ctx.db.delete(faq._id);
    }

    const contactMessages = await ctx.db.query("contactMessages").collect();
    for (const contact of contactMessages) {
      await ctx.db.delete(contact._id);
    }

    const userDemographics = await ctx.db.query("userDemographics").collect();
    for (const demographic of userDemographics) {
      await ctx.db.delete(demographic._id);
    }

    const likes = await ctx.db.query("likes").collect();
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }
  },
});

// データをインポート（内部ミューテーション）
export const importData = internalMutation({
  args: {
    data: v.any(),
    skipDuplicates: v.boolean(),
    currentUserId: v.id("users")
  },
  handler: async (ctx, args) => {
    const stats = {
      councilMembers: { imported: 0, skipped: 0 },
      questions: { imported: 0, skipped: 0 },
      responses: { imported: 0, skipped: 0 },
      news: { imported: 0, skipped: 0 },
      slideshowSlides: { imported: 0, skipped: 0 },
      faqItems: { imported: 0, skipped: 0 },
      contactMessages: { imported: 0, skipped: 0 },
      likes: { imported: 0, skipped: 0 },
      userDemographics: { imported: 0, skipped: 0 },
    };

    const { data, skipDuplicates, currentUserId } = args;

    // 議員データのインポート（最初に実行）
    const memberIdMap = new Map<string, string>(); // 旧ID -> 新ID のマッピング
    
    if (data.councilMembers && Array.isArray(data.councilMembers)) {
      for (const member of data.councilMembers) {
        try {
          // 重複チェック（名前のみで判定）
          if (skipDuplicates) {
            const existing = await ctx.db
              .query("councilMembers")
              .filter((q) => q.eq(q.field("name"), member.name))
              .first();
            
            if (existing) {
              memberIdMap.set(member._id, existing._id);
              stats.councilMembers.skipped++;
              continue;
            }
          }

          // システムフィールドを除去
          const { _id, _creationTime, ...memberData } = member;
          const newMemberId = await ctx.db.insert("councilMembers", memberData);
          memberIdMap.set(_id, newMemberId);
          stats.councilMembers.imported++;
        } catch (error) {
          console.error("Error importing council member:", error);
          stats.councilMembers.skipped++;
        }
      }
    }

    // 質問データのインポート
    const questionIdMap = new Map<string, string>(); // 旧ID -> 新ID のマッピング
    
    if (data.questions && Array.isArray(data.questions)) {
      for (const question of data.questions) {
        try {
          // 議員IDの関連付け
          let councilMemberId = null;
          
          if (question.councilMemberId && memberIdMap.has(question.councilMemberId)) {
            councilMemberId = memberIdMap.get(question.councilMemberId);
          } else if (question.councilMemberName) {
            // 名前で議員を検索
            const member = await ctx.db
              .query("councilMembers")
              .filter((q) => q.eq(q.field("name"), question.councilMemberName))
              .first();
            councilMemberId = member?._id || null;
          }

          if (!councilMemberId) {
            console.log(`質問「${question.title}」: 関連する議員が見つかりません`);
            stats.questions.skipped++;
            continue;
          }

          // 重複チェック（タイトルと議員IDで判定）
          if (skipDuplicates) {
            const existing = await ctx.db
              .query("questions")
              .filter((q) => 
                q.eq(q.field("title"), question.title) &&
                q.eq(q.field("councilMemberId"), councilMemberId)
              )
              .first();
            
            if (existing) {
              questionIdMap.set(question._id, existing._id);
              stats.questions.skipped++;
              continue;
            }
          }

          // システムフィールドと関連フィールドを除去
          const { _id, _creationTime, councilMemberName, ...questionData } = question;
          questionData.councilMemberId = councilMemberId;
          
          const newQuestionId = await ctx.db.insert("questions", questionData);
          questionIdMap.set(_id, newQuestionId);
          stats.questions.imported++;
        } catch (error) {
          console.error("Error importing question:", error);
          stats.questions.skipped++;
        }
      }
    }

    // 回答データのインポート
    if (data.responses && Array.isArray(data.responses)) {
      for (const response of data.responses) {
        try {
          // 質問IDの関連付け
          let questionId = null;
          
          if (response.questionId && questionIdMap.has(response.questionId)) {
            questionId = questionIdMap.get(response.questionId);
          } else if (response.questionTitle) {
            // タイトルで質問を検索
            const question = await ctx.db
              .query("questions")
              .filter((q) => q.eq(q.field("title"), response.questionTitle))
              .first();
            questionId = question?._id || null;
          }

          if (!questionId) {
            console.log(`回答: 関連する質問「${response.questionTitle}」が見つかりません`);
            stats.responses.skipped++;
            continue;
          }

          // システムフィールドと関連フィールドを除去
          const { _id, _creationTime, questionTitle, ...responseData } = response;
          responseData.questionId = questionId;
          
          await ctx.db.insert("responses", responseData);
          stats.responses.imported++;
        } catch (error) {
          console.error("Error importing response:", error);
          stats.responses.skipped++;
        }
      }
    }

    // お知らせデータのインポート
    if (data.news && Array.isArray(data.news)) {
      for (const newsItem of data.news) {
        try {
          if (skipDuplicates) {
            const existing = await ctx.db
              .query("news")
              .filter((q) => q.eq(q.field("title"), newsItem.title))
              .first();
            
            if (existing) {
              stats.news.skipped++;
              continue;
            }
          }

          const { _id, _creationTime, ...newsData } = newsItem;
          // 現在のユーザーをauthorIdに設定
          newsData.authorId = currentUserId;
          
          await ctx.db.insert("news", newsData);
          stats.news.imported++;
        } catch (error) {
          console.error("Error importing news:", error);
          stats.news.skipped++;
        }
      }
    }

    // スライドショーデータのインポート
    if (data.slideshowSlides && Array.isArray(data.slideshowSlides)) {
      for (const slide of data.slideshowSlides) {
        try {
          const { _id, _creationTime, ...slideData } = slide;
          // 現在のユーザーをcreatedByに設定
          slideData.createdBy = currentUserId;
          
          await ctx.db.insert("slideshowSlides", slideData);
          stats.slideshowSlides.imported++;
        } catch (error) {
          console.error("Error importing slideshow slide:", error);
          stats.slideshowSlides.skipped++;
        }
      }
    }

    // FAQデータのインポート
    if (data.faqItems && Array.isArray(data.faqItems)) {
      for (const faq of data.faqItems) {
        try {
          if (skipDuplicates) {
            const existing = await ctx.db
              .query("faqItems")
              .filter((q) => q.eq(q.field("question"), faq.question))
              .first();
            
            if (existing) {
              stats.faqItems.skipped++;
              continue;
            }
          }

          const { _id, _creationTime, ...faqData } = faq;
          // 現在のユーザーをcreatedByに設定
          faqData.createdBy = currentUserId;
          if (!faqData.createdAt) {
            faqData.createdAt = Date.now();
          }
          
          await ctx.db.insert("faqItems", faqData);
          stats.faqItems.imported++;
        } catch (error) {
          console.error("Error importing FAQ item:", error);
          stats.faqItems.skipped++;
        }
      }
    }

    // お問い合わせデータのインポート
    if (data.contactMessages && Array.isArray(data.contactMessages)) {
      for (const contact of data.contactMessages) {
        try {
          const { _id, _creationTime, ...contactData } = contact;
          await ctx.db.insert("contactMessages", contactData);
          stats.contactMessages.imported++;
        } catch (error) {
          console.error("Error importing contact message:", error);
          stats.contactMessages.skipped++;
        }
      }
    }

    // ユーザー属性データのインポート
    if (data.userDemographics && Array.isArray(data.userDemographics)) {
      for (const demographic of data.userDemographics) {
        try {
          const { _id, _creationTime, ...demographicData } = demographic;
          await ctx.db.insert("userDemographics", demographicData);
          stats.userDemographics.imported++;
        } catch (error) {
          console.error("Error importing user demographic:", error);
          stats.userDemographics.skipped++;
        }
      }
    }

    // いいねデータのインポート（最後に実行）
    if (data.likes && Array.isArray(data.likes)) {
      for (const like of data.likes) {
        try {
          // 質問IDの関連付けを確認
          let questionId = like.questionId;
          if (questionId && questionIdMap.has(questionId)) {
            questionId = questionIdMap.get(questionId);
          }
          
          // 質問が存在するかチェック
          if (questionId) {
            const question = await ctx.db.get(questionId);
            if (question) {
              const { _id, _creationTime, ...likeData } = like;
              likeData.questionId = questionId;
              await ctx.db.insert("likes", likeData);
              stats.likes.imported++;
            } else {
              stats.likes.skipped++;
            }
          } else {
            stats.likes.skipped++;
          }
        } catch (error) {
          console.error("Error importing like:", error);
          stats.likes.skipped++;
        }
      }
    }

    return stats;
  },
});
