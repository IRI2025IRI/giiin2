import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface NewsDetailProps {
  news: any;
  onBack: () => void;
  onEdit?: (news: any) => void;
}

export function NewsDetail({ news, onBack, onEdit }: NewsDetailProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <p key={index} className="mb-4 last:mb-0">
        {line}
      </p>
    ));
  };

  return (
    <div className="space-y-6">
      {/* 戻るボタン */}
      <button
        onClick={() => {
          onBack();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        <span>←</span>
        <span>お知らせ一覧に戻る</span>
      </button>

      {/* お知らせ詳細 */}
      <article className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* サムネイル画像 */}
        {news.thumbnailUrl && (
          <div className="w-full h-64 sm:h-80">
            <img
              src={news.thumbnailUrl}
              alt={news.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                  {news.category}
                </span>
                {!news.isPublished && (
                  <span className="bg-yellow-500 px-3 py-1 rounded-full text-sm font-medium">
                    下書き
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                {news.title}
              </h1>
            </div>
            {onEdit && (
              <button
                onClick={() => onEdit(news)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ✏️ 編集
              </button>
            )}
          </div>
        </div>

        {/* メタ情報 */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>📅 {formatDate(news.publishDate)}</span>
              {news.author && (
                <span>👤 {news.author.name || "匿名"}</span>
              )}
            </div>
          </div>
        </div>

        {/* 本文 */}
        <div className="p-6">
          <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
            {formatContent(news.content)}
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              最終更新: {formatDate(news._creationTime)}
            </p>
            <button
              onClick={() => {
                onBack();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              一覧に戻る
            </button>
          </div>
        </div>
      </article>

      {/* 関連情報 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          📢 お知らせについて
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• このお知らせはGIIIN/ギイーンの運営チームから発信されています</p>
          <p>• ご質問やご意見がございましたら、お気軽にお問い合わせください</p>
          <p>• 重要なお知らせは定期的にチェックしていただくことをお勧めします</p>
        </div>
      </div>
    </div>
  );
}
