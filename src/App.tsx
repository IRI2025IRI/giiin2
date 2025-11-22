import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { SignOutButton } from "./SignOutButton";
import { LoginModal } from "./components/LoginModal";
import { EmailVerificationModal } from "./components/EmailVerificationModal";
import { Dashboard } from "./components/Dashboard";
import { CouncilMemberList } from "./components/CouncilMemberList";
import { CouncilMemberDetail } from "./components/CouncilMemberDetail";
import { QuestionsList } from "./components/QuestionsList";
import { QuestionCard } from "./components/QuestionCard";
import { News } from "./components/News";
import { AdminPanel } from "./components/AdminPanel";
import { Rankings } from "./components/Rankings";
import { TermsAndPrivacy } from "./components/TermsAndPrivacy";
import { Contact } from "./components/Contact";
import { FAQ } from "./components/FAQ";
import { ScrollToTopButton } from "./components/ScrollToTopButton";
import { safeScrollTo } from "./lib/utils";
import { useUrlNavigation } from "./hooks/useUrlNavigation";

export default function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isEmailVerificationModalOpen, setIsEmailVerificationModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // URL navigation hook
  const {
    activeTab,
    selectedMemberId,
    selectedQuestionId,
    selectedNewsId,
    setActiveTab,
    setSelectedMemberId,
    setSelectedQuestionId,
    setSelectedNewsId,
  } = useUrlNavigation();
  
  const user = useQuery(api.auth.loggedInUser);
  const isAdmin = useQuery(api.admin.isAdmin);
  const isSuperAdmin = useQuery(api.admin.isSuperAdmin);
  const userRole = useQuery(api.admin.getUserRole);
  const emailStatus = useQuery(api.emailAuth.getEmailVerificationStatus);
  const makeFirstUserSuperAdmin = useMutation(api.admin.makeFirstUserSuperAdmin);
  const selectedQuestion = useQuery(
    api.questions.getById,
    selectedQuestionId ? { id: selectedQuestionId } : "skip"
  );

  // Handle loading state
  useEffect(() => {
    if (user !== undefined) {
      setIsLoading(false);
    }
  }, [user]);

  // Auto-make first user superAdmin
  useEffect(() => {
    if (user && userRole === "user") {
      makeFirstUserSuperAdmin().catch(console.error);
    }
  }, [user, userRole, makeFirstUserSuperAdmin]);

  // Close login modal when user logs in
  useEffect(() => {
    if (user && isLoginModalOpen) {
      setIsLoginModalOpen(false);
    }
  }, [user, isLoginModalOpen]);

  // Check email verification status
  useEffect(() => {
    if (user && emailStatus !== undefined) {
      // ユーザーがログインしているが、メール認証が完了していない場合
      if (!emailStatus || !emailStatus.isVerified) {
        // 5秒後にメール認証モーダルを表示
        const timer = setTimeout(() => {
          setIsEmailVerificationModalOpen(true);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user, emailStatus]);

  // Debug useEffect to track state changes
  useEffect(() => {
    console.log("State changed:", { 
      activeTab, 
      selectedMemberId, 
      selectedQuestionId, 
      selectedNewsId 
    });
  }, [activeTab, selectedMemberId, selectedQuestionId, selectedNewsId]);

  const handleMemberClick = (memberId: Id<"councilMembers">) => {
    setSelectedMemberId(memberId);
    // ページトップにスクロール
    safeScrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuestionClick = (questionId: Id<"questions">) => {
    console.log("App: handleQuestionClick called with:", questionId);
    console.log("App: User Agent:", navigator.userAgent);
    
    // 質問詳細ページに遷移
    setSelectedQuestionId(questionId);
    
    // ページトップにスクロール
    safeScrollTo({ top: 0, behavior: 'smooth' });
    
    // LINEブラウザ用の追加処理
    if (navigator.userAgent.includes('Line')) {
      setTimeout(() => {
        setSelectedQuestionId(questionId);
      }, 100);
    }
  };

  const handleNewsClick = (newsId: Id<"news">) => {
    setSelectedNewsId(newsId);
  };

  const handleBackToMembers = () => {
    setSelectedMemberId(null);
  };

  const handleBackToQuestions = () => {
    setSelectedQuestionId(null);
    // 議員が選択されている場合は議員詳細ページに戻る
    if (selectedMemberId) {
      setActiveTab("members");
    }
  };

  const handleNewsSelect = (newsId: Id<"news"> | null) => {
    setSelectedNewsId(newsId);
  };

  const tabs = [
    { id: "dashboard", label: "トップページ", icon: "🏰", shortLabel: "ホーム" },
    { id: "members", label: "議員一覧", icon: "👥", shortLabel: "議員" },
    { id: "questions", label: "質問・回答", icon: "📜", shortLabel: "質問" },
    { id: "rankings", label: "統計情報", icon: "🔮", shortLabel: "統計" },
    { id: "news", label: "お知らせ", icon: "✨", shortLabel: "お知らせ" },
    { id: "faq", label: "よくある質問", icon: "❓", shortLabel: "FAQ" },
    { id: "contact", label: "お問い合わせ", icon: "📧", shortLabel: "問合せ" },
  ];

  // Add admin tab only for admin users
  if (isAdmin) {
    tabs.push({ id: "admin", label: "管理画面", icon: "👑", shortLabel: "管理" });
  }

  const renderContent = () => {
    console.log("renderContent called with:", { 
      activeTab, 
      selectedMemberId, 
      selectedQuestionId, 
      selectedNewsId, 
      hasSelectedQuestion: !!selectedQuestion,
      selectedQuestionData: selectedQuestion 
    });
    switch (activeTab) {
      case "dashboard":
        return <Dashboard 
          onMemberClick={handleMemberClick} 
          onQuestionClick={handleQuestionClick} 
          onNewsClick={handleNewsClick}
          onNavigateToMembers={() => setActiveTab("members")}
          onNavigateToQuestions={() => setActiveTab("questions")}
          onNavigateToRankings={() => setActiveTab("rankings")}
        />;
      case "members":
        if (selectedMemberId) {
          return <CouncilMemberDetail memberId={selectedMemberId} onBack={handleBackToMembers} onQuestionClick={handleQuestionClick} />;
        }
        return <CouncilMemberList onMemberClick={handleMemberClick} />;
      case "questions":
        console.log("renderContent: questions case - selectedQuestionId:", selectedQuestionId, "selectedQuestion:", selectedQuestion);
        if (selectedQuestionId && selectedQuestion) {
          console.log("renderContent: rendering question detail");
          return (
            <div className="space-y-4 sm:space-y-6">
              <button
                onClick={handleBackToQuestions}
                className="flex items-center space-x-2 text-yellow-400 hover:text-cyan-300 font-medium transition-all duration-300 text-sm sm:text-base amano-text-glow"
              >
                <span>←</span>
                <span className="hidden sm:inline">{selectedMemberId ? "議員詳細に戻る" : "質問一覧に戻る"}</span>
                <span className="sm:hidden">戻る</span>
              </button>
              <QuestionCard question={{
                ...selectedQuestion,
                responseCount: selectedQuestion.responses?.length || 0
              }} />
            </div>
          );
        }
        console.log("renderContent: rendering QuestionsList");
        return <QuestionsList onQuestionClick={handleQuestionClick} />;
      case "rankings":
        return <Rankings onMemberClick={handleMemberClick} onQuestionClick={handleQuestionClick} />;
      case "news":
        return <News selectedNewsId={selectedNewsId} onNewsSelect={handleNewsSelect} />;
      case "faq":
        return <FAQ onNavigateToContact={() => setActiveTab("contact")} />;
      case "contact":
        return <Contact />;
      case "terms":
        return <TermsAndPrivacy />;
      case "admin":
        return isAdmin ? <AdminPanel /> : <div>アクセス権限がありません</div>;
      default:
        return <Dashboard 
          onMemberClick={handleMemberClick} 
          onQuestionClick={handleQuestionClick} 
          onNewsClick={handleNewsClick}
          onNavigateToMembers={() => setActiveTab("members")}
          onNavigateToQuestions={() => setActiveTab("questions")}
          onNavigateToRankings={() => setActiveTab("rankings")}
        />;
    }
  };

  // メール認証が必要かどうかを判定
  const needsEmailVerification = user && emailStatus !== undefined && (!emailStatus || !emailStatus.isVerified);

  return (
    <div className="min-h-screen amano-bg-primary">
      {/* Loading Screen for LINE browser compatibility */}
      {isLoading && (
        <div className="fixed inset-0 amano-bg-secondary z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4 animate-amano-glow"></div>
            <p className="text-gray-300 amano-text-glow">読み込み中...</p>
          </div>
        </div>
      )}

      {/* Email Verification Warning Banner */}
      {needsEmailVerification && (
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-3 text-center relative z-30">
          <div className="flex items-center justify-center space-x-2 text-sm sm:text-base">
            <span>📧</span>
            <span>メール認証が完了していません。</span>
            <button
              onClick={() => setIsEmailVerificationModalOpen(true)}
              className="underline hover:no-underline font-medium"
            >
              今すぐ認証する
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="amano-bg-glass shadow-2xl border-b-4 border-yellow-400 sticky top-0 z-40 amano-crystal-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden amano-card-glow animate-amano-float">
                <img 
                  src="https://i.gyazo.com/b4bbdbe8695db5c6bfbc110001f0c855.png" 
                  alt="GIIIN/ギイーン ロゴ" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent truncate amano-text-glow">
                  GIIIN/ギイーン
                </h1>
                <p className="text-xs sm:text-sm text-gray-300 hidden sm:block">～議員の活動をわかりやすく見える化へ～</p>
              </div>
            </div>

            {/* Auth Section */}
            <div className="flex items-center flex-shrink-0">
              {user === undefined ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin animate-amano-glow"></div>
                  <span className="text-xs sm:text-sm text-gray-300 hidden sm:inline">読み込み中...</span>
                </div>
              ) : user ? (
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-200 truncate max-w-32 amano-text-glow">
                      {user.name || user.email || "ユーザー"}
                    </p>
                    {needsEmailVerification && (
                      <p className="text-xs text-yellow-400 font-medium amano-text-glow">
                        メール認証待ち
                      </p>
                    )}
                    {userRole && userRole !== "user" && (
                      <p className="text-xs text-yellow-400 font-medium amano-text-glow">
                        {userRole === "superAdmin" ? "運営者" : "編集者"}
                      </p>
                    )}
                  </div>
                  <SignOutButton />
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white px-3 py-2 sm:px-6 sm:py-2 rounded-lg font-medium hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105 text-xs sm:text-sm amano-crystal-border animate-amano-glow"
                >
                  <span className="hidden sm:inline">ログイン/新規登録</span>
                  <span className="sm:hidden">ログイン</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className={`amano-bg-glass shadow-lg border-b border-purple-500 sticky z-30 ${needsEmailVerification ? 'top-12' : 'top-16 sm:top-20'}`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2 sm:py-4 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center sm:space-x-1 sm:space-x-2 px-2 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all duration-500 transform hover:scale-105 whitespace-nowrap flex-shrink-0 relative ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white shadow-lg amano-card-glow amano-sparkle"
                    : "text-gray-300 amano-bg-card hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600"
                }`}
              >
                <span className="text-lg sm:text-lg">{tab.icon}</span>
                <span className="hidden sm:inline ml-2">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="animate-fadeIn">
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="amano-bg-secondary text-white py-8 sm:py-12 mt-8 sm:mt-16 border-t-4 border-yellow-400">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden amano-card-glow animate-amano-float">
                <img 
                  src="https://i.gyazo.com/b4bbdbe8695db5c6bfbc110001f0c855.png" 
                  alt="GIIIN/ギイーン ロゴ" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">GIIIN/ギイーン</h3>
            </div>
            <p className="text-gray-300 mb-4 text-sm sm:text-base px-4">
              <span className="hidden sm:inline"></span>
            </p>
            
            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              <button
                onClick={() => setActiveTab("terms")}
                className="text-cyan-400 hover:text-yellow-400 text-sm underline hover:no-underline transition-colors"
              >
                利用規約・プライバシーポリシー
              </button>
            </div>
            
            <div className="text-xs sm:text-sm text-gray-400 px-4 space-y-2">
              <p>※ このサイトは三原市非公認です。実際のデータは各自治体議会の公式情報をご確認ください。</p>
              <p>
                ※ 議員情報・議事録データは
                <a 
                  href="https://www.city.mihara.hiroshima.jp/site/gikai/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-yellow-400 underline hover:no-underline transition-colors mx-1"
                >
                  三原市議会公式サイト
                </a>
                より取得（著作権：三原市）
              </p>
              <p>© 2025 GIIIN/ギイーン</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={isEmailVerificationModalOpen}
        onClose={() => setIsEmailVerificationModalOpen(false)}
        userEmail={user?.email}
      />

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
}
