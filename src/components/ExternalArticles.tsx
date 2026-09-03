import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ExternalArticlesProps {
  onArticleClick?: (articleId: Id<"externalArticles">) => void;
}

const sourceLabel: Record<string, string> = {
  blog: "Blog",
  facebook: "Facebook",
  twitter: "X / Twitter",
  instagram: "Instagram",
  rss: "RSS",
};

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

  const getMemberIcon = (member: any) => (
    <span className="ga-avatar">
      {(member?.memberPhotoUrl || member?.photoUrl) ? (
        <img src={member.memberPhotoUrl || member.photoUrl} alt={member.name} />
      ) : (
        member?.name?.charAt(0) || "?"
      )}
    </span>
  );

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
          <div className="ga-spinner mb-4"></div>
          <p style={{ color: "var(--ga-muted)" }}>記事を読み込み中...</p>
        </div>
      </div>
    );
  }

  // 記事を最新順にソート
  const sortedArticles = [...articles].sort((a, b) => b.publishedAt - a.publishedAt);

  return (
    <div className="ga-page">
      <div className="ga-page-header">
        <h1>議員ブログ・SNS</h1>
        <p>三原市議会議員の最新の活動報告やブログ記事をまとめて確認できます</p>
      </div>

      <div className="ga-main">
        {/* 議員フィルター */}
        <div className="ga-block ga-surface-card">
          <div className="ga-field" style={{ maxWidth: 320 }}>
            <label>議員で絞り込み</label>
            <select
              value={selectedMember || ""}
              onChange={(e) => setSelectedMember(e.target.value ? e.target.value as Id<"councilMembers"> : null)}
              className="ga-select"
            >
              <option value="">すべての議員</option>
              {councilMembers?.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name} ({member.politicalParty || "無所属"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 記事一覧 */}
        <div className="ga-block">
          <div className="ga-section-head">
            <div className="ga-headline">
              <span className="ga-eyebrow">Articles</span>
              <h2>記事一覧</h2>
            </div>
            <span className="text-sm" style={{ color: "var(--ga-muted)" }}>{sortedArticles.length}件の記事</span>
          </div>

          {sortedArticles.length === 0 ? (
            <div className="ga-empty ga-surface-card">
              <h3 className="text-xl font-medium mb-2" style={{ color: "var(--ga-ink)" }}>記事が見つかりません</h3>
              <p>選択した条件に該当する記事がありません。<br />フィルターを変更してお試しください。</p>
            </div>
          ) : (
            <div className="ga-surface-card" style={{ padding: 0 }}>
              <div className="space-y-2 p-4">
                {sortedArticles.map((article) => {
                  const isRecent = isRecentArticle(article.publishedAt);
                  return (
                    <div
                      key={article._id}
                      onClick={() => handleArticleClick(article)}
                      className="cursor-pointer flex flex-wrap items-center gap-3 p-3 rounded-lg transition-colors"
                      style={{
                        background: isRecent ? "var(--ga-gold-soft)" : "var(--ga-paper)",
                        border: `1px solid ${isRecent ? "var(--ga-gold)" : "var(--ga-line)"}`,
                      }}
                    >
                      {/* NEW バッジ（2週間以内の記事） */}
                      {isRecent && <span className="ga-tag accent flex-shrink-0">NEW</span>}

                      {/* 顔写真 */}
                      <div className="flex-shrink-0">{getMemberIcon(article.councilMember)}</div>

                      {/* 日付 */}
                      <span className="ga-num text-sm min-w-[80px]" style={{ color: "var(--ga-muted)" }}>
                        {formatDate(article.publishedAt)}
                      </span>

                      {/* カテゴリーバッジ */}
                      <span className="ga-pill cat">{article.category}</span>

                      {/* タイトル */}
                      <h3 className="flex-1 font-medium text-sm leading-tight min-w-[160px]" style={{ color: "var(--ga-ink)" }}>
                        {truncateTitle(article.title, 80)}
                      </h3>

                      {/* 議員名・ソース・閲覧数 */}
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--ga-muted)" }}>
                        <span>{sourceLabel[article.sourceType] || "Link"}</span>
                        <span className="truncate max-w-[80px]">{article.councilMember?.name}</span>
                        <span>閲覧 {article.viewCount || 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* もっと見るボタン（必要に応じて） */}
              {sortedArticles.length >= 50 && (
                <div className="p-4 text-center" style={{ borderTop: "1px solid var(--ga-line)" }}>
                  <button className="ga-btn ga-btn-primary">もっと見る</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
