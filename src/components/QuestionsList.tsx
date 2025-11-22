import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { QuestionCard } from "./QuestionCard";

interface QuestionsListProps {
  onQuestionClick: (questionId: Id<"questions">) => void;
}

export function QuestionsList({ onQuestionClick }: QuestionsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSession, setSelectedSession] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 10;

  const questions = useQuery(api.questions.list);
  const members = useQuery(api.councilMembers.list, { activeOnly: true });

  if (!questions || !members) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">読み込み中...</p>
        </div>
      </div>
    );
  }

  // Get unique categories and sessions
  const categories = Array.from(new Set(questions.map(q => q.category).filter(Boolean)));
  const sessions = Array.from(new Set(questions.map(q => q.sessionNumber).filter(Boolean))).sort();

  // Filter and sort questions
  const filteredQuestions = questions
    .filter(question => {
      const member = members.find(m => m._id === question.councilMemberId);
      const matchesSearch = searchQuery === "" || 
        question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member && member.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === "all" || question.category === selectedCategory;
      const matchesStatus = selectedStatus === "all" || question.status === selectedStatus;
      const matchesSession = selectedSession === "all" || question.sessionNumber === selectedSession;
      
      return matchesSearch && matchesCategory && matchesStatus && matchesSession;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.sessionDate - a.sessionDate;
        case "oldest":
          return a.sessionDate - b.sessionDate;
        case "likes":
          return (b.likeCount || 0) - (a.likeCount || 0);
        case "responses":
          return (b.responseCount || 0) - (a.responseCount || 0);
        default:
          return 0;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          📜 質問・回答一覧
        </h1>
        <p className="text-gray-300 text-sm sm:text-base">
          総質問数: {questions.length}件
        </p>
      </div>

      {/* Filters */}
      <div className="amano-bg-card rounded-xl p-4 sm:p-6 shadow-2xl border border-purple-500/30">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  検索
                </label>
                <input
                  type="text"
                  placeholder="質問内容、議員名で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="auth-input-field text-sm"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  カテゴリ
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="auth-input-field text-sm"
                >
                  <option value="all">すべて</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Session Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  会議番号
                </label>
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  className="auth-input-field text-sm"
                >
                  <option value="all">すべて</option>
                  {sessions.map((session) => (
                    <option key={session} value={session}>
                      {session}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ステータス
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="auth-input-field text-sm"
                >
                  <option value="all">すべて</option>
                  <option value="pending">回答待ち</option>
                  <option value="answered">回答済み</option>
                  <option value="archived">アーカイブ</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  並び順
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="auth-input-field text-sm"
                >
                  <option value="newest">新しい順</option>
                  <option value="oldest">古い順</option>
                  <option value="likes">いいね数順</option>
                  <option value="responses">回答数順</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchQuery || selectedCategory !== "all" || selectedSession !== "all" || selectedStatus !== "all") && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-purple-500/30">
                <span className="text-sm text-gray-400">適用中のフィルター:</span>
                {searchQuery && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs border border-blue-500/30">
                    検索: "{searchQuery}"
                  </span>
                )}
                {selectedCategory !== "all" && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs border border-green-500/30">
                    カテゴリ: {selectedCategory}
                  </span>
                )}
                {selectedSession !== "all" && (
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs border border-purple-500/30">
                    会議: {selectedSession}
                  </span>
                )}
                {selectedStatus !== "all" && (
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded text-xs border border-orange-500/30">
                    ステータス: {selectedStatus === "pending" ? "回答待ち" : selectedStatus === "answered" ? "回答済み" : "アーカイブ"}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setSelectedSession("all");
                    setSelectedStatus("all");
                  }}
                  className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs border border-red-500/30 hover:bg-red-500/30 transition-colors"
                >
                  すべてクリア
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Info */}
        <div className="mt-4 pt-4 border-t border-purple-500/30 flex justify-between items-center text-sm text-gray-400">
          <span>{filteredQuestions.length}件の質問が見つかりました</span>
          <span>ページ {currentPage} / {totalPages}</span>
        </div>
      </div>

      {/* Questions List */}
      {paginatedQuestions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-400">該当する質問が見つかりませんでした</p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {paginatedQuestions.map((question, index) => (
            <div
              key={question._id}
              className="animate-slideUp cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => onQuestionClick(question._id)}
            >
              <QuestionCard 
                question={question}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
          >
            前へ
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === page
                      ? "bg-yellow-500 text-black font-bold"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
          >
            次へ
          </button>
        </div>
      )}

      {/* Data Source Attribution */}
      <div className="amano-bg-card rounded-xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 text-center">
        <h3 className="text-lg sm:text-xl font-bold text-yellow-400 mb-4 amano-text-glow">
          📊 データ出典について
        </h3>
        <div className="text-gray-300 text-sm sm:text-base space-y-2">
          <p>
            質問・回答データは
            <a 
              href="https://www.city.mihara.hiroshima.jp/site/gikai/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-yellow-400 underline hover:no-underline transition-colors mx-1"
            >
              三原市議会公式サイト
            </a>
            の議事録から取得しています。
          </p>
          <p className="text-xs text-gray-400">
            ※ 議事録の著作権は三原市に帰属します
          </p>
          <p className="text-xs text-gray-400">
            ※ 最新の正確な情報については、必ず公式サイトをご確認ください
          </p>
        </div>
      </div>
    </div>
  );
}
