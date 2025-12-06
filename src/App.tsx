import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignOutButton } from "./SignOutButton";
import { ScrollToTopButton } from "./components/ScrollToTopButton";
import { LoginModal } from "./components/LoginModal";
import { useUrlNavigation } from "./hooks/useUrlNavigation";

// コンポーネントを通常のimportで読み込み（パフォーマンス最適化済み）
import { Dashboard } from "./components/Dashboard";
import { QuestionsList } from "./components/QuestionsList";
import { CouncilMemberList } from "./components/CouncilMemberList";
import { CouncilMemberDetail } from "./components/CouncilMemberDetail";
import { Rankings } from "./components/Rankings";
import { News } from "./components/News";
import { NewsDetail } from "./components/NewsDetail";
import { Contact } from "./components/Contact";
import { FAQ } from "./components/FAQ";
import { AdminPanel } from "./components/AdminPanel";
import { TermsAndPrivacy } from "./components/TermsAndPrivacy";
import { ExternalArticles } from "./components/ExternalArticles";
import { ExternalArticleDetail } from "./components/ExternalArticleDetail";

// パフォーマンス最適化フック
function usePerformanceMode() {
  return useMemo(() => {
    if (typeof window === 'undefined') return 'medium';
    
    const hardwareConcurrency = navigator.hardwareConcurrency || 2;
    const memory = (navigator as any).deviceMemory || 2;
    
    let score = 0;
    if (hardwareConcurrency >= 8) score += 3;
    else if (hardwareConcurrency >= 4) score += 2;
    else score += 1;
    
    if (memory >= 8) score += 3;
    else if (memory >= 4) score += 2;
    else score += 1;
    
    if (score >= 5) return 'high';
    else if (score >= 3) return 'medium';
    else return 'low';
  }, []);
}

// ローディングコンポーネント（削除）

// ヘルパー関数：回答内容のキーワードを装飾
function formatResponseContent(content: string) {
  return content.split('\n').map((line, lineIndex) => {
    let formattedLine = line;
    
    // 「質問側の内容」を装飾
    if (line.includes('質問側の内容')) {
      formattedLine = line.replace(
        /質問側の内容/g,
        '<span class="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-2 py-1 rounded font-bold amano-text-glow">質問側の内容</span>'
      );
    }
    
    // 「市側の回答」を装飾
    if (line.includes('市側の回答')) {
      formattedLine = formattedLine.replace(
        /市側の回答/g,
        '<span class="bg-gradient-to-r from-cyan-400 to-blue-400 text-black px-2 py-1 rounded font-bold amano-text-glow">市側の回答</span>'
      );
    }
    
    return <div key={lineIndex} className="mb-1" dangerouslySetInnerHTML={{ __html: formattedLine }} />;
  });
}

// ページトップにスクロールするヘルパー関数
const scrollToTop = (smooth: boolean = true) => {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
};

