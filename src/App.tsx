import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignOutButton } from "./SignOutButton";
import { ScrollToTopButton } from "./components/ScrollToTopButton";
import { LoginModal } from "./components/LoginModal";
import { InfoTooltip } from "./components/InfoTooltip";
import { useUrlNavigation } from "./hooks/useUrlNavigation";
import { isLINEBrowser, safeScrollTo, getYouTubeThumbnailUrl } from "./lib/utils";
import { formatResponseContent } from "./lib/textHighlight";

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
import { TermsAndPrivacy } from "./components/TermsAndPrivacy";
import { ExternalArticles } from "./components/ExternalArticles";
import { ExternalArticleDetail } from "./components/ExternalArticleDetail";
import { Report } from "./components/Report";

// 管理画面は一般利用者の大半が開かないため、初期バンドルから分離して遅延読み込みする
// （TermsAndPrivacyはLoginModal側でも使われておりバンドル分離の効果がないため対象外）
const AdminPanel = lazy(() => import("./components/AdminPanel").then((m) => ({ default: m.AdminPanel })));

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

// ページトップにスクロールするヘルパー関数
// LINEアプリ内ブラウザは behavior: 'smooth' が正しく動作しないことがあるため、
// LINEブラウザでは常に即時スクロールにフォールバックする
const scrollToTop = (smooth: boolean = true) => {
  safeScrollTo({
    top: 0,
    behavior: smooth && !isLINEBrowser() ? 'smooth' : 'auto'
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

  // 管理者権限がないユーザーが ?view=admin などURL直打ちで管理画面に遷移した場合の対策
  useEffect(() => {
    if (currentView === "admin" && isAdmin === false) {
      setCurrentView("dashboard");
      setShowLoginModal(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("view");
      window.history.replaceState({}, "", url.toString());
    }
  }, [currentView, isAdmin]);

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
    { key: "questions", name: "質問・回答" },
    { key: "members", name: "議員一覧" },
    { key: "rankings", name: "統計" },
    { key: "news", name: "お知らせ" },
    { key: "externalArticles", name: "議員ブログ・SNS" },
    { key: "faq", name: "よくある質問" },
    { key: "contact", name: "お問い合わせ" },
  ];

  // 表示するメニューアイテムを決定（メモ化）
  const menuItems = useMemo(() => {
    return visibleMenus && visibleMenus.length > 0
      ? visibleMenus.map(menu => ({
          key: menu.menuKey,
          name: menu.menuName,
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
              return <Rankings onMemberClick={handleMemberClick} onQuestionClick={handleQuestionClick} />;
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
            case "report":
              return <Report onMemberClick={handleMemberClick} />;
            case "admin":
              // isAdmin が確定して true の場合のみ管理画面を描画する（URL直打ちでのバイパス対策）
              return isAdmin === true ? <AdminPanel /> : null;
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

  const roleLabel =
    userRole === "superAdmin" ? "スーパー管理者" :
    userRole === "admin" ? "管理者" :
    userRole === "user" ? "一般ユーザー" :
    userRole === "guest" ? "ゲスト" : "";

  const allNavSteps = [
    { key: "dashboard", name: "ダッシュボード" },
    { key: "report", name: "レポート" },
    ...menuItems,
    ...(isAdmin ? [{ key: "admin", name: "管理" }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* トップバー */}
      <header className="ga-topbar">
        <div className="ga-topbar-inner">
          <button onClick={() => handleViewChange("dashboard")} className="ga-brand">
            GIIIN / ギイーン
          </button>

          {/* ナビゲーション：PCでは横並び、モバイルではドロップダウン */}
          <nav className={`ga-nav ${showMobileMenu ? "open" : ""}`} id="mainnav">
            {allNavSteps.map((item, index) => (
              <button
                key={item.key}
                onClick={() => { handleViewChange(item.key); setShowMobileMenu(false); }}
                className={currentView === item.key ? "active" : ""}
              >
                <span className="ga-step">{String(index + 1).padStart(2, "0")}</span>
                {item.name}
              </button>
            ))}

            {/* モバイルのみ：アカウント情報 */}
            <div className="lg:hidden pt-3 mt-1 border-t border-white/10">
              <Authenticated>
                {loggedInUser && (
                  <div className="mb-3 text-xs text-gray-300 pt-3">
                    ログイン中：<span className="font-medium" style={{ color: "var(--ga-gold)" }}>{loggedInUser.name || loggedInUser.email || "ユーザー"}</span>
                    {roleLabel && <span className="block text-cyan-300 mt-0.5">{roleLabel}</span>}
                  </div>
                )}
                <SignOutButton />
              </Authenticated>
              <Unauthenticated>
                <button
                  onClick={() => { setShowLoginModal(true); setShowMobileMenu(false); }}
                  className="ga-signin w-full mt-3"
                >
                  新規/ログイン
                </button>
              </Unauthenticated>
            </div>
          </nav>

          <div className="ga-topbar-right">
            {/* デスクトップのみ：アカウント情報 */}
            <div className="hidden lg:flex items-center gap-3">
              <Authenticated>
                {loggedInUser && (
                  <span className="text-xs text-gray-200 text-right leading-tight">
                    {loggedInUser.name || loggedInUser.email || "ユーザー"}
                    {roleLabel && <span className="block text-cyan-300">{roleLabel}</span>}
                  </span>
                )}
                <SignOutButton />
              </Authenticated>
              <Unauthenticated>
                <button onClick={() => setShowLoginModal(true)} className="ga-signin">
                  ログイン
                </button>
              </Unauthenticated>
            </div>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="ga-menu-toggle"
              aria-label="メニューを開閉"
              aria-expanded={showMobileMenu}
              aria-controls="mainnav"
            >
              {showMobileMenu ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      {/* コンテンツエリア */}
      <main className="flex-1 p-4 lg:p-8 max-w-6xl w-full mx-auto">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }
        >
          {renderContent()}
        </Suspense>
      </main>

      {/* フッター */}
      <footer className="text-center py-6 border-t border-purple-800/40 text-xs text-gray-500">
        <button
          onClick={() => handleViewChange("terms")}
          className="hover:text-gray-300 transition-colors"
        >
          利用規約・プライバシーポリシー
        </button>
        <p className="mt-2">©2025 GIIIN</p>
      </footer>

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
  const user = useQuery(api.auth.loggedInUser);
  const toggleLike = useMutation(api.likes.toggle);

  const handleLike = async () => {
    if (!user) {
      alert("気になるするにはログインが必要です");
      return;
    }
    try {
      await toggleLike({ questionId });
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  if (!question) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="ga-spinner"></div>
      </div>
    );
  }

  const thumbnailUrl = question.youtubeUrl ? getYouTubeThumbnailUrl(question.youtubeUrl) : null;

  return (
    <div className="ga-page">
      <div className="ga-main" style={{ paddingTop: "clamp(24px, 5vw, 40px)" }}>
        <button onClick={onBack} className="ga-backlink ga-block">
          ← 質問一覧に戻る
        </button>

        {/* 質問詳細ヘッダー */}
        <div className="ga-block ga-surface-card ga-detail-head">
          <div className="ga-detail-top-row">
            <span className="ga-pill status">{question.status === "answered" ? "回答済み" : question.status === "pending" ? "回答待ち" : "アーカイブ"}</span>
            <span className="ga-pill cat">{question.category}</span>
            <span className="ga-qa-date">{question.sessionNumber || new Date(question.sessionDate).toLocaleDateString("ja-JP")}</span>
          </div>
          <h1 className="ga-detail-title">{question.title}</h1>
          <div className="ga-member-block">
            <button
              onClick={() => onMemberClick(question.councilMemberId)}
              className="ga-avatar"
              style={{ border: "none", cursor: "pointer", padding: 0 }}
            >
              {question.memberPhotoUrl ? (
                <img src={question.memberPhotoUrl} alt={question.memberName} />
              ) : (
                question.memberName.charAt(0)
              )}
            </button>
            <div>
              <div className="name">{question.memberName}</div>
              {question.memberParty && <div className="sub">{question.memberParty}</div>}
            </div>
          </div>
        </div>

        {/* 質問内容・動画 */}
        <div className="ga-block ga-surface-card ga-content-block">
          <h2>質問内容</h2>
          <div className="ga-body-text">{question.content}</div>

          {question.youtubeUrl && (
            <>
              <h2 style={{ marginTop: 26 }}>動画</h2>
              {thumbnailUrl ? (
                <a
                  href={question.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ga-video-frame"
                  style={{ backgroundImage: `url(${thumbnailUrl})` }}
                >
                  <div className="ga-play-overlay"><div className="ga-play-btn"></div></div>
                  <span className="ga-yt-label">▶ YouTube で見る</span>
                </a>
              ) : (
                <a href={question.youtubeUrl} target="_blank" rel="noopener noreferrer" className="ga-btn ga-btn-ghost" style={{ marginTop: 16 }}>
                  YouTube で見る →
                </a>
              )}
            </>
          )}
        </div>

        {/* 回答一覧 */}
        {responses && responses.length > 0 && (
          <div className="ga-block ga-response-block">
            <h2 className="flex items-center">
              AI要約回答（{responses.length}件）
              <InfoTooltip text="議員からの質問（質問側の内容）と、それに対する市の担当部署からの回答（市側の回答）をAIが要約して表示しています。" />
            </h2>
            {responses.map((response, index) => (
              <div key={response._id} className="ga-qa-pair">
                <span className="ga-num-badge">{String(index + 1).padStart(2, "0")}</span>
                {formatResponseContent(response.content)}
              </div>
            ))}
          </div>
        )}

        {/* 気になるボタン */}
        <div className="ga-block ga-surface-card ga-like-bar">
          <button onClick={handleLike} className="ga-like-btn">
            {question.isLiked ? "❤️" : "🤍"} 気になる（{question.likeCount}）
          </button>
          <span className="text-sm" style={{ color: "var(--ga-muted)" }}>この質問が気になったら押してみてください</span>
        </div>
      </div>
    </div>
  );
}
