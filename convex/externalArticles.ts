import { query, mutation, internalMutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

// 外部記事一覧を取得（最新順にソート）
export const list = query({
  args: {
    category: v.optional(v.string()),
    councilMemberId: v.optional(v.id("councilMembers")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("externalArticles").withIndex("by_active", (q) => q.eq("isActive", true));

    if (args.category && args.category !== "all") {
      query = ctx.db.query("externalArticles").withIndex("by_category", (q) => q.eq("category", args.category as any));
    }

    if (args.councilMemberId) {
      query = ctx.db.query("externalArticles").withIndex("by_council_member", (q) => q.eq("councilMemberId", args.councilMemberId!));
    }

    // 最新順（publishedAt降順）でソート
    const articles = await query
      .order("desc")
      .take(args.limit || 20);

    // publishedAtでさらにソート（念のため）
    const sortedArticles = articles.sort((a, b) => b.publishedAt - a.publishedAt);

    // 議員情報を含めて返す
    const articlesWithMembers = await Promise.all(
      sortedArticles.map(async (article) => {
        const member = await ctx.db.get(article.councilMemberId);
        const source = await ctx.db.get(article.sourceId);
        
        // 議員の写真URLを取得
        let memberPhotoUrl = null;
        if (member?.photoId) {
          memberPhotoUrl = await ctx.storage.getUrl(member.photoId);
        } else if (member?.photoUrl) {
          memberPhotoUrl = member.photoUrl;
        }
        
        return {
          ...article,
          councilMember: member ? {
            ...member,
            memberPhotoUrl,
            photoUrl: memberPhotoUrl || member.photoUrl, // 両方のフィールドを提供
          } : null,
          source: source,
        };
      })
    );

    return articlesWithMembers;
  },
});

// カテゴリー別記事数を取得
export const getCategoryCounts = query({
  args: {},
  handler: async (ctx) => {
    const articles = await ctx.db.query("externalArticles")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // カテゴリー名をASCII文字に変換するマッピング
    const categoryMapping: Record<string, string> = {
      "政策・提案": "policy",
      "活動報告": "activity",
      "市政情報": "municipal",
      "地域イベント": "event",
      "お知らせ": "notice",
      "その他": "other"
    };

    const counts = articles.reduce((acc, article) => {
      const key = categoryMapping[article.category] || "other";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      all: articles.length,
      policy: counts.policy || 0,
      activity: counts.activity || 0,
      municipal: counts.municipal || 0,
      event: counts.event || 0,
      notice: counts.notice || 0,
      other: counts.other || 0,
    };
  },
});

// 特定の記事を取得
export const getById = query({
  args: { id: v.id("externalArticles") },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.id);
    if (!article) return null;

    const member = await ctx.db.get(article.councilMemberId);
    const source = await ctx.db.get(article.sourceId);

    // 議員の写真URLを取得
    let memberPhotoUrl = null;
    if (member?.photoId) {
      memberPhotoUrl = await ctx.storage.getUrl(member.photoId);
    } else if (member?.photoUrl) {
      memberPhotoUrl = member.photoUrl;
    }

    return {
      ...article,
      councilMember: member ? {
        ...member,
        memberPhotoUrl,
        photoUrl: memberPhotoUrl || member.photoUrl, // 両方のフィールドを提供
      } : null,
      source: source,
    };
  },
});

// 記事の閲覧数を増加
export const incrementViewCount = mutation({
  args: { id: v.id("externalArticles") },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.id);
    if (!article) return;

    await ctx.db.patch(args.id, {
      viewCount: (article.viewCount || 0) + 1,
    });
  },
});

// 外部ソースを追加（管理者のみ）
export const addExternalSource = mutation({
  args: {
    councilMemberId: v.id("councilMembers"),
    sourceType: v.union(
      v.literal("blog"),
      v.literal("facebook"),
      v.literal("twitter"),
      v.literal("instagram"),
      v.literal("rss")
    ),
    sourceUrl: v.string(),
    sourceName: v.optional(v.string()),
    fetchInterval: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 管理者権限チェック
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser) {
      throw new Error("管理者権限が必要です");
    }

    return await ctx.db.insert("externalSources", {
      councilMemberId: args.councilMemberId,
      sourceType: args.sourceType,
      sourceUrl: args.sourceUrl,
      sourceName: args.sourceName,
      isActive: true,
      fetchInterval: args.fetchInterval || 60, // デフォルト60分
      createdBy: userId,
      createdAt: Date.now(),
    });
  },
});

