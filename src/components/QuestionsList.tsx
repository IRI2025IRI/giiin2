import { useState } from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { QuestionCard } from "./QuestionCard";

interface QuestionsListProps {
  onQuestionClick: (questionId: Id<"questions">) => void;
}

export function QuestionsList({ onQuestionClick }: QuestionsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMember, setSelectedMember] = useState<Id<"councilMembers"> | null>(null);
  const [selectedSessionNumber, setSelectedSessionNumber] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  
  // 検索実行用の状態
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeMember, setActiveMember] = useState<Id<"councilMembers"> | null>(null);
  const [activeSessionNumber, setActiveSessionNumber] = useState("all");

  // ページネーション対応のクエリ
  const { results, status, loadMore } = usePaginatedQuery(
    api.questionsPaginated.listPaginated,
    {
      category: activeCategory === "all" ? undefined : activeCategory,
      memberId: activeMember || undefined,
      searchTerm: activeSearchQuery || undefined,
      sessionNumber: activeSessionNumber === "all" ? undefined : activeSessionNumber,
    },
    { initialNumItems: 20 }
  );

  const councilMembers = useQuery(api.councilMembers.list, { activeOnly: true });
  const sessionNumbers = useQuery(api.questions.getSessionNumbers);

  // 検索実行
  const handleSearch = () => {
    setActiveSearchQuery(searchQuery);
    setActiveCategory(selectedCategory);
    setActiveMember(selectedMember);
    setActiveSessionNumber(selectedSessionNumber);
  };

  // フィルターリセット
  const handleReset = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedMember(null);
    setSelectedSessionNumber("all");
    setActiveSearchQuery("");
    setActiveCategory("all");
    setActiveMember(null);
    setActiveSessionNumber("all");
  };

  if (status === "LoadingFirstPage") {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">読み込み中...</p>
        </div>
      </div>
    );
  }

  // カテゴリー一覧を取得（現在の結果から）
  const categories = Array.from(new Set(results.map(q => q.category))).sort();

  // 質問をソートのみ（フィルタリングはサーバーサイドで実行済み）
  const filteredQuestions = results
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.sessionDate - a.sessionDate;
        case "oldest":
          return a.sessionDate - b.sessionDate;
        case "title":
          return a.title.localeCompare(b.title, 'ja');
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ヘッダー */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          ❓ 議会質問・回答
        </h1>
        <p className="text-gray-300">
          三原市議会での質問と回答を検索・閲覧できます
        </p>
      </div>

      {/* 検索・フィルター */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        {/* 検索バー */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="質問のタイトルや内容で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="auth-input-field w-full"
          />
        </div>

        {/* フィルター切り替えボタン */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-yellow-400 amano-text-glow">
            🔍 フィルター
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

        {/* フィルター内容 */}
        {showFilters && (
          <div className="space-y-4 animate-slideDown">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* カテゴリー */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  カテゴリー
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

              {/* 議員 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  議員
                </label>
                <select
                  value={selectedMember || ""}
                  onChange={(e) => setSelectedMember(e.target.value ? e.target.value as Id<"councilMembers"> : null)}
                  className="auth-input-field text-sm"
                >
                  <option value="">すべて</option>
                  {councilMembers?.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 会議番号 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  会議番号
                </label>
                <select
                  value={selectedSessionNumber}
                  onChange={(e) => setSelectedSessionNumber(e.target.value)}
                  className="auth-input-field text-sm"
                >
                  <option value="all">すべて</option>
                  {sessionNumbers?.map((sessionNumber) => (
                    <option key={sessionNumber} value={sessionNumber}>
                      {sessionNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* ソート */}
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
                  <option value="title">タイトル順</option>
                </select>
              </div>
            </div>

            {/* 検索実行・リセットボタン */}
            <div className="flex space-x-4">
              <button
                onClick={handleSearch}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 amano-glow"
              >
                🔍 検索実行
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                リセット
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 結果表示 */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-yellow-400 amano-text-glow">
            📋 質問一覧
          </h2>
          <div className="text-sm text-gray-400">
            {filteredQuestions.length}件の質問
          </div>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-400 text-lg">該当する質問が見つかりませんでした</p>
            <p className="text-gray-500 text-sm mt-2">検索条件を変更してお試しください</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <QuestionCard
                key={question._id}
                question={question}
                onClick={() => onQuestionClick(question._id)}
              />
            ))}
            
            {/* もっと読み込むボタン */}
            {status === "CanLoadMore" && (
              <div className="text-center pt-6">
                <button
                  onClick={() => loadMore(20)}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  さらに読み込む
                </button>
              </div>
            )}
            
            {status === "LoadingMore" && (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
