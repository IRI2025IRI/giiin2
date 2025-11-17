import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { SignOutButton } from "./SignOutButton";
import { LoginModal } from "./components/LoginModal";
import { Dashboard } from "./components/Dashboard";
import { CouncilMemberList } from "./components/CouncilMemberList";
import { CouncilMemberDetail } from "./components/CouncilMemberDetail";
import { QuestionsList } from "./components/QuestionsList";
import { QuestionCard } from "./components/QuestionCard";
import { News } from "./components/News";
import { AdminPanel } from "./components/AdminPanel";
import { Rankings } from "./components/Rankings";
import { safeScrollTo } from "./lib/utils";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<Id<"councilMembers"> | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<Id<"questions"> | null>(null);
  const [selectedNewsId, setSelectedNewsId] = useState<Id<"news"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const user = useQuery(api.auth.loggedInUser);
  const isAdmin = useQuery(api.admin.isAdmin);
  const isSuperAdmin = useQuery(api.admin.isSuperAdmin);
  const userRole = useQuery(api.admin.getUserRole);
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
    setActiveTab("members");
    // ページトップにスクロール
    safeScrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuestionClick = (questionId: Id<"questions">) => {
    console.log("App: handleQuestionClick called with:", questionId);
    console.log("App: User Agent:", navigator.userAgent);
    
    // 質問詳細ページに遷移
    setSelectedNewsId(null);
    setActiveTab("questions");
    setSelectedQuestionId(questionId);
    
    // ページトップにスクロール
    safeScrollTo({ top: 0, behavior: 'smooth' });
    
    // LINEブラウザ用の追加処理
    if (navigator.userAgent.includes('Line')) {
      setTimeout(() => {
        setSelectedQuestionId(questionId);
        setActiveTab("questions");
      }, 100);
    }
  };

  const handleNewsClick = (newsId: Id<"news">) => {
    setSelectedMemberId(null);
    setSelectedQuestionId(null);
    setSelectedNewsId(newsId);
    setActiveTab("news");
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
    { id: "dashboard", label: "ダッシュボード", icon: "🏠", shortLabel: "ホーム" },
    { id: "members", label: "議員一覧", icon: "👥", shortLabel: "議員" },
    { id: "questions", label: "質問・回答", icon: "❓", shortLabel: "質問" },
    { id: "rankings", label: "ランキング", icon: "🏆", shortLabel: "順位" },
    { id: "news", label: "お知らせ", icon: "📢", shortLabel: "お知らせ" },
  ];

  // Add admin tab only for admin users
  if (isAdmin) {
    tabs.push({ id: "admin", label: "管理画面", icon: "⚙️", shortLabel: "管理" });
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
        return <Dashboard onMemberClick={handleMemberClick} onQuestionClick={handleQuestionClick} onNewsClick={handleNewsClick} />;
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
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm sm:text-base"
              >
                <span>←</span>
                <span className="hidden sm:inline">{selectedMemberId ? "議員詳細に戻る" : "質問一覧に戻る"}</span>
                <span className="sm:hidden">戻る</span>
              </button>
              <QuestionCard question={selectedQuestion} index={0} />
            </div>
          );
        }
        console.log("renderContent: rendering QuestionsList");
        return <QuestionsList onQuestionClick={handleQuestionClick} />;
      case "rankings":
        return <Rankings onMemberClick={handleMemberClick} onQuestionClick={handleQuestionClick} />;
      case "news":
        return <News selectedNewsId={selectedNewsId} onNewsSelect={handleNewsSelect} />;
      case "admin":
        return isAdmin ? <AdminPanel /> : <div>アクセス権限がありません</div>;
      default:
        return <Dashboard onMemberClick={handleMemberClick} onQuestionClick={handleQuestionClick} onNewsClick={handleNewsClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Loading Screen for LINE browser compatibility */}
      {isLoading && (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-orange-500 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img 
                  src="https://i.gyazo.com/b4bbdbe8695db5c6bfbc110001f0c855.png" 
                  alt="GIIIN/ギイーン ロゴ" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent truncate">
                  GIIIN/ギイーン
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">市民の声を届ける議会活動</p>
              </div>
            </div>

            {/* Auth Section */}
            <div className="flex items-center flex-shrink-0">
              {user === undefined ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">読み込み中...</span>
                </div>
              ) : user ? (
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-800 truncate max-w-32">
                      {user.name || user.email || "ユーザー"}
                    </p>
                    {userRole && userRole !== "user" && (
                      <p className="text-xs text-red-600 font-medium">
                        {userRole === "superAdmin" ? "運営者" : "編集者"}
                      </p>
                    )}
                  </div>
                  <SignOutButton />
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2 sm:px-6 sm:py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm"
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
      <nav className="bg-white shadow-md border-b border-gray-200 sticky top-16 sm:top-20 z-30">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2 sm:py-4 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center sm:space-x-1 sm:space-x-2 px-2 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 transform hover:scale-105 whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                    : "text-gray-600 bg-gray-100 hover:bg-gray-200"
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
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 sm:py-12 mt-8 sm:mt-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                  src="https://i.gyazo.com/b4bbdbe8695db5c6bfbc110001f0c855.png" 
                  alt="GIIIN/ギイーン ロゴ" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-lg sm:text-xl font-bold">GIIIN/ギイーン</h3>
            </div>
            <p className="text-gray-400 mb-4 text-sm sm:text-base px-4">
              市民の皆様の声を市政に反映させるため、議員の活動を透明化し、
              <span className="hidden sm:inline"><br /></span>
              より身近で開かれた議会を目指しています。
            </p>
            <div className="text-xs sm:text-sm text-gray-500 px-4">
              <p>※ このサイトはデモ版です。実際のデータは各自治体議会の公式情報をご確認ください。</p>
              <p className="mt-2">© 2024 GIIIN/ギイーン 議員活動可視化システム</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
}
