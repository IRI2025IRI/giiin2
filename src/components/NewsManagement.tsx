import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { NewsForm } from "./NewsForm";
import { toast } from "sonner";

export function NewsManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<Doc<"news"> | null>(null);
  
  const news = useQuery(api.news.listAll);
  const deleteNews = useMutation(api.news.remove);

  const handleEdit = (newsItem: any) => {
    // Convert the enhanced news item back to the base Doc type
    const baseNewsItem: Doc<"news"> = {
      _id: newsItem._id,
      _creationTime: newsItem._creationTime,
      title: newsItem.title,
      content: newsItem.content,
      category: newsItem.category,
      publishDate: newsItem.publishDate,
      isPublished: newsItem.isPublished,
      authorId: newsItem.authorId,
      thumbnailUrl: newsItem.thumbnailUrl || undefined,
      thumbnailId: newsItem.thumbnailId,
    };
    setEditingNews(baseNewsItem);
    setIsFormOpen(true);
  };

  const handleDelete = async (newsId: Id<"news">) => {
    if (!confirm("このお知らせを削除しますか？")) return;
    
    try {
      await deleteNews({ id: newsId });
      toast.success("お知らせを削除しました");
    } catch (error) {
      console.error("Error deleting news:", error);
      toast.error("お知らせの削除に失敗しました");
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingNews(null);
  };

  if (!news) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">お知らせ管理</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
        >
          新規お知らせ作成
        </button>
      </div>

      {/* お知らせ一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((newsItem) => (
          <div key={newsItem._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* お知らせ情報 */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      {newsItem.category}
                    </span>
                    {!newsItem.isPublished && (
                      <span className="inline-block bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                        下書き
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">{newsItem.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3">{newsItem.content}</p>
                </div>
              </div>

              {/* 追加情報 */}
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <p>公開日: {new Date(newsItem.publishDate).toLocaleDateString('ja-JP')}</p>
                <p>作成日: {new Date(newsItem._creationTime).toLocaleDateString('ja-JP')}</p>
              </div>

              {/* 操作ボタン */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(newsItem)}
                  className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(newsItem._id)}
                  className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* お知らせが存在しない場合 */}
      {news.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📢</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">お知らせが登録されていません</h3>
          <p className="text-gray-600 mb-6">最初のお知らせを作成してください</p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
          >
            お知らせを作成
          </button>
        </div>
      )}

      {/* お知らせ作成・編集フォーム */}
      {isFormOpen && (
        <NewsForm
          news={editingNews || undefined}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