// 外部ソースを更新（管理者のみ）
export const updateExternalSource = mutation({
  args: {
    id: v.id("externalSources"),
    councilMemberId: v.optional(v.id("councilMembers")),
    sourceType: v.optional(v.union(
      v.literal("blog"),
      v.literal("facebook"),
      v.literal("twitter"),
      v.literal("instagram"),
      v.literal("rss")
    )),
    sourceUrl: v.optional(v.string()),
    sourceName: v.optional(v.string()),
    fetchInterval: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 管理者権限チェック
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser) {
      throw new Error("管理者権限が必要です");
    }

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(id, filteredUpdates);
  },
});

// 外部ソースを削除（管理者のみ）
export const deleteExternalSource = mutation({
  args: { id: v.id("externalSources") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 管理者権限チェック
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser) {
      throw new Error("管理者権限が必要です");
    }

    // 関連する記事も削除するかどうかは要検討
    // ここでは記事は残して、ソースのみ削除
    await ctx.db.delete(args.id);
  },
});

// 外部記事を手動追加（管理者のみ）
export const addExternalArticle = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    excerpt: v.optional(v.string()),
    originalUrl: v.string(),
    imageUrl: v.optional(v.string()),
    publishedAt: v.number(),
    councilMemberId: v.id("councilMembers"),
    sourceId: v.id("externalSources"),
    category: v.union(
      v.literal("政策・提案"),
      v.literal("活動報告"),
      v.literal("市政情報"),
      v.literal("地域イベント"),
      v.literal("お知らせ"),
      v.literal("その他")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 管理者権限チェック
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser) {
      throw new Error("管理者権限が必要です");
    }

    const source = await ctx.db.get(args.sourceId);
    if (!source) {
      throw new Error("ソースが見つかりません");
    }

    return await ctx.db.insert("externalArticles", {
      title: args.title,
      content: args.content,
      excerpt: args.excerpt,
      sourceUrl: source.sourceUrl,
      originalUrl: args.originalUrl,
      imageUrl: args.imageUrl,
      publishedAt: args.publishedAt,
      fetchedAt: Date.now(),
      councilMemberId: args.councilMemberId,
      sourceId: args.sourceId,
      sourceType: source.sourceType,
      category: args.category,
      isActive: true,
      viewCount: 0,
    });
  },
});

// 外部記事を更新（管理者のみ）
export const updateExternalArticle = mutation({
  args: {
    id: v.id("externalArticles"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    originalUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    category: v.optional(v.union(
      v.literal("政策・提案"),
      v.literal("活動報告"),
      v.literal("市政情報"),
      v.literal("地域イベント"),
      v.literal("お知らせ"),
      v.literal("その他")
    )),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 管理者権限チェック
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser) {
      throw new Error("管理者権限が必要です");
    }

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(id, filteredUpdates);
  },
});

// 外部記事を削除（管理者のみ）
export const deleteExternalArticle = mutation({
  args: { id: v.id("externalArticles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 管理者権限チェック
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser) {
      throw new Error("管理者権限が必要です");
    }

    await ctx.db.delete(args.id);
  },
});

// 外部ソース一覧を取得（管理者のみ）
export const listSources = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // 管理者権限チェック
    const adminUser = await ctx.db
      .query("adminUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!adminUser) return [];

    const sources = await ctx.db.query("externalSources").collect();

    // 議員情報を含めて返す
    const sourcesWithMembers = await Promise.all(
      sources.map(async (source) => {
        const member = await ctx.db.get(source.councilMemberId);
        return {
          ...source,
          councilMember: member,
        };
      })
    );

    return sourcesWithMembers;
  },
});

// 人気記事を取得（最新順でソート）
export const getPopularArticles = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const articles = await ctx.db.query("externalArticles")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // 閲覧数でソートしてから最新順でソート
    const sortedArticles = articles
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, args.limit || 10);

    // 議員情報を含めて返す
    const articlesWithMembers = await Promise.all(
      sortedArticles.map(async (article) => {
        const member = await ctx.db.get(article.councilMemberId);
        const source = await ctx.db.get(article.sourceId);
        
        // 議員の写真URLを取得
        let memberPhotoUrl = null;
        if (member?.photoId) {
          memberPhotoUrl = await ctx.storage.getUrl(member.photoId);
        } else if (member?.photoUrl) {
          memberPhotoUrl = member.photoUrl;
        }
        
        return {
          ...article,
          councilMember: member ? {
            ...member,
            memberPhotoUrl,
            photoUrl: memberPhotoUrl || member.photoUrl, // 両方のフィールドを提供
          } : null,
          source: source,
        };
      })
    );

    return articlesWithMembers;
  },
});

