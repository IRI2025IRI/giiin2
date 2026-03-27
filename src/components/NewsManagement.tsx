import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { NewsForm } from "./NewsForm";

export function NewsManagement() {
  const news = useQuery(api.news.listAll);
  const deleteNews = useMutation(api.news.remove);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<Doc<"news"> | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "scheduled" | "draft">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const handleEdit = (newsItem: any) => {
    // null を undefined に変換
    const editableNews = {
      ...newsItem,
      thumbnailUrl: newsItem.thumbnailUrl || undefined
    };
    setEditingNews(editableNews);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: Id<"news">) => {
    if (confirm("このお知らせを削除してもよろしいですか？")) {
      try {
        await deleteNews({ id });
      } catch (error) {
        console.error("Failed to delete news:", error);
      }
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingNews(null);
  };

  const handleFormSuccess = () => {
    // Form will close automatically
  };

  const categories = Array.from(new Set(news?.map(n => n.category) || []));

  const now = Date.now();
  const isScheduled = (item: any) =>
    item.isPublished && item.scheduledPublishDate && item.scheduledPublishDate > now;

  const filteredNews = news?.filter(newsItem => {
    const matchesSearch = newsItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         newsItem.content.toLowerCase().includes(searchTerm.toLowerCase());

    const scheduled = isScheduled(newsItem);
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && newsItem.isPublished && !scheduled) ||
      (filterStatus === "scheduled" && scheduled) ||
      (filterStatus === "draft" && !newsItem.isPublished);

    const matchesCategory = filterCategory === "all" || newsItem.category === filterCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (!news) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 animate-amano-glow"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 amano-text-glow">
            ✨ お知らせ管理
          </h2>
          <p className="text-gray-300 text-sm mt-1">
            お知らせの追加・編集・削除
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="auth-button px-6 py-3"
        >
          ➕ 新しいお知らせを追加
        </button>
      </div>

      {/* Filters */}
      <div className="amano-bg-card rounded-xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 amano-crystal-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="タイトル、内容で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="auth-input-field"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="auth-input-field"
            >
              <option value="all">全てのステータス</option>
              <option value="published">公開済み</option>
              <option value="scheduled">予約投稿</option>
              <option value="draft">下書き</option>
            </select>
          </div>
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="auth-input-field"
            >
              <option value="all">全てのカテゴリ</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* News List */}
      <div className="space-y-4">
        {filteredNews && filteredNews.length > 0 ? (
          filteredNews.map((newsItem) => (
            <div key={newsItem._id} className="amano-bg-glass rounded-lg p-4 border border-gray-500/30 hover:border-yellow-400/50 transition-all duration-300">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {isScheduled(newsItem) ? (
                      <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        ⏰ 予約投稿
                      </span>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        newsItem.isPublished
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          : "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
                      }`}>
                        {newsItem.isPublished ? "公開済み" : "下書き"}
                      </span>
                    )}
                    <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {newsItem.category}
                    </span>
                    {isScheduled(newsItem) ? (
                      <span className="text-yellow-300 text-xs">
                        📅 {new Date(newsItem.scheduledPublishDate).toLocaleString('ja-JP')} 公開予定
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        📅 {new Date(newsItem.publishDate).toLocaleDateString('ja-JP')}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-200 mb-2 line-clamp-2">
                    {newsItem.title}
                  </h3>
                  
                  <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                    {newsItem.content}
                  </p>
                  
                  {newsItem.thumbnailUrl && (
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <span className="flex items-center text-purple-400">
                        🖼️ サムネイル画像あり
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(newsItem)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(newsItem._id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 amano-bg-card rounded-xl p-6 shadow-2xl border border-purple-500/30 amano-crystal-border">
            <div className="text-6xl mb-4">📰</div>
            <p className="text-gray-300 text-lg">
              {searchTerm || filterStatus !== "all" || filterCategory !== "all" 
                ? "条件に一致するお知らせが見つかりません" 
                : "お知らせが登録されていません"}
            </p>
            {!searchTerm && filterStatus === "all" && filterCategory === "all" && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="mt-4 auth-button px-6 py-3"
              >
                最初のお知らせを追加
              </button>
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <NewsForm
          news={editingNews}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
