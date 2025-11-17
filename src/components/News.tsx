import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { NewsDetail } from "./NewsDetail";
import { useState } from "react";

interface NewsProps {
  selectedNewsId?: Id<"news"> | null;
  onNewsSelect?: (newsId: Id<"news"> | null) => void;
}

export function News({ selectedNewsId, onNewsSelect }: NewsProps = {}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const news = useQuery(api.news.list, {});
  const categories = useQuery(api.news.getCategories);
  const selectedNews = useQuery(
    api.news.getById,
    selectedNewsId ? { id: selectedNewsId } : "skip"
  );
  const user = useQuery(api.auth.loggedInUser);

  if (!news) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">お知らせを読み込み中...</p>
        </div>
      </div>
    );
  }

  // 選択されたお知らせがある場合は詳細表示
  if (selectedNewsId && selectedNews) {
    return (
      <NewsDetail 
        news={selectedNews} 
        onBack={() => onNewsSelect?.(null)} 
      />
    );
  }

  // フィルタリング処理
  const filteredNews = news.filter(item => {
    // 検索クエリでのフィルタリング
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = item.title.toLowerCase().includes(query);
      const contentMatch = item.content.toLowerCase().includes(query);
      if (!titleMatch && !contentMatch) {
        return false;
      }
    }
    
    // カテゴリーでのフィルタリング
    if (selectedCategory && item.category !== selectedCategory) {
      return false;
    }
    
    return true;
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      "重要": "from-red-500 to-red-600",
      "システム": "from-blue-500 to-blue-600",
      "イベント": "from-green-500 to-green-600",
      "議会": "from-purple-500 to-purple-600",
      "その他": "from-gray-500 to-gray-600"
    };
    return colors[category as keyof typeof colors] || "from-gray-500 to-gray-600";
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      "重要": "🚨",
      "システム": "💻",
      "イベント": "🎉",
      "議会": "🏛️",
      "その他": "📝"
    };
    return icons[category as keyof typeof icons] || "📝";
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">📢 お知らせ</h2>
        <p className="text-gray-600">システムの更新情報や重要なお知らせをご確認いただけます</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border-l-4 border-green-500">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm">
            🔍
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-800">検索・フィルター</h3>
        </div>
        
        <div className="space-y-4">
          {/* Search Box */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              キーワード検索
            </label>
            <input
              type="text"
              placeholder="タイトルや内容で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>

          {/* Category Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="flex items-center space-x-1">
                  <span>🏷️</span>
                  <span>カテゴリー</span>
                </span>
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-sm sm:text-base"
              >
                <option value="">すべてのカテゴリー</option>
                {categories?.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(selectedCategory || searchQuery) && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSelectedCategory("");
                  setSearchQuery("");
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>すべてクリア</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
        <div className="flex items-center space-x-3">
          <span className="text-xl sm:text-2xl">📊</span>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800">
              検索結果: {filteredNews.length}件
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {searchQuery && `キーワード: "${searchQuery}"`}
              {searchQuery && selectedCategory && " | "}
              {selectedCategory && `カテゴリー: ${selectedCategory}`}
            </p>
          </div>
        </div>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredNews.map((item, index) => (
          <div
            key={item._id}
            onClick={() => {
              onNewsSelect?.(item._id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group border-l-4 border-blue-500 animate-slideUp overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${getCategoryColor(item.category)} rounded-full flex items-center justify-center text-white text-lg shadow-lg`}>
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.publishDate).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors leading-tight">
                {item.title}
              </h3>

              <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
                {item.content}
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  {item.author && (
                    <div className="flex items-center space-x-1">
                      <span>👤</span>
                      <span>{item.author.name || "匿名"}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <span>📅</span>
                    <span>{new Date(item.publishDate).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-blue-600 group-hover:text-blue-800 transition-colors">
                  <span className="text-sm font-medium">詳細を見る</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredNews.length === 0 && (
        <div className="text-center py-12 sm:py-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl border-2 border-dashed border-blue-300">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl sm:text-4xl mx-auto mb-6 animate-bounce">
            😔
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
            {news.length === 0 ? "お知らせがありません" : "条件に一致するお知らせがありません"}
          </h3>
          <p className="text-gray-600 text-sm sm:text-lg px-4">
            {news.length === 0 
              ? "新しいお知らせが投稿されるとここに表示されます。"
              : "フィルター条件を変更してお試しください。"
            }
          </p>
        </div>
      )}
    </div>
  );
}
