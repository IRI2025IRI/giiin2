import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ExternalArticleDetailProps {
  articleId: Id<"externalArticles">;
  onBack: () => void;
}

const sourceLabel: Record<string, string> = {
  blog: "Blog",
  facebook: "Facebook",
  twitter: "X / Twitter",
  instagram: "Instagram",
  rss: "RSS",
};

export function ExternalArticleDetail({ articleId, onBack }: ExternalArticleDetailProps) {
  const article = useQuery(api.externalArticles.getById, { id: articleId });
  const incrementViewCount = useMutation(api.externalArticles.incrementViewCount);

  if (!article) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="ga-spinner mb-4"></div>
          <p style={{ color: "var(--ga-muted)" }}>記事を読み込み中...</p>
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

  const memberName = article.councilMember?.name;
  const memberPhoto = article.councilMember?.memberPhotoUrl || article.councilMember?.photoUrl;

  const handleOpenOriginal = () => {
    incrementViewCount({ id: articleId });
    window.open(article.originalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="ga-page">
      <div className="ga-main" style={{ paddingTop: "clamp(24px, 5vw, 40px)" }}>
        {/* 戻るボタン */}
        <button onClick={onBack} className="ga-btn ga-btn-ghost ga-block">
          ← 記事一覧に戻る
        </button>

        {/* 記事詳細 */}
        <div className="ga-block ga-surface-card" style={{ padding: "clamp(20px, 5vw, 40px)" }}>
          {/* ヘッダー情報 */}
          <div className="flex items-start gap-4 mb-6">
            <div className="ga-avatar flex-shrink-0" style={{ width: 48, height: 48, fontSize: "1rem" }}>
              {memberPhoto ? <img src={memberPhoto} alt={memberName} /> : memberName?.charAt(0) || "?"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-lg font-medium" style={{ color: "var(--ga-ink)" }}>{memberName}</h2>
                <span className="ga-pill cat">{article.category}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "var(--ga-muted)" }}>
                <span>{sourceLabel[article.sourceType] || "Link"}</span>
                <span>{formatDate(article.publishedAt)}</span>
                <span>{article.viewCount || 0} 回閲覧</span>
              </div>
            </div>
          </div>

          {/* タイトル */}
          <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--ga-ink)" }}>
            {article.title}
          </h1>

          {/* 画像（もしあれば） */}
          {article.imageUrl && (
            <div className="mb-6">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full max-w-2xl mx-auto rounded-lg"
                style={{ boxShadow: "var(--ga-shadow)" }}
              />
            </div>
          )}

          {/* 元記事へのリンク */}
          <div className="text-center">
            <button onClick={handleOpenOriginal} className="ga-btn ga-btn-primary">
              元記事を読む →
            </button>
            <p className="text-sm mt-2" style={{ color: "var(--ga-muted)" }}>
              元記事のサイトで全文をお読みいただけます
            </p>
          </div>

          {/* 記事情報 */}
          <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--ga-line)" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ color: "var(--ga-muted)" }}>
              <div><span className="font-medium">投稿者:</span> {memberName}</div>
              <div><span className="font-medium">投稿日:</span> {formatDate(article.publishedAt)}</div>
              <div><span className="font-medium">ソース:</span> {sourceLabel[article.sourceType] || "Link"}</div>
              <div><span className="font-medium">カテゴリー:</span> {article.category}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
