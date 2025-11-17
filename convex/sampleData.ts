import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 既存データをチェック
    const existingMembers = await ctx.db.query("councilMembers").collect();
    if (existingMembers.length > 0) {
      return { message: "データは既に存在します" };
    }

    // サンプル議員データ
    const sampleMembers = [
      {
        name: "田中 太郎",
        party: "市民の会",
        position: "議長",
        politicalParty: "無所属",
        electionCount: 3,
        committee: "総務委員会",
        address: "三原市本町1-1-1",
        phone: "0848-64-0001",
        email: "tanaka@example.com",
        website: "https://tanaka-example.com",
        bio: "市民の皆様の声を市政に反映させるため、日々活動しています。",
        termStart: new Date("2023-04-01").getTime(),
        isActive: true,
      },
      {
        name: "佐藤 花子",
        party: "みらい三原",
        position: "副議長",
        politicalParty: "無所属",
        electionCount: 2,
        committee: "文教厚生委員会",
        address: "三原市城町2-2-2",
        phone: "0848-64-0002",
        email: "sato@example.com",
        bio: "子育て支援と教育環境の充実に力を入れています。",
        termStart: new Date("2023-04-01").getTime(),
        isActive: true,
      },
      {
        name: "鈴木 一郎",
        party: "市民の会",
        politicalParty: "無所属",
        electionCount: 1,
        committee: "産業建設委員会",
        address: "三原市港町3-3-3",
        phone: "0848-64-0003",
        email: "suzuki@example.com",
        bio: "地域経済の活性化と雇用創出に取り組んでいます。",
        termStart: new Date("2023-04-01").getTime(),
        isActive: true,
      },
      {
        name: "高橋 美咲",
        party: "みらい三原",
        politicalParty: "無所属",
        electionCount: 1,
        committee: "総務委員会",
        address: "三原市宮浦4-4-4",
        phone: "0848-64-0004",
        email: "takahashi@example.com",
        bio: "女性の社会参画と働きやすい環境づくりを推進しています。",
        termStart: new Date("2023-04-01").getTime(),
        isActive: true,
      },
      {
        name: "山田 健二",
        party: "無所属",
        politicalParty: "無所属",
        electionCount: 4,
        committee: "文教厚生委員会",
        address: "三原市久井町5-5-5",
        phone: "0848-64-0005",
        email: "yamada@example.com",
        bio: "高齢者福祉と医療体制の充実に尽力しています。",
        termStart: new Date("2023-04-01").getTime(),
        isActive: true,
      },
    ];

    // 議員データを挿入
    const memberIds = [];
    for (const member of sampleMembers) {
      const id = await ctx.db.insert("councilMembers", member);
      memberIds.push(id);
    }

    // サンプル質問データ
    const sampleQuestions = [
      {
        title: "子育て支援センターの拡充について",
        content: "現在の子育て支援センターの利用状況と、今後の拡充計画についてお聞かせください。特に待機児童解消に向けた具体的な取り組みはありますか？",
        category: "子育て・少子化",
        councilMemberId: memberIds[1],
        sessionDate: new Date("2024-03-15").getTime(),
        sessionNumber: "令和6年第1回定例会",
        status: "answered" as const,
      },
      {
        title: "市内道路の整備計画について",
        content: "市内の主要道路における渋滞緩和と安全対策について、今年度の整備計画をお聞かせください。",
        category: "都市計画・建設",
        councilMemberId: memberIds[2],
        sessionDate: new Date("2024-03-10").getTime(),
        sessionNumber: "令和6年第1回定例会",
        status: "pending" as const,
      },
      {
        title: "高齢者の医療体制について",
        content: "高齢化が進む中で、市内の医療体制の現状と課題、今後の対策についてお聞かせください。",
        category: "医療・保健",
        councilMemberId: memberIds[4],
        sessionDate: new Date("2024-02-20").getTime(),
        sessionNumber: "令和6年第1回定例会",
        status: "answered" as const,
      },
      {
        title: "観光振興策について",
        content: "三原市の観光資源を活用した地域活性化について、具体的な取り組みをお聞かせください。",
        category: "観光・地域振興",
        councilMemberId: memberIds[0],
        sessionDate: new Date("2024-02-15").getTime(),
        sessionNumber: "令和6年第1回定例会",
        status: "answered" as const,
      },
      {
        title: "学校教育環境の改善について",
        content: "市内小中学校の教育環境改善について、ICT教育の推進状況と今後の計画をお聞かせください。",
        category: "教育・文化",
        councilMemberId: memberIds[3],
        sessionDate: new Date("2024-01-25").getTime(),
        sessionNumber: "令和5年第4回定例会",
        status: "pending" as const,
      },
    ];

    // 質問データを挿入
    const questionIds = [];
    for (const question of sampleQuestions) {
      const id = await ctx.db.insert("questions", question);
      questionIds.push(id);
    }

    // サンプル回答データ
    const sampleResponses = [
      {
        questionId: questionIds[0],
        content: "現在、市内には3箇所の子育て支援センターがあり、月平均約500組の親子にご利用いただいています。来年度は新たに1箇所の開設を予定しており、待機児童解消に向けて保育士の確保と施設整備を進めてまいります。",
        respondentTitle: "子育て支援課長",
        department: "健康福祉部",
        responseDate: new Date("2024-03-16").getTime(),
      },
      {
        questionId: questionIds[2],
        content: "市内には現在、総合病院1箇所、診療所15箇所があります。高齢化率の上昇に対応するため、在宅医療の充実と医療従事者の確保に取り組んでおり、来年度は訪問看護ステーションの拡充を予定しています。",
        respondentTitle: "健康推進課長",
        department: "健康福祉部",
        responseDate: new Date("2024-02-21").getTime(),
      },
      {
        questionId: questionIds[3],
        content: "三原市では、歴史的な城跡や瀬戸内海の美しい景観を活用した観光振興に取り組んでいます。今年度は観光アプリの開発と、地域の特産品を活用したグルメツーリズムの推進を行っています。",
        respondentTitle: "観光課長",
        department: "産業振興部",
        responseDate: new Date("2024-02-16").getTime(),
      },
    ];

    // 回答データを挿入
    for (const response of sampleResponses) {
      await ctx.db.insert("responses", response);
    }

    // サンプルニュースデータ
    const sampleNews = [
      {
        title: "令和6年第2回定例会の開催について",
        content: "令和6年第2回定例会を6月10日から6月28日まで開催いたします。一般質問の受付は5月20日までとなっております。",
        category: "議会情報",
        publishDate: new Date("2024-05-01").getTime(),
        isPublished: true,
        authorId: userId,
      },
      {
        title: "市政報告会の開催について",
        content: "市民の皆様に議会活動をご報告する市政報告会を、5月15日に市民会館で開催いたします。どなたでもご参加いただけます。",
        category: "イベント",
        publishDate: new Date("2024-04-20").getTime(),
        isPublished: true,
        authorId: userId,
      },
      {
        title: "議会だよりの発行について",
        content: "議会だより第45号を発行いたしました。市内全戸に配布予定です。ホームページでもご覧いただけます。",
        category: "広報",
        publishDate: new Date("2024-04-10").getTime(),
        isPublished: true,
        authorId: userId,
      },
    ];

    // ニュースデータを挿入
    for (const news of sampleNews) {
      await ctx.db.insert("news", news);
    }

    return { 
      message: "サンプルデータを正常に作成しました",
      members: memberIds.length,
      questions: questionIds.length,
      responses: sampleResponses.length,
      news: sampleNews.length,
    };
  },
});
