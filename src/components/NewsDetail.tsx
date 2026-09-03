import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface NewsDetailProps {
  newsId: Id<"news">;
  onBack: () => void;
}

export function NewsDetail({ newsId, onBack }: NewsDetailProps) {
  const news = useQuery(api.news.getById, { id: newsId });

  if (!news) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="ga-spinner mb-4"></div>
          <p style={{ color: "var(--ga-muted)" }}>読み込み中...</p>
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

  return (
    <div className="ga-page">
      <div className="ga-main" style={{ paddingTop: "clamp(24px, 5vw, 40px)" }}>
        {/* 戻るボタン */}
        <button onClick={onBack} className="ga-btn ga-btn-ghost ga-block">
          ← お知らせ一覧に戻る
        </button>

        {/* 記事詳細 */}
        <div className="ga-block ga-surface-card" style={{ padding: "clamp(20px, 5vw, 40px)" }}>
          {/* ヘッダー */}
          <div className="mb-8">
            <div className="mb-4">
              <span className="ga-pill cat">{news.category}</span>
            </div>
            <h1 className="text-3xl font-bold mb-4" style={{ color: "var(--ga-ink)" }}>
              {news.title}
            </h1>
            <div className="text-sm" style={{ color: "var(--ga-muted)" }}>
              {formatDate(news.publishDate)}
            </div>
          </div>

          {/* サムネイル画像 */}
          {news.thumbnailUrl && (
            <div className="mb-8">
              <img
                src={news.thumbnailUrl}
                alt={news.title}
                className="w-full max-w-2xl mx-auto rounded-lg"
                style={{ boxShadow: "var(--ga-shadow)" }}
              />
            </div>
          )}

          {/* 本文 */}
          <div className="max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed" style={{ color: "var(--ga-muted)" }}>
              {news.content}
            </div>
          </div>

          {/* フッター */}
          <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--ga-line)" }}>
            <div className="text-sm" style={{ color: "var(--ga-muted)" }}>
              カテゴリー: {news.category}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
