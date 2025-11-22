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
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
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
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4 animate-amano-glow"></div>
          <p className="text-gray-300 font-medium amano-text-glow">お知らせを読み込み中...</p>
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
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          ✨ お知らせ
        </h1>
        <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
          システムの更新情報や重要なお知らせをご確認いただけます
        </p>
      </div>

      {/* Search and Filters */}
      <div className="amano-bg-card rounded-xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 amano-crystal-border">
        {/* Filter Toggle Button */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-yellow-400 amano-text-glow">
            🔍 検索・フィルター
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors flex items-center space-x-2"
          >
            <span>{showFilters ? "閉じる" : "開く"}</span>
            <span className={`transform transition-transform ${showFilters ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>
        </div>

        {/* Collapsible Filter Content */}
        {showFilters && (
          <div className="space-y-4 animate-slideDown">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  キーワード検索
                </label>
                <input
                  type="text"
                  placeholder="タイトルや内容で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="auth-input-field"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  カテゴリー
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="auth-input-field"
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

            {/* Active Filters Display */}
            {(searchQuery || selectedCategory) && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-purple-500/30">
                <span className="text-sm text-gray-400">適用中のフィルター:</span>
                {searchQuery && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs border border-blue-500/30">
                    検索: "{searchQuery}"
                  </span>
                )}
                {selectedCategory && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs border border-green-500/30">
                    カテゴリー: {selectedCategory}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("");
                  }}
                  className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs border border-red-500/30 hover:bg-red-500/30 transition-colors"
                >
                  クリア
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* News List */}
      <div className="space-y-6">
        {filteredNews.length === 0 ? (
          <div className="text-center py-12 amano-bg-card rounded-xl p-6 shadow-2xl border border-purple-500/30 amano-crystal-border">
            <div className="text-6xl mb-4">📰</div>
            <p className="text-gray-300 text-lg">
              {searchQuery || selectedCategory 
                ? "条件に一致するお知らせが見つかりません" 
                : "お知らせはまだありません"}
            </p>
          </div>
        ) : (
          filteredNews.map((item) => (
            <div
              key={item._id}
              onClick={() => onNewsSelect?.(item._id)}
              className="amano-bg-glass rounded-xl p-6 shadow-2xl border border-gray-500/30 hover:border-yellow-400/50 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getCategoryColor(item.category)} text-white`}>
                      {getCategoryIcon(item.category)} {item.category}
                    </span>
                    <span className="text-gray-400 text-xs">
                      📅 {new Date(item.publishDate).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {item.content}
                  </p>
                  
                  {item.thumbnailUrl && (
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <span className="flex items-center text-purple-400">
                        🖼️ サムネイル画像あり
                      </span>
                    </div>
                  )}
                </div>
                
                {item.thumbnailUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-32 h-20 object-cover rounded-lg border border-purple-500/30"
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
