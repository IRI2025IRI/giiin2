import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface QuestionsListProps {
  onQuestionClick?: (questionId: Id<"questions">) => void;
}

export function QuestionsList({ onQuestionClick }: QuestionsListProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "likes">("date");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const questions = useQuery(api.questions.list);
  const categories = useQuery(api.questions.getCategories);
  const sessionNumbers = useQuery(api.questions.getSessionNumbers);
  const user = useQuery(api.auth.loggedInUser);
  const toggleLike = useMutation(api.likes.toggle);

  const handleLike = async (questionId: Id<"questions">) => {
    if (!user) {
      alert("いいねするにはログインが必要です");
      return;
    }
    try {
      await toggleLike({ questionId });
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  // タッチイベントの処理を改善
  const handleTouchInteraction = (questionId: Id<"questions">) => {
    let touchStartTime = 0;
    let touchStartY = 0;
    let touchStartX = 0;
    let hasMoved = false;

    const handleTouchStart = (e: React.TouchEvent) => {
      touchStartTime = Date.now();
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      hasMoved = false;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = Math.abs(currentY - touchStartY);
      const deltaX = Math.abs(currentX - touchStartX);
      
      // 10px以上動いた場合はスクロールと判定
      if (deltaY > 10 || deltaX > 10) {
        hasMoved = true;
      }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      e.preventDefault();
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;
      
      // スクロールしていない かつ タッチ時間が短い場合のみクリックとして処理
      if (!hasMoved && touchDuration < 500) {
        console.log("QuestionsList: Valid touch interaction for question:", questionId);
        onQuestionClick?.(questionId);
      }
    };

    return {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    };
  };

  if (!questions || !categories || !sessionNumbers) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // フィルタリング処理
  const filteredQuestions = questions.filter(question => {
    // 検索クエリでのフィルタリング（タイトルと内容を対象）
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = question.title.toLowerCase().includes(query);
      const contentMatch = question.content.toLowerCase().includes(query);
      const memberMatch = question.memberName?.toLowerCase().includes(query);
      if (!titleMatch && !contentMatch && !memberMatch) {
        return false;
      }
    }
    
    // カテゴリーでのフィルタリング
    if (selectedCategory && question.category !== selectedCategory) {
      return false;
    }
    
    // セッションでのフィルタリング
    if (selectedSession && question.sessionNumber !== selectedSession) {
      return false;
    }
    
    return true;
  });

  // ソート処理
  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    if (sortBy === "likes") {
      return b.likeCount - a.likeCount;
    }
    return b.sessionDate - a.sessionDate; // 日付の降順
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">質問・回答一覧</h2>
          <p className="text-gray-600 mt-1">
            {filteredQuestions.length}件の質問が見つかりました
          </p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "grid"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            📱 カード
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            📋 リスト
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">検索</label>
            <input
              type="text"
              placeholder="質問タイトル、内容、議員名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリー</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">すべてのカテゴリー</option>
              {categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>

          {/* Session Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">会議</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">すべての会議</option>
              {sessionNumbers?.map((sessionNumber) => (
                <option key={sessionNumber} value={sessionNumber}>
                  {sessionNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">並び順</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "likes")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="date">日付順</option>
              <option value="likes">いいね順</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchQuery || selectedCategory || selectedSession) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("");
                setSelectedSession("");
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              フィルターをクリア
            </button>
          </div>
        )}
      </div>

      {/* Questions */}
      {sortedQuestions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">質問が見つかりません</h3>
          <p className="text-gray-600">検索条件を変更してお試しください。</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedQuestions.map((question) => {
            const touchHandlers = handleTouchInteraction(question._id);
            return (
              <div
                key={question._id}
                onClick={() => {
                  console.log("QuestionsList: onClick triggered for question:", question._id);
                  onQuestionClick?.(question._id);
                }}
                {...touchHandlers}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                        {question.category}
                      </span>
                      <span>📅 {new Date(question.sessionDate).toLocaleDateString("ja-JP")}</span>
                      <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                        question.status === 'answered' 
                          ? 'bg-green-100 text-green-700' 
                          : question.status === 'archived'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {question.status === 'answered' ? '回答済み' : question.status === 'archived' ? 'アーカイブ' : '回答待ち'}
                      </div>
                    </div>
                    {question.likeCount > 0 && (
                      <div className="flex items-center space-x-1 text-pink-600 text-xs">
                        <span>❤️</span>
                        <span>{question.likeCount}</span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-800 mb-3 leading-tight">
                    {question.title}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {question.category}
                    </span>
                    <div className="flex items-center space-x-1">
                      <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {question.memberName?.charAt(0) || "?"}
                      </div>
                      <span className="text-gray-600 font-medium">{question.memberName || "不明"}</span>
                    </div>
                    {question.sessionNumber && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                        {question.sessionNumber}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
                    {question.content}
                  </p>

                  {/* Response */}
                  {question.responseCount > 0 && (
                    <div className="bg-green-50 rounded-xl p-4 border-l-4 border-green-500">
                      <h4 className="font-bold text-green-800 mb-2 flex items-center space-x-2">
                        <span>💬</span>
                        <span>{question.responseCount}件の回答があります</span>
                      </h4>
                      <p className="text-green-700 text-sm">詳細を見るにはクリックしてください</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-3">
                      {question.youtubeUrl && (
                        <a
                          href={question.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center space-x-1 text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          <span>📺</span>
                          <span>動画</span>
                        </a>
                      )}
                      {question.documentUrl && (
                        <a
                          href={question.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          <span>📄</span>
                          <span>資料</span>
                        </a>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(question._id);
                      }}
                      disabled={!user}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        question.isLiked
                          ? "bg-pink-100 text-pink-600"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span>{question.isLiked ? "❤️" : "🤍"}</span>
                      <span>{question.likeCount}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {sortedQuestions.map((question) => {
              const touchHandlers = handleTouchInteraction(question._id);
              return (
                <div
                  key={question._id}
                  onClick={() => {
                    console.log("QuestionsList (list): onClick triggered for question:", question._id);
                    onQuestionClick?.(question._id);
                  }}
                  {...touchHandlers}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {question.category}
                        </span>
                        <span className="flex items-center space-x-1">
                          <span>👤</span>
                          <span>{question.memberName || "不明"}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span>📅</span>
                          <span>{new Date(question.sessionDate).toLocaleDateString("ja-JP")}</span>
                        </span>
                        {question.sessionNumber && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {question.sessionNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        question.status === 'answered' 
                          ? 'bg-green-100 text-green-700' 
                          : question.status === 'archived'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {question.status === 'answered' ? '回答済み' : question.status === 'archived' ? 'アーカイブ' : '回答待ち'}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {question.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {question.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {question.responseCount > 0 && (
                        <span className="flex items-center space-x-1">
                          <span>💬</span>
                          <span>{question.responseCount}件の回答</span>
                        </span>
                      )}
                      {question.youtubeUrl && (
                        <a
                          href={question.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
                        >
                          <span>📺</span>
                          <span>動画を見る</span>
                        </a>
                      )}
                      {question.documentUrl && (
                        <a
                          href={question.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                        >
                          <span>📄</span>
                          <span>資料を見る</span>
                        </a>
                      )}
                      {question.likeCount > 0 && (
                        <div className="flex items-center space-x-1 text-pink-600">
                          <span>❤️</span>
                          <span className="font-medium">{question.likeCount}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(question._id);
                      }}
                      disabled={!user}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        question.isLiked
                          ? "bg-pink-100 text-pink-700 hover:bg-pink-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span>{question.isLiked ? "❤️" : "🤍"}</span>
                      <span>いいね</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
