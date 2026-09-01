import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ExternalArticlesProps {
  onArticleClick?: (articleId: Id<"externalArticles">) => void;
}

export function ExternalArticles({ onArticleClick }: ExternalArticlesProps) {
  const [selectedMember, setSelectedMember] = useState<Id<"councilMembers"> | null>(null);

  const articles = useQuery(api.externalArticles.list, {
    councilMemberId: selectedMember || undefined,
    limit: 50,
  });

  const councilMembers = useQuery(api.councilMembers.list, { activeOnly: true });

  const incrementViewCount = useMutation(api.externalArticles.incrementViewCount);

  const handleArticleClick = (article: any) => {
    incrementViewCount({ id: article._id });
    if (onArticleClick) {
      onArticleClick(article._id);
    } else {
      // 元記事のURLを新しいタブで開く
      window.open(article.originalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, '-');
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case "blog": return "📝";
      case "facebook": return "📘";
      case "twitter": return "🐦";
      case "instagram": return "📷";
      case "rss": return "📡";
      default: return "🔗";
    }
  };

  // 議員の顔写真を表示（memberPhotoUrlまたはphotoUrlを使用）
  const getMemberIcon = (member: any) => {
    const photoUrl = member?.memberPhotoUrl || member?.photoUrl;
    if (photoUrl) {
      return (
        <img
          src={photoUrl}
          alt={member.name}
          className="w-8 h-8 rounded-full object-cover border-2 border-purple-400/30"
          onError={(e) => {
            // 画像の読み込みに失敗した場合はデフォルトアイコンを表示
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const icons = ["👨‍💼", "👩‍💼", "🧑‍💼", "👨‍🏫", "👩‍🏫"];
              const iconIndex = member?.name ? member.name.charCodeAt(0) % icons.length : 0;
              parent.innerHTML = `<div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-lg border-2 border-purple-400/30">${icons[iconIndex]}</div>`;
            }
          }}
        />
      );
    }
    // デフォルトアイコン（性別や年代に基づいて変更可能）
    const icons = ["👨‍💼", "👩‍💼", "🧑‍💼", "👨‍🏫", "👩‍🏫"];
    const iconIndex = member?.name ? member.name.charCodeAt(0) % icons.length : 0;
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-lg border-2 border-purple-400/30">
        {icons[iconIndex]}
      </div>
    );
  };

  // タイトルを1行に収まるように省略
  const truncateTitle = (title: string, maxLength: number = 50) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + "...";
  };

  // 2週間以内の記事かどうかを判定
  const isRecentArticle = (publishedAt: number) => {
    const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
    return publishedAt > twoWeeksAgo;
  };

  if (!articles) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 amano-text-glow">記事を読み込み中...</p>
        </div>
      </div>
    );
  }

  // 記事を最新順にソート
  const sortedArticles = [...articles].sort((a, b) => b.publishedAt - a.publishedAt);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="text-center space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          📰 議員ブログ・SNS
        </h1>
        <p className="text-gray-300 text-sm sm:text-base">
          三原市議会議員の最新の活動報告やブログ記事をまとめて確認できます
        </p>
      </div>

      {/* 議員フィルター */}
      <div className="amano-bg-card rounded-xl p-4 amano-crystal-border">
        <h3 className="text-lg font-medium text-yellow-400 mb-3 amano-text-glow">議員で絞り込み</h3>
        <select
          value={selectedMember || ""}
          onChange={(e) => setSelectedMember(e.target.value ? e.target.value as Id<"councilMembers"> : null)}
          className="auth-input-field w-full sm:w-auto"
        >
          <option value="">すべての議員</option>
          {councilMembers?.map((member) => (
            <option key={member._id} value={member._id}>
              {member.name} ({member.politicalParty || "無所属"})
            </option>
          ))}
        </select>
      </div>

      {/* 記事一覧 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-yellow-400 amano-text-glow">
            📋 記事一覧
          </h2>
          <span className="text-sm text-gray-400">
            {sortedArticles.length}件の記事
          </span>
        </div>

        {sortedArticles.length === 0 ? (
          <div className="text-center py-12 amano-bg-card rounded-xl amano-crystal-border">
            <div className="text-6xl mb-4">📰</div>
            <h3 className="text-xl font-medium text-gray-300 mb-2">記事が見つかりません</h3>
            <p className="text-gray-400">
              選択した条件に該当する記事がありません。<br />
              フィルターを変更してお試しください。
            </p>
          </div>
        ) : (
          <div className="amano-bg-card rounded-xl amano-crystal-border">
            {/* 記事リスト */}
            <div className="space-y-2 p-4">
              {sortedArticles.map((article, index) => {
                const isRecent = isRecentArticle(article.publishedAt);
                return (
                  <div
                    key={article._id}
                    onClick={() => handleArticleClick(article)}
                    className={`group cursor-pointer flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02] animate-slideUp ${
                      isRecent 
                        ? "bg-gradient-to-r from-yellow-500/20 via-purple-500/20 to-cyan-400/20 border border-yellow-400/50 shadow-lg amano-card-glow hover:from-yellow-500/30 hover:via-purple-500/30 hover:to-cyan-400/30" 
                        : "amano-bg-glass hover:bg-gradient-to-r hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400"
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* NEW バッジ（2週間以内の記事） */}
                    {isRecent && (
                      <div className="flex-shrink-0">
                        <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                          NEW
                        </span>
                      </div>
                    )}

                    {/* 顔写真 */}
                    <div className="flex-shrink-0">
                      {getMemberIcon(article.councilMember)}
                    </div>

                    {/* 日付 */}
                    <span className={`text-sm font-mono min-w-[80px] ${
                      isRecent ? "text-yellow-300 font-bold" : "text-gray-400"
                    }`}>
                      {formatDate(article.publishedAt)}
                    </span>

                    {/* カテゴリーバッジ（モバイル用） */}
                    <div className="sm:hidden">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        isRecent 
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold"
                          : "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                      }`}>
                        {article.category}
                      </span>
                    </div>

                    {/* タイトル */}
                    <h3 className={`flex-1 font-medium transition-colors text-sm leading-tight ${
                      isRecent 
                        ? "text-yellow-200 font-bold group-hover:text-white" 
                        : "text-gray-200 group-hover:text-white"
                    }`}>
                      {truncateTitle(article.title, window.innerWidth < 640 ? 40 : 80)}
                    </h3>

                    {/* カテゴリーバッジ（デスクトップ用） */}
                    <div className="hidden sm:block">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        isRecent 
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold"
                          : "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                      }`}>
                        {article.category}
                      </span>
                    </div>

                    {/* 議員名・ソース・閲覧数 */}
                    <div className={`flex items-center space-x-2 text-sm min-w-[120px] justify-end ${
                      isRecent ? "text-yellow-300" : "text-gray-400"
                    }`}>
                      <span className="text-xs">{getSourceIcon(article.sourceType)}</span>
                      <span className="truncate max-w-[80px]">{article.councilMember?.name}</span>
                      <span className="text-xs">👁️{article.viewCount || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* もっと見るボタン（必要に応じて） */}
            {sortedArticles.length >= 50 && (
              <div className="p-4 text-center border-t border-gray-600">
                <button className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white px-6 py-2 rounded-lg font-medium hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105">
                  もっと見る
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
