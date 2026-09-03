import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface NewsProps {
  onNewsClick: (newsId: Id<"news">) => void;
}

export function News({ onNewsClick }: NewsProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const news = useQuery(api.news.list);

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

  // カテゴリー一覧を取得
  const categories = Array.from(new Set(news.map(n => n.category))).sort();

  // ニュースをフィルタリング
  const filteredNews = news.filter(item =>
    selectedCategory === "all" || item.category === selectedCategory
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="ga-page">
      <div className="ga-page-header">
        <h1>お知らせ</h1>
        <p>サイトからの最新情報をお届けします</p>
      </div>

      <div className="ga-main">
        {/* カテゴリーフィルター */}
        <div className="ga-block ga-surface-card">
          <div className="ga-field" style={{ maxWidth: 280 }}>
            <label>カテゴリー</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="ga-select"
            >
              <option value="all">すべて</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ニュース一覧 */}
        <div className="ga-block space-y-4">
          {filteredNews.length === 0 ? (
            <div className="ga-empty ga-surface-card">
              <h3 className="text-xl font-medium mb-2" style={{ color: "var(--ga-ink)" }}>お知らせがありません</h3>
              <p>現在表示できるお知らせがありません。</p>
            </div>
          ) : (
            filteredNews.map((item) => (
              <div
                key={item._id}
                onClick={() => onNewsClick(item._id)}
                className="ga-surface-card cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold" style={{ color: "var(--ga-ink)" }}>{item.title}</h2>
                  <span className="ga-pill cat">{item.category}</span>
                </div>
                <p className="mb-3 line-clamp-2" style={{ color: "var(--ga-muted)" }}>
                  {item.content.substring(0, 150)}...
                </p>
                <div className="flex items-center gap-4 text-sm" style={{ color: "var(--ga-muted)" }}>
                  <span>{formatDate(item.publishDate)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