// 最新記事を取得（publishedAt順でソート）
export const getLatestArticles = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const articles = await ctx.db.query("externalArticles")
      .withIndex("by_published_at")
      .order("desc")
      .take(args.limit || 10);

    // 議員情報を含めて返す
    const articlesWithMembers = await Promise.all(
      articles.map(async (article) => {
        const member = await ctx.db.get(article.councilMemberId);
        const source = await ctx.db.get(article.sourceId);
        
        // 議員の写真URLを取得
        let memberPhotoUrl = null;
        if (member?.photoId) {
          memberPhotoUrl = await ctx.storage.getUrl(member.photoId);
        } else if (member?.photoUrl) {
          memberPhotoUrl = member.photoUrl;
        }
        
        return {
          ...article,
          councilMember: member ? {
            ...member,
            memberPhotoUrl,
            photoUrl: memberPhotoUrl || member.photoUrl, // 両方のフィールドを提供
          } : null,
          source: source,
        };
      })
    );

    return articlesWithMembers;
  },
});

// RSS/ブログフィードをテストする（管理者のみ）
export const testFeedUrl = action({
  args: { 
    url: v.string(),
    sourceType: v.union(
      v.literal("blog"),
      v.literal("facebook"),
      v.literal("twitter"),
      v.literal("instagram"),
      v.literal("rss")
    )
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 管理者権限チェック
    const adminUser = await ctx.runQuery(api.admin.isAdmin);
    if (!adminUser) {
      throw new Error("管理者権限が必要です");
    }

    try {
      console.log(`Testing feed URL: ${args.url}`);
      
      const response = await fetch(args.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GIIIN-Bot/1.0)',
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/html',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      
      console.log(`Response content type: ${contentType}`);
      console.log(`Response length: ${text.length}`);

      // XMLかHTMLかを判定
      const isXML = contentType.includes('xml') || contentType.includes('rss') || contentType.includes('atom');
      const isHTML = contentType.includes('html') || text.includes('<!DOCTYPE html>') || text.includes('<html');

      let articles = [];

      if (isXML || text.includes('<rss') || text.includes('<feed')) {
        // RSS/Atomフィードの解析
        articles = parseRSSFeed(text);
      } else if (isHTML) {
        // HTMLページの解析（ブログなど）
        articles = parseHTMLPage(text, args.url);
      } else {
        throw new Error('サポートされていないコンテンツタイプです');
      }

      return {
        success: true,
        message: `${articles.length}件の記事を取得しました`,
        articles: articles.slice(0, 5), // 最初の5件のみ返す
        totalCount: articles.length,
        contentType,
        isXML,
        isHTML,
      };

    } catch (error) {
      console.error('Feed test error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '不明なエラーが発生しました',
        articles: [],
        totalCount: 0,
      };
    }
  },
});

