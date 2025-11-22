import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { QuestionCard } from "./QuestionCard";
import { Id } from "../../convex/_generated/dataModel";

interface QuestionsListProps {
  onQuestionClick?: (questionId: Id<"questions">) => void;
}

export function QuestionsList({ onQuestionClick }: QuestionsListProps = {}) {
  const questions = useQuery(api.questions.list);
  const councilMembers = useQuery(api.councilMembers.list, { activeOnly: false });
  const categories = useQuery(api.questions.getCategories);
  const sessionNumbers = useQuery(api.questions.getSessionNumbers);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "likes">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const itemsPerPage = 10;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedMember, selectedSession, selectedStatus, sortBy]);

  if (!questions || !councilMembers) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 animate-amano-glow"></div>
      </div>
    );
  }

  // Filter questions
  const filteredQuestions = questions.filter((question) => {
    const matchesSearch = 
      question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.memberName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || question.category === selectedCategory;
    const matchesMember = selectedMember === "all" || question.councilMemberId === selectedMember;
    const matchesSession = selectedSession === "all" || question.sessionNumber === selectedSession;
    const matchesStatus = selectedStatus === "all" || question.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesMember && matchesSession && matchesStatus;
  });

  // Sort questions
  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return a.sessionDate - b.sessionDate;
      case "likes":
        return b.likeCount - a.likeCount;
      case "newest":
      default:
        return b.sessionDate - a.sessionDate;
    }
  });

  // Paginate questions
  const totalPages = Math.ceil(sortedQuestions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQuestions = sortedQuestions.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = searchTerm || selectedCategory !== "all" || selectedMember !== "all" || selectedSession !== "all" || selectedStatus !== "all";

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedMember("all");
    setSelectedSession("all");
    setSelectedStatus("all");
    setSortBy("newest");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2 amano-text-glow">
          ✨ 質問・回答一覧 ✨
        </h1>
        <p className="text-gray-300">
          議会での質問と回答を検索・閲覧できます
        </p>
      </div>

      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between amano-bg-glass rounded-xl p-4 amano-crystal-border">
        <div className="flex items-center space-x-3">
          <span className="text-lg">🔍</span>
          <span className="font-medium text-gray-200">検索・フィルター</span>
          {hasActiveFilters && (
            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium animate-amano-glow">
              フィルター適用中
            </span>
          )}
          <span className="text-gray-400 text-sm">
            ({filteredQuestions.length} 件)
          </span>
        </div>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 amano-crystal-border"
        >
          <span>{isFilterOpen ? "▲" : "▼"}</span>
          <span className="hidden sm:inline">{isFilterOpen ? "閉じる" : "開く"}</span>
        </button>
      </div>

      {/* Filters */}
      {isFilterOpen && (
        <div className="amano-bg-glass rounded-xl p-6 space-y-4 amano-crystal-border animate-slideDown">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                🔍 キーワード検索
              </label>
              <input
                type="text"
                placeholder="質問内容、議員名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="auth-input-field"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                📂 カテゴリ
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="auth-input-field"
              >
                <option value="all">全てのカテゴリ</option>
                {categories?.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Member Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                👤 議員
              </label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="auth-input-field"
              >
                <option value="all">全ての議員</option>
                {councilMembers?.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name} ({member.party})
                  </option>
                ))}
              </select>
            </div>

            {/* Session Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                📅 会期
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="auth-input-field"
              >
                <option value="all">全ての会期</option>
                {sessionNumbers?.map((session) => (
                  <option key={session} value={session}>
                    {session}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                📊 ステータス
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="auth-input-field"
              >
                <option value="all">全てのステータス</option>
                <option value="answered">回答済み</option>
                <option value="pending">回答待ち</option>
                <option value="archived">アーカイブ</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                🔄 並び順
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="auth-input-field"
              >
                <option value="newest">新しい順</option>
                <option value="oldest">古い順</option>
                <option value="likes">いいね順</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-purple-500">
            <div className="text-gray-300">
              <span className="text-yellow-400 font-semibold">{filteredQuestions.length}</span> 件の質問が見つかりました
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-pink-500 hover:to-red-500 transition-all duration-300 transform hover:scale-105 amano-crystal-border"
              >
                🗑️ フィルターをクリア
              </button>
            )}
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {paginatedQuestions.length > 0 ? (
          paginatedQuestions.map((question) => (
            <QuestionCard 
              key={question._id} 
              question={question} 
              onClick={() => onQuestionClick?.(question._id)}
            />
          ))
        ) : (
          <div className="text-center py-12 amano-bg-glass rounded-xl amano-crystal-border">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-200 mb-2">
              質問が見つかりませんでした
            </h3>
            <p className="text-gray-400 mb-4">
              検索条件を変更してお試しください
            </p>
            <button
              onClick={clearAllFilters}
              className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105 amano-crystal-border animate-amano-glow"
            >
              全ての質問を表示
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 py-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 disabled:transform-none amano-crystal-border"
          >
            ← 前へ
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 amano-crystal-border ${
                    currentPage === pageNum
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white animate-amano-glow"
                      : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-blue-600 hover:to-purple-600"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 disabled:transform-none amano-crystal-border"
          >
            次へ →
          </button>
        </div>
      )}

      {/* Page Info */}
      {totalPages > 1 && (
        <div className="text-center text-gray-400 text-sm">
          {totalPages} ページ中 {currentPage} ページ目を表示
          （全 {filteredQuestions.length} 件中 {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredQuestions.length)} 件）
        </div>
      )}
    </div>
  );
}