function AppContent() {
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedMemberId, setSelectedMemberId] = useState<Id<"councilMembers"> | null>(null);
  const [selectedNewsId, setSelectedNewsId] = useState<Id<"news"> | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<Id<"externalArticles"> | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<Id<"questions"> | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // パフォーマンス最適化
  const performanceMode = usePerformanceMode();
  const enableAnimations = performanceMode === 'high';
  const enableBlur = performanceMode !== 'low';

  // メニュー設定を取得
  const visibleMenus = useQuery(api.menuSettings.getVisibleMenus);
  
  // 管理者権限チェック（認証済みユーザーのみ）
  const isAdmin = useQuery(api.admin.isAdmin);
  
  // ログインユーザー情報を取得
  const loggedInUser = useQuery(api.auth.loggedInUser);
  
  // ユーザーの役割を取得（パフォーマンス向上のため条件付き）
  const userRole = useQuery(api.admin.getUserRole, isAdmin ? {} : "skip");

  // パフォーマンスクラスを動的に設定
  useEffect(() => {
    document.body.className = `performance-${performanceMode}`;
  }, [performanceMode]);

  // 認証状態を監視してログインモーダルを自動で閉じる
  useEffect(() => {
    if (isAdmin !== undefined && isAdmin !== false) {
      setShowLoginModal(false);
    }
  }, [isAdmin]);

  // URL navigation hook
  useUrlNavigation({
    currentView,
    setCurrentView,
    setSelectedMemberId,
    setSelectedNewsId,
    setSelectedArticleId,
    setSelectedQuestionId,
  });

  // メニューアイテムの定義（デフォルト）
  const defaultMenuItems = [
    { key: "questions", name: "質問・回答", icon: "❓" },
    { key: "members", name: "議員一覧", icon: "👥" },
    { key: "rankings", name: "統計", icon: "📊" },
    { key: "news", name: "お知らせ", icon: "📢" },
    { key: "externalArticles", name: "議員ブログ・SNS", icon: "📰" },
    { key: "faq", name: "よくある質問", icon: "💡" },
    { key: "contact", name: "お問い合わせ", icon: "📧" },
  ];

  // 表示するメニューアイテムを決定（メモ化）
  const menuItems = useMemo(() => {
    return visibleMenus && visibleMenus.length > 0 
      ? visibleMenus.map(menu => ({
          key: menu.menuKey,
          name: menu.menuName,
          icon: defaultMenuItems.find(item => item.key === menu.menuKey)?.icon || "📄"
        }))
      : defaultMenuItems.filter(item => 
          // デフォルトでは議員ブログ・SNSは非表示
          item.key !== "externalArticles"
        );
  }, [visibleMenus]);

  const handleMemberClick = useCallback((memberId: Id<"councilMembers">) => {
    setSelectedMemberId(memberId);
    setCurrentView("memberDetail");
    setShowMobileMenu(false);
    scrollToTop(enableAnimations);
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("view", "memberDetail");
    url.searchParams.set("member", memberId);
    url.searchParams.delete("news");
    url.searchParams.delete("article");
    url.searchParams.delete("question");
    window.history.pushState({}, "", url.toString());
  }, [enableAnimations]);

  const handleNewsClick = useCallback((newsId: Id<"news">) => {
    setSelectedNewsId(newsId);
    setCurrentView("newsDetail");
    setShowMobileMenu(false);
    scrollToTop(enableAnimations);
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("view", "newsDetail");
    url.searchParams.set("news", newsId);
    url.searchParams.delete("member");
    url.searchParams.delete("article");
    url.searchParams.delete("question");
    window.history.pushState({}, "", url.toString());
  }, [enableAnimations]);

  const handleArticleClick = useCallback((articleId: Id<"externalArticles">) => {
    setSelectedArticleId(articleId);
    setCurrentView("externalArticleDetail");
    setShowMobileMenu(false);
    scrollToTop(enableAnimations);
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("view", "externalArticleDetail");
    url.searchParams.set("article", articleId);
    url.searchParams.delete("member");
    url.searchParams.delete("news");
    url.searchParams.delete("question");
    window.history.pushState({}, "", url.toString());
  }, [enableAnimations]);

  const handleQuestionClick = useCallback((questionId: Id<"questions">) => {
    setSelectedQuestionId(questionId);
    setCurrentView("questionDetail");
    setShowMobileMenu(false);
    scrollToTop(enableAnimations);
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("view", "questionDetail");
    url.searchParams.set("question", questionId);
    url.searchParams.delete("member");
    url.searchParams.delete("news");
    url.searchParams.delete("article");
    window.history.pushState({}, "", url.toString());
  }, [enableAnimations]);

  const handleViewChange = useCallback((view: string) => {
    // 管理画面にアクセスしようとした場合の処理を改善
    if (view === "admin") {
      // 認証状態をチェック
      if (isAdmin === undefined) {
        // まだ認証状態が不明な場合は少し待つ
        return;
      }
      
      if (isAdmin === false) {
        // 認証されていない場合はログインモーダルを表示
        setShowLoginModal(true);
        return;
      }
      
      // 認証済みで管理者権限がある場合は管理画面に遷移
    }

    setCurrentView(view);
    setSelectedMemberId(null);
    setSelectedNewsId(null);
    setSelectedArticleId(null);
    setSelectedQuestionId(null);
    setShowMobileMenu(false);
    scrollToTop(enableAnimations);
    
    // Update URL
    const url = new URL(window.location.href);
    if (view === "dashboard") {
      url.searchParams.delete("view");
    } else {
      url.searchParams.set("view", view);
    }
    url.searchParams.delete("member");
    url.searchParams.delete("news");
    url.searchParams.delete("article");
    url.searchParams.delete("question");
    window.history.pushState({}, "", url.toString());
  }, [isAdmin, enableAnimations]);

  const renderContent = () => {
    switch (currentView) {
            case "dashboard":
              return (
                <Dashboard 
                  onMemberClick={handleMemberClick}
                  onNewsClick={handleNewsClick}
                  onViewChange={handleViewChange}
                  onQuestionClick={handleQuestionClick}
                />
              );
            case "questions":
              return <QuestionsList onQuestionClick={handleQuestionClick} />;
            case "questionDetail":
              return selectedQuestionId ? (
                <QuestionDetail 
                  questionId={selectedQuestionId} 
                  onBack={() => handleViewChange("questions")}
                  onMemberClick={handleMemberClick}
                />
              ) : (
                <QuestionsList onQuestionClick={handleQuestionClick} />
              );
            case "members":
              return <CouncilMemberList onMemberClick={handleMemberClick} />;
            case "memberDetail":
              return selectedMemberId ? (
                <CouncilMemberDetail 
                  memberId={selectedMemberId} 
                  onBack={() => handleViewChange("members")}
                  onQuestionClick={handleQuestionClick}
                />
              ) : (
                <CouncilMemberList onMemberClick={handleMemberClick} />
              );
            case "rankings":
              return <Rankings onMemberClick={handleMemberClick} />;
            case "news":
              return <News onNewsClick={handleNewsClick} />;
            case "newsDetail":
              return selectedNewsId ? (
                <NewsDetail 
                  newsId={selectedNewsId} 
                  onBack={() => handleViewChange("news")}
                />
              ) : (
                <News onNewsClick={handleNewsClick} />
              );
            case "externalArticles":
              return <ExternalArticles onArticleClick={handleArticleClick} />;
            case "externalArticleDetail":
              return selectedArticleId ? (
                <ExternalArticleDetail 
                  articleId={selectedArticleId} 
                  onBack={() => handleViewChange("externalArticles")}
                />
              ) : (
                <ExternalArticles onArticleClick={handleArticleClick} />
              );
            case "faq":
              return <FAQ />;
            case "contact":
              return <Contact />;
            case "admin":
              return <AdminPanel />;
            case "terms":
              return <TermsAndPrivacy />;
            default:
              return (
                <Dashboard 
                  onMemberClick={handleMemberClick}
                  onNewsClick={handleNewsClick}
                  onViewChange={handleViewChange}
                  onQuestionClick={handleQuestionClick}
                />
              );
        }
  };

  // 軽量化されたサイドバースタイル
  const sidebarClass = enableBlur 
    ? "amano-bg-sidebar" 
    : "bg-gray-900/95";

  const buttonClass = enableAnimations
    ? "w-full text-left px-4 py-3 rounded-lg transition-all duration-300 flex items-center space-x-3"
    : "w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3";

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* サイドバー - PC版では固定、モバイル版では通常通り */}
      <div className={`lg:w-64 lg:fixed lg:h-screen lg:overflow-y-auto ${sidebarClass} border-r border-purple-500/30 ${showMobileMenu ? 'block' : 'hidden lg:block'}`}>
        <div className="p-6">
          {/* ロゴ・タイトル */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
               GIIIN/ギイーン
            </h1>
            <p className="text-xs text-gray-400 mt-1">「何してるの？」を身近に。</p>
          </div>

          {/* ナビゲーション */}
          <nav className="space-y-2">
            <button
              onClick={() => handleViewChange("dashboard")}
              className={`${buttonClass} ${
                currentView === "dashboard"
                  ? "bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white shadow-lg transform scale-105 amano-card-glow"
                  : "text-gray-300 hover:bg-purple-800/30 hover:text-white"
              }`}
            >
              <span className="text-xl">🏠</span>
              <span className="font-medium">ダッシュボード</span>
            </button>

            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleViewChange(item.key)}
                className={`${buttonClass} ${
                  currentView === item.key
                    ? "bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white shadow-lg transform scale-105 amano-card-glow"
                    : "text-gray-300 hover:bg-purple-800/30 hover:text-white"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </button>
            ))}

            {/* 管理メニューは管理者のみ表示 */}
            <Authenticated>
              {isAdmin && (
                <button
                  onClick={() => handleViewChange("admin")}
                  className={`${buttonClass} ${
                    currentView === "admin"
                      ? "bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white shadow-lg transform scale-105 amano-card-glow"
                      : "text-gray-300 hover:bg-purple-800/30 hover:text-white"
                  }`}
                >
                  <span className="text-xl">🛠️</span>
                  <span className="font-medium">管理</span>
                </button>
              )}
            </Authenticated>
          </nav>

          {/* ユーザー情報 */}
          <div className="mt-8 pt-6 border-t border-purple-500/30">
            <Authenticated>
              {/* ユーザー名と権限表示 */}
              {loggedInUser && (
                <div className="mb-4 p-3 rounded-lg amano-bg-glass border border-purple-500/20">
                  <div className="text-sm text-gray-300 mb-1">ログイン中</div>
                  <div className="font-medium text-yellow-400 text-sm mb-1">
                    {loggedInUser.name || loggedInUser.email || "ユーザー"}
                  </div>
                  <div className="text-xs text-cyan-400">
                    {userRole === "superAdmin" && "🔧 スーパー管理者"}
                    {userRole === "admin" && "⚙️ 管理者"}
                    {userRole === "user" && "👤 一般ユーザー"}
                    {userRole === "guest" && "🔒 ゲスト"}
                  </div>
                </div>
              )}
              <SignOutButton />
            </Authenticated>
            <Unauthenticated>
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full px-4 py-2 bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
              >
                新規/ログイン
              </button>
            </Unauthenticated>
          </div>

          {/* フッター */}
          <div className="mt-8 pt-6 border-t border-purple-500/30 text-center">
            <button
              onClick={() => handleViewChange("terms")}
              className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
            >
              利用規約・プライバシーポリシー
            </button>
            <p className="text-xs text-gray-500 mt-2">©2025 GIIIN</p>
          </div>
        </div>
      </div>

      {/* メインコンテンツ - PC版ではサイドバー分の左マージンを追加 */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* モバイルヘッダー */}
        <div className="lg:hidden bg-gray-900/95 backdrop-blur-sm border-b border-purple-500/30 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              GIIIN/ギイーン
            </h1>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              <span className="text-xl">{showMobileMenu ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>

        {/* コンテンツエリア */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* ログインモーダル */}
      {showLoginModal && (
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen amano-bg text-white">
      <AppContent />
      <ScrollToTopButton />
    </div>
  );
}

// QuestionDetail component
function QuestionDetail({ 
  questionId, 
  onBack, 
  onMemberClick 
}: { 
  questionId: Id<"questions">, 
  onBack: () => void,
  onMemberClick: (memberId: Id<"councilMembers">) => void
}) {
  const question = useQuery(api.questions.getById, { questionId });
  const responses = useQuery(api.questions.getResponses, { questionId });

  if (!question) {
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

      {/* 質問詳細 */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <div className="flex items-start space-x-4 mb-6">
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-yellow-400 mb-2 amano-text-glow">
              {question.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-300 mb-4">
              <button
                onClick={() => onMemberClick(question.councilMemberId)}
                className="text-cyan-400 hover:text-yellow-400 transition-colors font-medium"
              >
                {question.memberName}
              </button>
              {question.memberParty && (
                <span className="text-gray-400">({question.memberParty})</span>
              )}
              <span>📅 {new Date(question.sessionDate).toLocaleDateString("ja-JP")}</span>
              <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs">
                {question.category}
              </span>
            </div>
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
            {question.content}
          </div>
        </div>

        {question.youtubeUrl && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-yellow-400 mb-3">📹 動画</h3>
            <a
              href={question.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-cyan-400 hover:text-yellow-400 transition-colors"
            >
              <span>YouTube で見る</span>
              <span>↗</span>
            </a>
          </div>
        )}
      </div>

      {/* 回答一覧 */}
      {responses && responses.length > 0 && (
        <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
          <h2 className="text-xl font-bold text-yellow-400 mb-6 amano-text-glow">
            💬 AI要約回答 ({responses.length}件)
          </h2>
          <div className="space-y-6">
            {responses.map((response, index) => (
              <div
                key={response._id}
                className="amano-bg-glass p-4 rounded-lg animate-slideUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">🏛️</span>
                  <div>
                    <div className="font-medium text-gray-200">
                      {response.respondentTitle || "回答者"}
                    </div>
                    {response.department && (
                      <div className="text-sm text-gray-400">{response.department}</div>
                    )}
                  </div>
                  <div className="ml-auto text-sm text-gray-400">
                    📅 {new Date(response.responseDate).toLocaleDateString("ja-JP")}
                  </div>
                </div>
                <div className="text-gray-200 leading-relaxed">
                  {formatResponseContent(response.content)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