// 特定のソースから記事を手動取得（管理者のみ）
export const fetchFromSource = action({
  args: { sourceId: v.id("externalSources") },
  handler: async (ctx, args): Promise<{
    success: boolean;
    message: string;
    totalFound: number;
    newArticles: number;
    savedCount: number;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 管理者権限チェック
    const adminUser = await ctx.runQuery(api.admin.isAdmin);
    if (!adminUser) {
      throw new Error("管理者権限が必要です");
    }

    const source = await ctx.runQuery(api.externalArticles.getSourceById, { id: args.sourceId });
    if (!source) {
      throw new Error("ソースが見つかりません");
    }

    try {
      console.log(`Fetching from source: ${source.sourceUrl}`);
      
      const response = await fetch(source.sourceUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GIIIN-Bot/1.0)',
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/html',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      
      // XMLかHTMLかを判定
      const isXML = contentType.includes('xml') || contentType.includes('rss') || contentType.includes('atom');
      
      let articles = [];

      if (isXML || text.includes('<rss') || text.includes('<feed')) {
        // RSS/Atomフィードの解析
        articles = parseRSSFeed(text);
      } else {
        // HTMLページの解析（ブログなど）
        articles = parseHTMLPage(text, source.sourceUrl);
      }

      // 既存の記事と重複チェック
      const existingArticles: any[] = await ctx.runQuery(api.externalArticles.getBySourceId, { sourceId: args.sourceId });
      const existingUrls: Set<string> = new Set(existingArticles.map((a: any) => a.originalUrl));

      // 新しい記事のみをフィルタリング
      const newArticles: any[] = articles.filter(article => !existingUrls.has(article.url));

      // 新しい記事をデータベースに保存
      let savedCount = 0;
      for (const article of newArticles.slice(0, 10)) { // 最大10件まで
        try {
          await ctx.runMutation(internal.externalArticles.saveArticleFromFeed, {
            sourceId: args.sourceId,
            councilMemberId: source.councilMemberId,
            title: article.title,
            content: article.content || article.description || '',
            excerpt: article.description?.substring(0, 200),
            originalUrl: article.url,
            imageUrl: article.image,
            publishedAt: article.publishedAt,
            sourceType: source.sourceType,
          });
          savedCount++;
        } catch (error) {
          console.error(`Failed to save article: ${article.title}`, error);
        }
      }

      // 最終取得時刻を更新
      await ctx.runMutation(internal.externalArticles.updateLastFetched, { sourceId: args.sourceId });

      return {
        success: true,
        message: `${savedCount}件の新しい記事を取得しました（全${articles.length}件中）`,
        totalFound: articles.length,
        newArticles: newArticles.length,
        savedCount,
      };

    } catch (error) {
      console.error('Fetch error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '記事の取得に失敗しました',
        totalFound: 0,
        newArticles: 0,
        savedCount: 0,
      };
    }
  },
});

// ソースIDで記事を取得
export const getBySourceId = query({
  args: { sourceId: v.id("externalSources") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("externalArticles")
      .withIndex("by_source_id", (q) => q.eq("sourceId", args.sourceId))
      .collect();
  },
});

