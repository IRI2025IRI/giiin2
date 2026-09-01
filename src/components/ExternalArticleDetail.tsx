import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ExternalArticleDetailProps {
  articleId: Id<"externalArticles">;
  onBack: () => void;
}

export function ExternalArticleDetail({ articleId, onBack }: ExternalArticleDetailProps) {
  const article = useQuery(api.externalArticles.getById, { id: articleId });
  const incrementViewCount = useMutation(api.externalArticles.incrementViewCount);

  if (!article) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 amano-text-glow">記事を読み込み中...</p>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  // 議員の顔写真を表示
  const getMemberIcon = (member: any) => {
    const photoUrl = member?.memberPhotoUrl || member?.photoUrl;
    if (photoUrl) {
      return (
        <img
          src={photoUrl}
          alt={member.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-purple-400/30"
          onError={(e) => {
            // 画像の読み込みに失敗した場合はデフォルトアイコンを表示
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const icons = ["👨‍💼", "👩‍💼", "🧑‍💼", "👨‍🏫", "👩‍🏫"];
              const iconIndex = member?.name ? member.name.charCodeAt(0) % icons.length : 0;
              parent.innerHTML = `<div class="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl border-2 border-purple-400/30">${icons[iconIndex]}</div>`;
            }
          }}
        />
      );
    }
    // デフォルトアイコン
    const icons = ["👨‍💼", "👩‍💼", "🧑‍💼", "👨‍🏫", "👩‍🏫"];
    const iconIndex = member?.name ? member.name.charCodeAt(0) % icons.length : 0;
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl border-2 border-purple-400/30">
        {icons[iconIndex]}
      </div>
    );
  };

  const handleOpenOriginal = () => {
    incrementViewCount({ id: articleId });
    window.open(article.originalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* 戻るボタン */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-gray-300 hover:text-yellow-400 transition-colors"
      >
        <span>←</span>
        <span>記事一覧に戻る</span>
      </button>

      {/* 記事詳細 */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        {/* ヘッダー情報 */}
        <div className="flex items-start space-x-4 mb-6">
          <div className="flex-shrink-0">
            {getMemberIcon(article.councilMember)}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-lg font-medium text-gray-200">{article.councilMember?.name}</h2>
              <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm">
                {article.category}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>{getSourceIcon(article.sourceType)} {article.sourceType}</span>
              <span>📅 {formatDate(article.publishedAt)}</span>
              <span>👁️ {article.viewCount || 0} 回閲覧</span>
            </div>
          </div>
        </div>

        {/* タイトル */}
        <h1 className="text-2xl font-bold text-yellow-400 mb-6 amano-text-glow">
          {article.title}
        </h1>

        {/* 画像（もしあれば） */}
        {article.imageUrl && (
          <div className="mb-6">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* 元記事へのリンク */}
        <div className="text-center">
          <button
            onClick={handleOpenOriginal}
            className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white px-8 py-3 rounded-lg font-medium hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105 shadow-lg"
          >
            📖 元記事を読む
          </button>
          <p className="text-sm text-gray-400 mt-2">
            元記事のサイトで全文をお読みいただけます
          </p>
        </div>

        {/* 記事情報 */}
        <div className="mt-8 pt-6 border-t border-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <span className="font-medium">投稿者:</span> {article.councilMember?.name}
            </div>
            <div>
              <span className="font-medium">投稿日:</span> {formatDate(article.publishedAt)}
            </div>
            <div>
              <span className="font-medium">ソース:</span> {getSourceIcon(article.sourceType)} {article.sourceType}
            </div>
            <div>
              <span className="font-medium">カテゴリー:</span> {article.category}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
