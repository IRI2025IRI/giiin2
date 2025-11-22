import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemberManagement } from "./MemberManagement";
import { QuestionManagement } from "./QuestionManagement";
import { NewsManagement } from "./NewsManagement";
import { UserManagement } from "./UserManagement";
import { SlideshowManagement } from "./SlideshowManagement";
import { FAQManagement } from "./FAQManagement";
import { ContactManagement } from "./ContactManagement";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("members");
  const userRole = useQuery(api.admin.getUserRole);
  const isSuperAdmin = useQuery(api.admin.isSuperAdmin);

  const tabs = [
    { id: "members", label: "議員管理", icon: "👥" },
    { id: "questions", label: "質問管理", icon: "📜" },
    { id: "news", label: "お知らせ管理", icon: "✨" },
    { id: "slideshow", label: "スライドショー管理", icon: "🖼️" },
    { id: "faq", label: "FAQ管理", icon: "❓" },
    { id: "contact", label: "お問い合わせ管理", icon: "📧" },
  ];

  // スーパー管理者のみアクセス可能なタブ
  if (isSuperAdmin) {
    tabs.push({ id: "users", label: "ユーザー管理", icon: "👑" });
  }

  const renderContent = () => {
    switch (activeTab) {
      case "members":
        return <MemberManagement />;
      case "questions":
        return <QuestionManagement />;
      case "news":
        return <NewsManagement />;
      case "slideshow":
        return <SlideshowManagement />;
      case "faq":
        return <FAQManagement />;
      case "contact":
        return <ContactManagement />;
      case "users":
        return isSuperAdmin ? <UserManagement /> : <div>アクセス権限がありません</div>;
      default:
        return <MemberManagement />;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ヘッダー */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4 amano-text-glow">
          管理画面
        </h1>
        <p className="text-gray-300 text-lg">
          {userRole === "superAdmin" ? "運営者" : "編集者"}として各種データを管理できます
        </p>
      </div>

      {/* タブナビゲーション */}
      <div className="amano-bg-glass rounded-lg p-2 border border-purple-500">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-500 transform hover:scale-105 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white shadow-lg amano-card-glow"
                  : "text-gray-300 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="animate-fadeIn">
        {renderContent()}
      </div>
    </div>
  );
}
