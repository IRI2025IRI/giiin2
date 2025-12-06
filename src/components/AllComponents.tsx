import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Authenticated, Unauthenticated } from "convex/react";
import { toast } from "sonner";

// Dashboard Component
export function Dashboard({ 
  onMemberClick, 
  onNewsClick, 
  onViewChange,
  onQuestionClick 
}: {
  onMemberClick: (memberId: Id<"councilMembers">) => void;
  onNewsClick: (newsId: Id<"news">) => void;
  onViewChange: (view: string) => void;
  onQuestionClick: (questionId: Id<"questions">) => void;
}) {
  const recentQuestions = useQuery(api.questions.getRecent, { limit: 5 });
  const topMembers = useQuery(api.councilMembers.list, { activeOnly: true });
  const recentNews = useQuery(api.news.getRecent, { limit: 3 });
  const stats = useQuery(api.questions.getStats);
  const slides = useQuery(api.slideshow.list);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* スライドショー */}
      {slides && slides.length > 0 && (
        <Slideshow slides={slides} />
      )}

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="総質問数"
          value={stats?.totalQuestions || 0}
          icon="❓"
          color="from-yellow-500 to-orange-500"
        />
        <StatsCard
          title="回答済み"
          value={stats?.answeredQuestions || 0}
          icon="✅"
          color="from-green-500 to-emerald-500"
        />
        <StatsCard
          title="議員数"
          value={stats?.memberCount || 0}
          icon="👥"
          color="from-blue-500 to-cyan-500"
        />
        <StatsCard
          title="今月の質問"
          value={stats?.questionCount || 0}
          icon="📅"
          color="from-purple-500 to-pink-500"
        />
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 最新の質問 */}
        <div className="lg:col-span-2">
          <RecentQuestions 
            questions={recentQuestions} 
            onQuestionClick={onQuestionClick}
            onViewAllClick={() => onViewChange("questions")}
          />
        </div>

        {/* トップ議員 */}
        <div>
          <TopMembers 
            members={topMembers} 
            onMemberClick={onMemberClick}
            onViewAllClick={() => onViewChange("members")}
          />
        </div>
      </div>

      {/* 最新ニュース */}
      {recentNews && recentNews.length > 0 && (
        <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-yellow-400 amano-text-glow">
              📢 最新のお知らせ
            </h2>
            <button
              onClick={() => onViewChange("news")}
              className="text-cyan-400 hover:text-yellow-400 transition-colors text-sm"
            >
              すべて見る →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentNews.map((news, index) => (
              <div
                key={news._id}
                className="amano-bg-glass p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all duration-300 animate-slideUp"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => onNewsClick(news._id)}
              >
                <h3 className="font-bold text-yellow-400 mb-2 line-clamp-2">
                  {news.title}
                </h3>
                <p className="text-gray-300 text-sm line-clamp-3 mb-3">
                  {news.content}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 rounded-full">
                    {news.category}
                  </span>
                  <span>
                    {new Date(news.publishDate).toLocaleDateString("ja-JP")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// StatsCard Component
export function StatsCard({ 
  title, 
  value, 
  icon, 
  color 
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="amano-bg-card rounded-xl p-6 amano-crystal-border hover:shadow-2xl transition-all duration-300 group">
      <div className="flex items-center space-x-4">
        <div className={`text-4xl p-3 rounded-full bg-gradient-to-r ${color} text-white group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <div>
          <h3 className="text-gray-300 text-sm font-medium">{title}</h3>
          <p className="text-3xl font-bold text-yellow-400 amano-text-glow animate-countUp">
            {value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// RecentQuestions Component
export function RecentQuestions({ 
  questions, 
  onQuestionClick,
  onViewAllClick 
}: {
  questions: any[] | undefined;
  onQuestionClick: (questionId: Id<"questions">) => void;
  onViewAllClick: () => void;
}) {
  if (!questions) {
    return (
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-yellow-400 amano-text-glow">
          ❓ 最新の質問
        </h2>
        <button
          onClick={onViewAllClick}
          className="text-cyan-400 hover:text-yellow-400 transition-colors text-sm"
        >
          すべて見る →
        </button>
      </div>
      
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            まだ質問がありません
          </div>
        ) : (
          questions.map((question, index) => (
            <div
              key={question._id}
              className="amano-bg-glass p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all duration-300 animate-slideUp"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => onQuestionClick(question._id)}
            >
              <div className="flex items-start space-x-3">
                {question.memberPhotoUrl ? (
                  <img
                    src={question.memberPhotoUrl}
                    alt={question.memberName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-yellow-400"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {question.memberName.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-yellow-400 mb-1 line-clamp-2">
                    {question.title}
                  </h3>
                  <div className="flex items-center space-x-3 text-sm text-gray-300 mb-2">
                    <span className="text-cyan-400">{question.memberName}</span>
                    <span>📅 {new Date(question.sessionDate).toLocaleDateString("ja-JP")}</span>
                  </div>
                  <p className="text-gray-300 text-sm line-clamp-2">
                    {question.content}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs">
                      {question.category}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      question.status === "answered" 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {question.status === "answered" ? "回答済み" : "未回答"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// TopMembers Component
export function TopMembers({ 
  members, 
  onMemberClick,
  onViewAllClick 
}: {
  members: any[] | undefined;
  onMemberClick: (memberId: Id<"councilMembers">) => void;
  onViewAllClick: () => void;
}) {
  if (!members) {
    return (
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-yellow-400 amano-text-glow">
          👥 活発な議員
        </h2>
        <button
          onClick={onViewAllClick}
          className="text-cyan-400 hover:text-yellow-400 transition-colors text-sm"
        >
          すべて見る →
        </button>
      </div>
      
      <div className="space-y-3">
        {members.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            データがありません
          </div>
        ) : (
          members.map((member, index) => (
            <div
              key={member._id}
              className="flex items-center space-x-3 p-3 rounded-lg amano-bg-glass cursor-pointer hover:shadow-lg transition-all duration-300 animate-slideUp"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => onMemberClick(member._id)}
            >
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-purple-600 flex items-center justify-center text-white font-bold">
                  {member.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-yellow-400 truncate">
                  {member.name}
                </h3>
                {member.party && (
                  <p className="text-gray-400 text-sm truncate">
                    {member.party}
                  </p>
                )}
                <p className="text-cyan-400 text-sm">
                  質問数: {member.questionCount || 0}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Slideshow Component
export function Slideshow({ slides }: { slides: any[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides || slides.length === 0) return null;

  return (
    <div className="relative amano-bg-card rounded-xl overflow-hidden amano-crystal-border">
      <div className="relative h-64 md:h-80">
        {slides.map((slide, index) => (
          <div
            key={slide._id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
            style={{
              background: slide.backgroundColor || "linear-gradient(135deg, #1a0b3d, #4c1d95)"
            }}
          >
            <div className="flex items-center h-full p-8">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-yellow-400 mb-4 amano-text-glow">
                  {slide.title}
                </h2>
                <p className="text-gray-200 text-lg mb-6 leading-relaxed">
                  {slide.description}
                </p>
                {slide.linkUrl && (
                  <a
                    href={slide.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                  >
                    <span>詳しく見る</span>
                    <span>→</span>
                  </a>
                )}
              </div>
              {slide.imageUrl && (
                <div className="ml-8 hidden md:block">
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-48 h-32 object-cover rounded-lg border-2 border-yellow-400"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* インジケーター */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-yellow-400 scale-125"
                  : "bg-gray-500 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// QuestionsList Component
export function QuestionsList({ 
  onQuestionClick 
}: {
  onQuestionClick: (questionId: Id<"questions">) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const questions = useQuery(api.questions.list, {
    category: selectedCategory === "all" ? undefined : selectedCategory,
    status: selectedStatus === "all" ? undefined : selectedStatus as any,
    searchTerm: searchTerm || undefined,
  });

  const categories = [
    "all",
    "政策・提案",
    "予算・財政",
    "教育・文化",
    "福祉・医療",
    "環境・インフラ",
    "産業・経済",
    "その他"
  ];

  const statuses = [
    { value: "all", label: "すべて" },
    { value: "pending", label: "未回答" },
    { value: "answered", label: "回答済み" },
    { value: "archived", label: "アーカイブ" }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6 amano-text-glow">
          ❓ 質問・回答一覧
        </h1>

        {/* フィルター */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              カテゴリー
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="auth-input-field"
            >
              <option value="all">すべて</option>
              {categories.slice(1).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ステータス
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="auth-input-field"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              検索
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="質問内容や議員名で検索..."
              className="auth-input-field"
            />
          </div>
        </div>
      </div>

      {/* 質問一覧 */}
      <div className="space-y-4">
        {!questions ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="amano-bg-card rounded-xl p-8 amano-crystal-border text-center">
            <p className="text-gray-400 text-lg">
              条件に一致する質問が見つかりませんでした
            </p>
          </div>
        ) : (
          questions.map((question, index) => (
            <QuestionCard
              key={question._id}
              question={question}
              onClick={() => onQuestionClick(question._id)}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  );
}

// QuestionCard Component
export function QuestionCard({ 
  question, 
  onClick, 
  index 
}: {
  question: any;
  onClick: () => void;
  index: number;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const userLike = useQuery(
    api.likes.getUserLike,
    loggedInUser ? { questionId: question._id } : "skip"
  );
  const likeCount = useQuery(api.likes.getQuestionLikeCount, { questionId: question._id });
  const toggleLike = useMutation(api.likes.toggleQuestionLike);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!loggedInUser) {
      toast.error("いいねするにはログインが必要です");
      return;
    }
    try {
      await toggleLike({ questionId: question._id });
    } catch (error) {
      toast.error("いいねの処理に失敗しました");
    }
  };

  return (
    <div
      className="amano-bg-card rounded-xl p-6 amano-crystal-border cursor-pointer hover:shadow-2xl transition-all duration-300 animate-slideUp"
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={onClick}
    >
      <div className="flex items-start space-x-4">
        {question.memberPhotoUrl ? (
          <img
            src={question.memberPhotoUrl}
            alt={question.memberName}
            className="w-16 h-16 rounded-full object-cover border-2 border-yellow-400"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
            {question.memberName.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-yellow-400 mb-2 amano-text-glow line-clamp-2">
            {question.title}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-300 mb-3">
            <span className="text-cyan-400 font-medium">{question.memberName}</span>
            {question.memberParty && (
              <span className="text-gray-400">({question.memberParty})</span>
            )}
            <span>📅 {new Date(question.sessionDate).toLocaleDateString("ja-JP")}</span>
          </div>
          <p className="text-gray-200 mb-4 line-clamp-3 leading-relaxed">
            {question.content}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm">
                {question.category}
              </span>
              <span className={`text-sm px-3 py-1 rounded-full ${
                question.status === "answered" 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-yellow-500/20 text-yellow-400"
              }`}>
                {question.status === "answered" ? "回答済み" : "未回答"}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {question.responseCount > 0 && (
                <span className="text-cyan-400 text-sm">
                  💬 {question.responseCount}件の回答
                </span>
              )}
              <Authenticated>
                <button
                  onClick={handleLikeClick}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-all duration-300 ${
                    userLike
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      : "bg-gray-500/20 text-gray-400 hover:bg-red-500/20 hover:text-red-400"
                  }`}
                >
                  <span>{userLike ? "❤️" : "🤍"}</span>
                  <span className="text-sm">{likeCount || 0}</span>
                </button>
              </Authenticated>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// CouncilMemberList Component
export function CouncilMemberList({ 
  onMemberClick 
}: {
  onMemberClick: (memberId: Id<"councilMembers">) => void;
}) {
  const [selectedParty, setSelectedParty] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const members = useQuery(api.councilMembers.list, {
    party: selectedParty === "all" ? undefined : selectedParty,
    searchTerm: searchTerm || undefined,
  });

  const parties = useQuery(api.councilMembers.getParties);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6 amano-text-glow">
          👥 議員一覧
        </h1>

        {/* フィルター */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              政党・会派
            </label>
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="auth-input-field"
            >
              <option value="all">すべて</option>
              {parties?.map((party) => (
                <option key={party} value={party}>
                  {party}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              検索
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="議員名で検索..."
              className="auth-input-field"
            />
          </div>
        </div>
      </div>

      {/* 議員一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!members ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          </div>
        ) : members.length === 0 ? (
          <div className="col-span-full amano-bg-card rounded-xl p-8 amano-crystal-border text-center">
            <p className="text-gray-400 text-lg">
              条件に一致する議員が見つかりませんでした
            </p>
          </div>
        ) : (
          members.map((member, index) => (
            <CouncilMemberCard
              key={member._id}
              member={member}
              onClick={() => onMemberClick(member._id)}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  );
}

// CouncilMemberCard Component
export function CouncilMemberCard({ 
  member, 
  onClick, 
  index 
}: {
  member: any;
  onClick: () => void;
  index: number;
}) {
  return (
    <div
      className="amano-bg-card rounded-xl p-6 amano-crystal-border cursor-pointer hover:shadow-2xl transition-all duration-300 group animate-slideUp"
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={onClick}
    >
      <div className="text-center">
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={member.name}
            className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-yellow-400 group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-yellow-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
            {member.name.charAt(0)}
          </div>
        )}
        <h3 className="text-xl font-bold text-yellow-400 mb-2 amano-text-glow">
          {member.name}
        </h3>
        {member.party && (
          <p className="text-gray-300 mb-2">{member.party}</p>
        )}
        {member.position && (
          <p className="text-cyan-400 text-sm mb-3">{member.position}</p>
        )}
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
          <span>質問数: {member.questionCount || 0}</span>
          <span>期: {member.termCount || 1}</span>
        </div>
      </div>
    </div>
  );
}

// CouncilMemberDetail Component
export function CouncilMemberDetail({ 
  memberId, 
  onBack,
  onQuestionClick 
}: {
  memberId: Id<"councilMembers">;
  onBack: () => void;
  onQuestionClick: (questionId: Id<"questions">) => void;
}) {
  const member = useQuery(api.councilMembers.getById, { memberId });
  const questions = useQuery(api.questions.getByMember, { memberId });
  const externalArticles = useQuery(api.externalArticles.getByMember, { memberId, limit: 5 });

  if (!member) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ヘッダー */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-cyan-400 hover:text-yellow-400 transition-colors"
        >
          <span>←</span>
          <span>戻る</span>
        </button>
      </div>

      {/* 議員情報 */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-8">
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={member.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-yellow-400 mx-auto md:mx-0"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-yellow-400 to-purple-600 flex items-center justify-center text-white text-4xl font-bold mx-auto md:mx-0">
              {member.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-yellow-400 mb-4 amano-text-glow">
              {member.name}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
              {member.party && (
                <div>
                  <span className="text-cyan-400 font-medium">政党・会派:</span>
                  <span className="ml-2">{member.party}</span>
                </div>
              )}
              {member.position && (
                <div>
                  <span className="text-cyan-400 font-medium">役職:</span>
                  <span className="ml-2">{member.position}</span>
                </div>
              )}
              {member.committee && (
                <div>
                  <span className="text-cyan-400 font-medium">委員会:</span>
                  <span className="ml-2">{member.committee}</span>
                </div>
              )}
              <div>
                <span className="text-cyan-400 font-medium">任期:</span>
                <span className="ml-2">
                  {new Date(member.termStart).toLocaleDateString("ja-JP")} 〜 
                  {member.termEnd ? new Date(member.termEnd).toLocaleDateString("ja-JP") : "現在"}
                </span>
              </div>
            </div>
            {member.bio && (
              <div className="mt-4">
                <h3 className="text-lg font-bold text-yellow-400 mb-2">プロフィール</h3>
                <p className="text-gray-200 leading-relaxed">{member.bio}</p>
              </div>
            )}
            {(member.email || member.phone || member.website) && (
              <div className="mt-4">
                <h3 className="text-lg font-bold text-yellow-400 mb-2">連絡先</h3>
                <div className="space-y-2">
                  {member.email && (
                    <div>
                      <span className="text-cyan-400">📧</span>
                      <a href={`mailto:${member.email}`} className="ml-2 text-gray-300 hover:text-yellow-400 transition-colors">
                        {member.email}
                      </a>
                    </div>
                  )}
                  {member.phone && (
                    <div>
                      <span className="text-cyan-400">📞</span>
                      <span className="ml-2 text-gray-300">{member.phone}</span>
                    </div>
                  )}
                  {member.website && (
                    <div>
                      <span className="text-cyan-400">🌐</span>
                      <a href={member.website} target="_blank" rel="noopener noreferrer" className="ml-2 text-gray-300 hover:text-yellow-400 transition-colors">
                        公式サイト
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 質問一覧 */}
      {questions && questions.length > 0 && (
        <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6 amano-text-glow">
            ❓ 質問一覧 ({questions.length}件)
          </h2>
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question._id}
                className="amano-bg-glass p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all duration-300 animate-slideUp"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => onQuestionClick(question._id)}
              >
                <h3 className="font-bold text-yellow-400 mb-2 line-clamp-2">
                  {question.title}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-300 mb-2">
                  <span>📅 {new Date(question.sessionDate).toLocaleDateString("ja-JP")}</span>
                  <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs">
                    {question.category}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    question.status === "answered" 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {question.status === "answered" ? "回答済み" : "未回答"}
                  </span>
                </div>
                <p className="text-gray-300 text-sm line-clamp-2">
                  {question.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 外部記事 */}
      {externalArticles && externalArticles.length > 0 && (
        <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6 amano-text-glow">
            📰 最新の活動報告
          </h2>
          <div className="space-y-4">
            {externalArticles.map((article, index) => (
              <div
                key={article._id}
                className="amano-bg-glass p-4 rounded-lg animate-slideUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3 className="font-bold text-yellow-400 mb-2 line-clamp-2">
                  {article.title}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-300 mb-2">
                  <span>📅 {new Date(article.publishedAt).toLocaleDateString("ja-JP")}</span>
                  <span className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs">
                    {article.sourceType}
                  </span>
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs">
                    {article.category}
                  </span>
                </div>
                {article.excerpt && (
                  <p className="text-gray-300 text-sm line-clamp-3 mb-3">
                    {article.excerpt}
                  </p>
                )}
                <a
                  href={article.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-yellow-400 transition-colors text-sm"
                >
                  元記事を読む →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Rankings Component
export function Rankings({ 
  onMemberClick 
}: {
  onMemberClick: (memberId: Id<"councilMembers">) => void;
}) {
  const stats = useQuery(api.questions.getDetailedStats);
  const topMembers = useQuery(api.councilMembers.getTopMembers, { limit: 10 });
  const categoryStats = useQuery(api.questions.getCategoryStats);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6 amano-text-glow">
          📊 統計・ランキング
        </h1>
      </div>

      {/* 全体統計 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="総質問数"
            value={stats.totalQuestions}
            icon="❓"
            color="from-yellow-500 to-orange-500"
          />
          <StatsCard
            title="回答済み"
            value={stats.answeredQuestions}
            icon="✅"
            color="from-green-500 to-emerald-500"
          />
          <StatsCard
            title="回答率"
            value={Math.round((stats.answeredQuestions / stats.totalQuestions) * 100)}
            icon="📈"
            color="from-blue-500 to-cyan-500"
          />
          <StatsCard
            title="今月の質問"
            value={stats.thisMonthQuestions}
            icon="📅"
            color="from-purple-500 to-pink-500"
          />
        </div>
      )}

      {/* 質問数ランキング */}
      {topMembers && (
        <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6 amano-text-glow">
            🏆 質問数ランキング
          </h2>
          <div className="space-y-4">
            {topMembers.map((member, index) => (
              <div
                key={member._id}
                className="flex items-center space-x-4 p-4 rounded-lg amano-bg-glass cursor-pointer hover:shadow-lg transition-all duration-300 animate-slideUp"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => onMemberClick(member._id)}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  index === 0 ? "bg-gradient-to-r from-yellow-400 to-yellow-600" :
                  index === 1 ? "bg-gradient-to-r from-gray-300 to-gray-500" :
                  index === 2 ? "bg-gradient-to-r from-orange-400 to-orange-600" :
                  "bg-gradient-to-r from-purple-500 to-blue-500"
                }`}>
                  {index + 1}
                </div>
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-purple-600 flex items-center justify-center text-white font-bold">
                    {member.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-yellow-400">{member.name}</h3>
                  {member.party && (
                    <p className="text-gray-400 text-sm">{member.party}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-cyan-400">
                    {member.questionCount || 0}
                  </div>
                  <div className="text-sm text-gray-400">質問</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* カテゴリー別統計 */}
      {categoryStats && (
        <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6 amano-text-glow">
            📋 カテゴリー別統計
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryStats.map((stat, index) => (
              <div
                key={stat.category}
                className="flex items-center justify-between p-4 rounded-lg amano-bg-glass animate-slideUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="font-medium text-gray-200">{stat.category}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-cyan-400 h-2 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${(stat.count / Math.max(...categoryStats.map(s => s.count))) * 100}%`,
                        animationDelay: `${index * 200}ms`
                      }}
                    />
                  </div>
                  <span className="text-cyan-400 font-bold min-w-[3rem] text-right">
                    {stat.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// News Component
export function News({ 
  onNewsClick 
}: {
  onNewsClick: (newsId: Id<"news">) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const news = useQuery(api.news.list, {
    category: selectedCategory === "all" ? undefined : selectedCategory,
  });

  const categories = [
    "all",
    "重要なお知らせ",
    "システム更新",
    "イベント情報",
    "その他"
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6 amano-text-glow">
          📢 お知らせ
        </h1>

        {/* カテゴリーフィルター */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            カテゴリー
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="auth-input-field max-w-xs"
          >
            <option value="all">すべて</option>
            {categories.slice(1).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ニュース一覧 */}
      <div className="space-y-4">
        {!news ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          </div>
        ) : news.length === 0 ? (
          <div className="amano-bg-card rounded-xl p-8 amano-crystal-border text-center">
            <p className="text-gray-400 text-lg">
              お知らせがありません
            </p>
          </div>
        ) : (
          news.map((item, index) => (
            <div
              key={item._id}
              className="amano-bg-card rounded-xl p-6 amano-crystal-border cursor-pointer hover:shadow-2xl transition-all duration-300 animate-slideUp"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => onNewsClick(item._id)}
            >
              <div className="flex items-start space-x-4">
                {item.thumbnailUrl && (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-24 h-24 object-cover rounded-lg border-2 border-yellow-400"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-yellow-400 mb-2 amano-text-glow line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-300 mb-3">
                    <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full">
                      {item.category}
                    </span>
                    <span>📅 {new Date(item.publishDate).toLocaleDateString("ja-JP")}</span>
                  </div>
                  <p className="text-gray-200 line-clamp-3 leading-relaxed">
                    {item.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// NewsDetail Component
export function NewsDetail({ 
  newsId, 
  onBack 
}: {
  newsId: Id<"news">;
  onBack: () => void;
}) {
  const news = useQuery(api.news.getById, { newsId });

  if (!news) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ヘッダー */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-cyan-400 hover:text-yellow-400 transition-colors"
        >
          <span>←</span>
          <span>戻る</span>
        </button>
      </div>

      {/* ニュース詳細 */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-yellow-400 mb-4 amano-text-glow">
            {news.title}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-300">
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full">
              {news.category}
            </span>
            <span>📅 {new Date(news.publishDate).toLocaleDateString("ja-JP")}</span>
            <span>👤 {news.authorName}</span>
          </div>
        </div>

        {news.thumbnailUrl && (
          <div className="mb-6">
            <img
              src={news.thumbnailUrl}
              alt={news.title}
              className="w-full max-w-2xl mx-auto rounded-lg border-2 border-yellow-400"
            />
          </div>
        )}

        <div className="prose prose-invert max-w-none">
          <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
            {news.content}
          </div>
        </div>
      </div>
    </div>
  );
}

// Contact Component
export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "一般的な質問"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitContact = useMutation(api.contact.submit);

  const categories = [
    "一般的な質問",
    "技術的な問題",
    "機能の要望",
    "バグ報告",
    "その他"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("すべての項目を入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitContact(formData);
      toast.success("お問い合わせを送信しました");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        category: "一般的な質問"
      });
    } catch (error) {
      toast.error("送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6 amano-text-glow">
          📧 お問い合わせ
        </h1>
        <p className="text-gray-300 mb-6">
          ご質問やご意見がございましたら、お気軽にお問い合わせください。
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                お名前 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="auth-input-field"
                placeholder="山田太郎"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                メールアドレス *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="auth-input-field"
                placeholder="example@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              カテゴリー
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="auth-input-field"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              件名 *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="auth-input-field"
              placeholder="お問い合わせの件名"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              メッセージ *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="auth-input-field min-h-[120px] resize-y"
              placeholder="お問い合わせ内容をご記入ください"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="auth-button"
          >
            {isSubmitting ? "送信中..." : "送信する"}
          </button>
        </form>
      </div>
    </div>
  );
}

// FAQ Component
export function FAQ() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const faqItems = useQuery(api.faq.list, {
    category: selectedCategory === "all" ? undefined : selectedCategory,
    searchTerm: searchTerm || undefined,
  });

  const categories = useQuery(api.faq.getCategories);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6 amano-text-glow">
          💡 よくある質問
        </h1>

        {/* フィルター */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              カテゴリー
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="auth-input-field"
            >
              <option value="all">すべて</option>
              {categories?.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              検索
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="質問内容で検索..."
              className="auth-input-field"
            />
          </div>
        </div>
      </div>

      {/* FAQ一覧 */}
      <div className="space-y-4">
        {!faqItems ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          </div>
        ) : faqItems.length === 0 ? (
          <div className="amano-bg-card rounded-xl p-8 amano-crystal-border text-center">
            <p className="text-gray-400 text-lg">
              条件に一致するFAQが見つかりませんでした
            </p>
          </div>
        ) : (
          faqItems.map((item, index) => (
            <div
              key={item._id}
              className="amano-bg-card rounded-xl p-6 amano-crystal-border animate-slideUp"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <button
                onClick={() => toggleExpanded(item._id)}
                className="w-full text-left flex items-center justify-between"
              >
                <h3 className="text-lg font-bold text-yellow-400 amano-text-glow pr-4">
                  Q. {item.question}
                </h3>
                <span className="text-cyan-400 text-xl flex-shrink-0">
                  {expandedItems.has(item._id) ? "−" : "+"}
                </span>
              </button>
              
              {expandedItems.has(item._id) && (
                <div className="mt-4 pt-4 border-t border-purple-500/30 animate-slideDown">
                  <div className="flex items-start space-x-3">
                    <span className="text-cyan-400 font-bold text-lg">A.</span>
                    <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {item.answer}
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-400">
                    カテゴリー: {item.category}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ExternalArticles Component
export function ExternalArticles({ 
  onArticleClick 
}: {
  onArticleClick: (articleId: Id<"externalArticles">) => void;
}) {
  const [selectedMember, setSelectedMember] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSourceType, setSelectedSourceType] = useState("all");

  const articles = useQuery(api.externalArticles.list, {
    memberId: selectedMember === "all" ? undefined : selectedMember as Id<"councilMembers">,
    category: selectedCategory === "all" ? undefined : selectedCategory,
    sourceType: selectedSourceType === "all" ? undefined : selectedSourceType,
  });

  const members = useQuery(api.councilMembers.list, {});

  const categories = [
    "all",
    "政策・提案",
    "活動報告",
    "市政情報",
    "地域イベント",
    "お知らせ",
    "その他"
  ];

  const sourceTypes = [
    "all",
    "blog",
    "facebook",
    "twitter",
    "instagram",
    "rss"
  ];

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case "blog": return "ブログ";
      case "facebook": return "Facebook";
      case "twitter": return "Twitter";
      case "instagram": return "Instagram";
      case "rss": return "RSS";
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6 amano-text-glow">
          📰 議員ブログ・SNS
        </h1>

        {/* フィルター */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              議員
            </label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="auth-input-field"
            >
              <option value="all">すべて</option>
              {members?.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              カテゴリー
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="auth-input-field"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "すべて" : category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ソース
            </label>
            <select
              value={selectedSourceType}
              onChange={(e) => setSelectedSourceType(e.target.value)}
              className="auth-input-field"
            >
              {sourceTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "all" ? "すべて" : getSourceTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 記事一覧 */}
      <div className="space-y-4">
        {!articles ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          </div>
        ) : articles.length === 0 ? (
          <div className="amano-bg-card rounded-xl p-8 amano-crystal-border text-center">
            <p className="text-gray-400 text-lg">
              条件に一致する記事が見つかりませんでした
            </p>
          </div>
        ) : (
          articles.map((article, index) => (
            <div
              key={article._id}
              className="amano-bg-card rounded-xl p-6 amano-crystal-border cursor-pointer hover:shadow-2xl transition-all duration-300 animate-slideUp"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => onArticleClick(article._id)}
            >
              <div className="flex items-start space-x-4">
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-24 h-24 object-cover rounded-lg border-2 border-yellow-400"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-yellow-400 mb-2 amano-text-glow line-clamp-2">
                    {article.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-300 mb-3">
                    <span className="text-cyan-400 font-medium">{article.memberName}</span>
                    <span>📅 {new Date(article.publishedAt).toLocaleDateString("ja-JP")}</span>
                    <span className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs">
                      {getSourceTypeLabel(article.sourceType)}
                    </span>
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs">
                      {article.category}
                    </span>
                  </div>
                  {article.excerpt && (
                    <p className="text-gray-200 line-clamp-3 leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ExternalArticleDetail Component
export function ExternalArticleDetail({ 
  articleId, 
  onBack 
}: {
  articleId: Id<"externalArticles">;
  onBack: () => void;
}) {
  const article = useQuery(api.externalArticles.getById, { articleId });

  useEffect(() => {
    if (article) {
      // ビューカウントを増加
      // この処理は非同期で行い、エラーが発生しても無視する
    }
  }, [article]);

  if (!article) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case "blog": return "ブログ";
      case "facebook": return "Facebook";
      case "twitter": return "Twitter";
      case "instagram": return "Instagram";
      case "rss": return "RSS";
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ヘッダー */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-cyan-400 hover:text-yellow-400 transition-colors"
        >
          <span>←</span>
          <span>戻る</span>
        </button>
      </div>

      {/* 記事詳細 */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-yellow-400 mb-4 amano-text-glow">
            {article.title}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-300 mb-4">
            <span className="text-cyan-400 font-medium">{article.memberName}</span>
            <span>📅 {new Date(article.publishedAt).toLocaleDateString("ja-JP")}</span>
            <span className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 rounded-full">
              {getSourceTypeLabel(article.sourceType)}
            </span>
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full">
              {article.category}
            </span>
          </div>
        </div>

        {article.imageUrl && (
          <div className="mb-6">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full max-w-2xl mx-auto rounded-lg border-2 border-yellow-400"
            />
          </div>
        )}

        <div className="prose prose-invert max-w-none mb-6">
          <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
            {article.content}
          </div>
        </div>

        <div className="border-t border-purple-500/30 pt-6">
          <a
            href={article.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
          >
            <span>元記事を読む</span>
            <span>↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}

// TermsAndPrivacy Component
export function TermsAndPrivacy() {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6 amano-text-glow">
          📋 利用規約・プライバシーポリシー
        </h1>

        {/* タブ */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab("terms")}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "terms"
                ? "bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white"
                : "text-gray-300 hover:text-white hover:bg-purple-800/30"
            }`}
          >
            利用規約
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "privacy"
                ? "bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white"
                : "text-gray-300 hover:text-white hover:bg-purple-800/30"
            }`}
          >
            プライバシーポリシー
          </button>
        </div>
      </div>

      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        {activeTab === "terms" ? (
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">利用規約</h2>
            <div className="text-gray-200 leading-relaxed space-y-4">
              <p>
                本利用規約（以下「本規約」）は、GIIIN（以下「当サービス」）の利用条件を定めるものです。
                ユーザーの皆様には、本規約に同意の上、当サービスをご利用いただきます。
              </p>
              
              <h3 className="text-xl font-bold text-cyan-400 mt-6 mb-3">第1条（適用）</h3>
              <p>
                本規約は、ユーザーと当サービスとの間の当サービスの利用に関わる一切の関係に適用されるものとします。
              </p>
              
              <h3 className="text-xl font-bold text-cyan-400 mt-6 mb-3">第2条（利用登録）</h3>
              <p>
                当サービスにおいては、登録希望者が本規約に同意の上、当サービスの定める方法によって利用登録を申請し、
                当サービスがこれを承認することによって、利用登録が完了するものとします。
              </p>
              
              <h3 className="text-xl font-bold text-cyan-400 mt-6 mb-3">第3条（禁止事項）</h3>
              <p>ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません。</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>当サービスの内容等、当サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
                <li>当サービス、ほかのユーザー、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                <li>当サービスによって得られた情報を商業的に利用する行為</li>
                <li>当サービスの運営を妨害するおそれのある行為</li>
                <li>不正アクセスをし、またはこれを試みる行為</li>
                <li>その他、当サービスが不適切と判断する行為</li>
              </ul>
              
              <h3 className="text-xl font-bold text-cyan-400 mt-6 mb-3">第4条（本サービスの提供の停止等）</h3>
              <p>
                当サービスは、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
              </p>
              
              <h3 className="text-xl font-bold text-cyan-400 mt-6 mb-3">第5条（著作権）</h3>
              <p>
                ユーザーは、自ら著作権等の必要な知的財産権を有するか、または必要な権利者の許諾を得た文章、画像や映像等の情報に関してのみ、本サービスを利用し、投稿ないしアップロードすることができるものとします。
              </p>
            </div>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">プライバシーポリシー</h2>
            <div className="text-gray-200 leading-relaxed space-y-4">
              <p>
                GIIIN（以下「当サービス」）は、本ウェブサイト上で提供するサービス（以下「本サービス」）における、
                ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
              </p>
              
              <h3 className="text-xl font-bold text-cyan-400 mt-6 mb-3">第1条（個人情報）</h3>
              <p>
                「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、
                当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び容貌、
                指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。
              </p>
              
              <h3 className="text-xl font-bold text-cyan-400 mt-6 mb-3">第2条（個人情報の収集方法）</h3>
              <p>
                当サービスは、ユーザーが利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレス、銀行口座番号、
                クレジットカード番号、運転免許証番号などの個人情報をお尋ねすることがあります。
                また、ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を、
                当サービスの提携先（情報提供元、広告主、広告配信先などを含みます。以下「提携先」といいます。）などから収集することがあります。
              </p>
              
              <h3 className="text-xl font-bold text-cyan-400 mt-6 mb-3">第3条（個人情報を収集・利用する目的）</h3>
              <p>当サービスが個人情報を収集・利用する目的は、以下のとおりです。</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>当サービスの提供・運営のため</li>
                <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
                <li>ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等及び当サービスが提供する他のサービスの案内のメールを送付するため</li>
                <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
                <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
                <li>ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
                <li>有料サービスにおいて、ユーザーに利用料金を請求するため</li>
                <li>上記の利用目的に付随する目的</li>
              </ul>
              
              <h3 className="text-xl font-bold text-cyan-400 mt-6 mb-3">第4条（利用目的の変更）</h3>
              <p>
                当サービスは、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。
                利用目的の変更を行った場合には、変更後の目的について、当サービス所定の方法により、ユーザーに通知し、または本ウェブサイト上に公表するものとします。
              </p>
              
              <h3 className="text-xl font-bold text-cyan-400 mt-6 mb-3">第5条（個人情報の第三者提供）</h3>
              <p>
                当サービスは、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。
                ただし、個人情報保護法その他の法令で認められる場合を除きます。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
