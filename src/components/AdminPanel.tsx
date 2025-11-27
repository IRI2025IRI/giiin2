import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemberManagement } from "./MemberManagement";
import { QuestionManagement } from "./QuestionManagement";
import { NewsManagement } from "./NewsManagement";
import { UserManagement } from "./UserManagement";
import { SlideshowManagement } from "./SlideshowManagement";
import { ContactManagement } from "./ContactManagement";
import { FAQManagement } from "./FAQManagement";
import { UserStatistics } from "./UserStatistics";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("members");
  const isSuperAdmin = useQuery(api.admin.isSuperAdmin);

  const tabs = [
    { id: "members", label: "議員管理", icon: "👥" },
    { id: "questions", label: "質問管理", icon: "📜" },
    { id: "news", label: "お知らせ管理", icon: "✨" },
    { id: "slideshow", label: "スライドショー", icon: "🖼️" },
    { id: "faq", label: "FAQ管理", icon: "❓" },
    { id: "contact", label: "お問い合わせ", icon: "📧" },
    { id: "statistics", label: "ユーザー統計", icon: "📊" },
  ];

  // スーパー管理者のみのタブ
  if (isSuperAdmin) {
    tabs.push({ id: "users", label: "ユーザー管理", icon: "👤" });
  }

  const renderContent = () => {
    switch (activeTab) {
      case "members":
        return <MemberManagement />;
      case "questions":
        return <QuestionManagement />;
      case "news":
        return <NewsManagement />;
      case "users":
        return isSuperAdmin ? <UserManagement /> : <div>アクセス権限がありません</div>;
      case "slideshow":
        return <SlideshowManagement />;
      case "contact":
        return <ContactManagement />;
      case "faq":
        return <FAQManagement />;
      case "statistics":
        return <UserStatistics />;
      default:
        return <MemberManagement />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          👑 管理画面
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="amano-bg-glass rounded-lg p-2 amano-crystal-border">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white shadow-lg amano-card-glow"
                  : "text-gray-300 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 hover:text-white"
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="animate-fadeIn">
        {renderContent()}
      </div>
    </div>
  );
}