// ソースを取得
export const getSourceById = query({
  args: { id: v.id("externalSources") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// フィードから取得した記事を保存（fetchFromSource アクション内部からのみ呼び出す）
export const saveArticleFromFeed = internalMutation({
  args: {
    sourceId: v.id("externalSources"),
    councilMemberId: v.id("councilMembers"),
    title: v.string(),
    content: v.string(),
    excerpt: v.optional(v.string()),
    originalUrl: v.string(),
    imageUrl: v.optional(v.string()),
    publishedAt: v.number(),
    sourceType: v.union(
      v.literal("blog"),
      v.literal("facebook"),
      v.literal("twitter"),
      v.literal("instagram"),
      v.literal("rss")
    ),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceId);
    if (!source) {
      throw new Error("ソースが見つかりません");
    }

    // カテゴリーを自動判定（簡易版）
    let category: "政策・提案" | "活動報告" | "市政情報" | "地域イベント" | "お知らせ" | "その他" = "その他";
    
    const title = args.title.toLowerCase();
    const content = args.content.toLowerCase();
    
    if (title.includes('政策') || title.includes('提案') || content.includes('政策')) {
      category = "政策・提案";
    } else if (title.includes('活動') || title.includes('報告') || content.includes('活動')) {
      category = "活動報告";
    } else if (title.includes('市政') || title.includes('議会') || content.includes('市政')) {
      category = "市政情報";
    } else if (title.includes('イベント') || title.includes('催し') || content.includes('イベント')) {
      category = "地域イベント";
    } else if (title.includes('お知らせ') || title.includes('案内') || content.includes('お知らせ')) {
      category = "お知らせ";
    }

    return await ctx.db.insert("externalArticles", {
      title: args.title,
      content: args.content,
      excerpt: args.excerpt,
      sourceUrl: source.sourceUrl,
      originalUrl: args.originalUrl,
      imageUrl: args.imageUrl,
      publishedAt: args.publishedAt,
      fetchedAt: Date.now(),
      councilMemberId: args.councilMemberId,
      sourceId: args.sourceId,
      sourceType: args.sourceType,
      category,
      isActive: true,
      viewCount: 0,
    });
  },
});

// 最終取得時刻を更新（fetchFromSource アクション内部からのみ呼び出す）
export const updateLastFetched = internalMutation({
  args: { sourceId: v.id("externalSources") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sourceId, {
      lastFetchedAt: Date.now(),
    });
  },
});

// RSS/Atomフィードを解析する関数
function parseRSSFeed(xmlText: string) {
  const articles = [];
  
  try {
    // 簡易的なXML解析（実際のプロダクションではより堅牢なパーサーを使用）
    const items = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || 
                  xmlText.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) || [];
    
    for (const item of items.slice(0, 20)) { // 最大20件
      const title = extractXMLContent(item, 'title') || 'タイトルなし';
      const description = extractXMLContent(item, 'description') || 
                         extractXMLContent(item, 'summary') || 
                         extractXMLContent(item, 'content') || '';
      const link = extractXMLContent(item, 'link') || 
                   extractXMLAttribute(item, 'link', 'href') || '';
      const pubDate = extractXMLContent(item, 'pubDate') || 
                     extractXMLContent(item, 'published') || 
                     extractXMLContent(item, 'updated') || 
                     extractXMLContent(item, 'dc:date') ||
                     extractXMLContent(item, 'date') || '';
      
      // 画像URLを抽出
      let imageUrl = '';
      const enclosure = item.match(/<enclosure[^>]*type="image[^"]*"[^>]*url="([^"]*)"[^>]*>/i);
      if (enclosure) {
        imageUrl = enclosure[1];
      } else {
        const mediaContent = item.match(/<media:content[^>]*url="([^"]*)"[^>]*>/i);
        if (mediaContent) {
          imageUrl = mediaContent[1];
        }
      }

      let publishedAt = Date.now();
      if (pubDate) {
        console.log(`Parsing date: "${pubDate}"`);
        const parsedDate = parseDateString(pubDate);
        if (parsedDate) {
          publishedAt = parsedDate.getTime();
          console.log(`Successfully parsed date: ${new Date(publishedAt).toISOString()}`);
        } else {
          console.log(`Failed to parse date: "${pubDate}", using current time`);
        }
      }
      
      if (title && link) {
        articles.push({
          title: cleanText(title),
          description: cleanText(description),
          content: cleanText(description),
          url: link,
          image: imageUrl,
          publishedAt,
        });
      }
    }
  } catch (error) {
    console.error('RSS parsing error:', error);
  }
  
  return articles;
}

// HTMLページを解析する関数（ブログなど）
function parseHTMLPage(htmlText: string, baseUrl: string) {
  const articles = [];
  
  try {
    // 記事のリンクを抽出（一般的なパターン）
    const linkPatterns = [
      /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi,
      /<h[1-6][^>]*><a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a><\/h[1-6]>/gi,
    ];
    
    const foundLinks = new Set();
    
    for (const pattern of linkPatterns) {
      let match;
      while ((match = pattern.exec(htmlText)) !== null && articles.length < 10) {
        const url = match[1];
        const title = match[2];
        
        // 相対URLを絶対URLに変換
        const fullUrl = url.startsWith('http') ? url : new URL(url, baseUrl).href;
        
        if (!foundLinks.has(fullUrl) && title.trim() && 
            !url.includes('#') && !url.includes('javascript:') &&
            (url.includes('/') || url.includes('?'))) {
          
          foundLinks.add(fullUrl);
          articles.push({
            title: cleanText(title),
            description: '',
            content: '',
            url: fullUrl,
            image: '',
            publishedAt: Date.now(), // HTMLページでは日付取得が困難なため現在時刻を使用
          });
        }
      }
    }
  } catch (error) {
    console.error('HTML parsing error:', error);
  }
  
  return articles;
}

// XMLコンテンツを抽出
function extractXMLContent(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

// XML属性を抽出
function extractXMLAttribute(xml: string, tagName: string, attrName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*${attrName}="([^"]*)"[^>]*>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

// テキストをクリーンアップ
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // HTMLタグを除去
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// 日付文字列を解析する関数
function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  try {
    // まず標準的なDate()コンストラクタで試す
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // 日本語形式（例: "2023年12月25日"）
    const jpMatch = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (jpMatch) {
      const year = parseInt(jpMatch[1]);
      const month = parseInt(jpMatch[2]) - 1;
      const day = parseInt(jpMatch[3]);
      date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error parsing date "${dateStr}":`, error);
    return null;
  }
}
