import { mutation } from "./_generated/server";
import { v } from "convex/values";

// FAQのサンプルデータを作成する関数
export const createSampleFAQs = mutation({
  args: {},
  handler: async (ctx) => {
    // 既存のFAQデータをチェック
    const existingFaqs = await ctx.db.query("faqItems").collect();
    if (existingFaqs.length > 0) {
      return { message: "FAQデータは既に存在します" };
    }

    // システム管理者として作成（実際の管理者IDが必要な場合は調整）
    const adminUsers = await ctx.db.query("adminUsers").collect();
    const adminUserId = adminUsers[0]?.userId;
    
    if (!adminUserId) {
      throw new Error("管理者ユーザーが見つかりません");
    }

    const now = Date.now();

    const sampleFaqs = [
      // サイトについて
      {
        question: "GIIIN/ギイーンとは何ですか？",
        answer: "GIIIN/ギイーンは、三原市議会の議員活動を市民の皆様にわかりやすく見える化するためのWebサイトです。議員の質問・回答、活動実績、統計情報などを整理して提供し、市政への関心と理解を深めることを目的としています。",
        category: "サイトについて",
        order: 1,
        isPublished: true,
        createdBy: adminUserId,
        createdAt: now,
      },
      {
        question: "このサイトは三原市公式ですか？",
        answer: "いいえ、GIIIN/ギイーンは三原市非公認のサイトです。市民有志によって運営されており、三原市や三原市議会とは直接の関係はありません。掲載されている情報は三原市議会の公式データを基にしていますが、最新・正確な情報については必ず三原市議会の公式サイトをご確認ください。",
        category: "サイトについて",
        order: 2,
        isPublished: true,
        createdBy: adminUserId,
        createdAt: now,
      },
      {
        question: "利用料金はかかりますか？",
        answer: "GIIIN/ギイーンは完全無料でご利用いただけます。会員登録も無料で、追加料金は一切発生しません。",
        category: "サイトについて",
        order: 3,
        isPublished: true,
        createdBy: adminUserId,
        createdAt: now,
      },

      // 機能について
      {
        question: "議員の質問・回答はどこで見ることができますか？",
        answer: "トップページの「質問・回答」タブから、または各議員の詳細ページから質問・回答を閲覧できます。議員別、カテゴリ別、日付別での絞り込み検索も可能です。",
        category: "機能について",
        order: 1,
        isPublished: true,
        createdBy: adminUserId,
        createdAt: now,
      },
      {
        question: "統計情報では何が分かりますか？",
        answer: "統計情報ページでは、議員の質問回数ランキング、カテゴリ別の質問数、回答率などの様々な統計データを確認できます。これにより各議員の活動状況を客観的に把握することができます。",
        category: "機能について",
        order: 2,
        isPublished: true,
        createdBy: adminUserId,
        createdAt: now,
      },
      {
        question: "「いいね」機能は何のためにありますか？",
        answer: "「いいね」機能は、市民の皆様が関心のある質問や重要だと思う質問に対して評価を表明できる機能です。多くの「いいね」を集めた質問は、市民の関心が高い課題として可視化されます。",
        category: "機能について",
        order: 3,
        isPublished: true,
        createdBy: adminUserId,
        createdAt: now,
      },

      // アカウント・ログイン
      {
        question: "会員登録は必要ですか？",
        answer: "基本的な閲覧機能は会員登録なしでご利用いただけます。ただし、「いいね」機能やお問い合わせ機能を利用する場合は、会員登録（無料）が必要です。",
        category: "アカウント・ログイン",
        order: 1,
        isPublished: true,
        createdBy: adminUserId,
        createdAt: now,
      },
      {
        question: "メール認証は必要ですか？",
        answer: "会員登録後、メールアドレスの認証をお願いしています。認証により、パスワードリセットやお知らせの受信が可能になります。認証は任意ですが、セキュリティ向上のため推奨しています。",
        category: "アカウント・ログイン",
        order: 2,
        isPublished: true,
        createdBy: adminUserId,
        createdAt: now,
      },
      {
        question: "パスワードを忘れた場合はどうすればよいですか？",
        answer: "ログイン画面の「パスワードを忘れた方」リンクから、パスワードリセット手続きを行えます。登録されたメールアドレスにリセット用のリンクが送信されます。",
        category: "アカウント・ログイン",
        order: 3,
        isPublished: true,
        createdBy: adminUserId,
        createdAt: now,
      },

      // データについて
      {
        question: "議員情報や議事録データはどこから取得していますか？",
        answer: "議員情報や議事録データは、三原市議会の公式サイトから取得しています。データの著作権は三原市に帰属します。定期的に最新情報への更新を行っていますが、リアルタイムではありません。",
        category: "データについて",
        order: 1,
        isPublished: true,
        createdBy: adminUserId,
        createdAt: now,
      },
      {
        question: "データの更新頻度はどのくらいですか？",
        answer: "議事録データは議会終了後、通常1〜2週間程度で更新されます。議員情報は選挙後や役職変更時に更新されます。お知らせページで最新の更新情報をお知らせしています。",
        category: "データについて",
        order: 2,
        isPublished: true,
        createdBy: adminUserId,
        createdAt: now,
      },
      {
        question: "データに間違いを見つけた場合はどうすればよいですか？",
        answer: "データに誤りを発見された場合は、お問い合わせページからご連絡ください。確認の上、必要に応じて修正いたします。ただし、公式データとの整合性を保つため、三原市議会の公式情報を基準として対応いたします。",
        category: "データについて",
        order: 3,
        isPublished: true,
        createdBy: adminUserId,
        createdAt: now,
      },

      // 技術・トラブル
      {
        question: "スマートフォンでも利用できますか？",
        answer: "はい、GIIIN/ギイーンはスマートフォン・タブレット・パソコンなど、様々なデバイスでご利用いただけるレスポンシブデザインを採用しています。",
        category: "技術・トラブル",
        order: 1,
        isPublished: true,
        createdBy: adminUserId,
        createdAt: now,
      },
      {
        question: "推奨ブラウザはありますか？",
        answer: "Chrome、Firefox、Safari、Edgeの最新版を推奨しています。古いブラウザでは一部機能が正常に動作しない場合があります。",
        category: "技術・トラブル",
        order: 2,
        isPublished: true,
        createdBy: adminUserId,
        createdAt: now,
      },
      {
        question: "ページが正常に表示されない場合はどうすればよいですか？",
        answer: "ブラウザの再読み込み（F5キーまたはCtrl+R）をお試しください。それでも解決しない場合は、ブラウザのキャッシュクリアや、別のブラウザでのアクセスをお試しください。問題が続く場合はお問い合わせください。",
        category: "技術・トラブル",
        order: 3,
        isPublished: true,
        createdBy: adminUserId,
        createdAt: now,
      },
    ];

    // サンプルFAQを一括作成
    const results = [];
    for (const faq of sampleFaqs) {
      const result = await ctx.db.insert("faqItems", faq);
      results.push(result);
    }

    return { 
      message: `${results.length}件のサンプルFAQを作成しました`,
      createdIds: results 
    };
  },
});

// サンプルFAQを削除する関数（開発用）
export const deleteSampleFAQs = mutation({
  args: {},
  handler: async (ctx) => {
    const faqs = await ctx.db.query("faqItems").collect();
    
    for (const faq of faqs) {
      await ctx.db.delete(faq._id);
    }

    return { 
      message: `${faqs.length}件のFAQを削除しました` 
    };
  },
});
