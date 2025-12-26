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
import { MenuManagement } from "./MenuManagement";
import { ExternalArticleManagement } from "./ExternalArticleManagement";
import { DataMigration } from "./DataMigration";
import { CleanupManagement } from "./CleanupManagement";
import { UserStatistics } from "./UserStatistics";
import { ImageManagement } from "./ImageManagement";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("members");
  
  // ユーザーの役割を取得
  const userRole = useQuery(api.admin.getUserRole);
  
  // スーパー管理者のみアクセス可能な機能
  const isSuperAdmin = userRole === "superAdmin";

  const tabs = [
    { id: "members", name: "議員管理", icon: "👥" },
    { id: "questions", name: "質問管理", icon: "❓" },
    { id: "news", name: "お知らせ管理", icon: "📢" },
    { id: "images", name: "画像管理", icon: "🖼️" },
    { id: "slideshow", name: "スライドショー", icon: "🎬" },
    { id: "faq", name: "FAQ管理", icon: "💡" },
    { id: "contact", name: "お問い合わせ", icon: "📧" },
    { id: "menu", name: "メニュー設定", icon: "🔧" },
    { id: "external", name: "外部記事管理", icon: "📰" },
    ...(isSuperAdmin ? [
      { id: "users", name: "ユーザー管理", icon: "👤" },
      { id: "statistics", name: "統計情報", icon: "📊" },
      { id: "migration", name: "データ移行", icon: "🔄" },
      { id: "cleanup", name: "データクリーンアップ", icon: "🧹" },
    ] : []),
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "members":
        return <MemberManagement />;
      case "questions":
        return <QuestionManagement />;
      case "news":
        return <NewsManagement />;
      case "images":
        return <ImageManagement />;
      case "slideshow":
        return <SlideshowManagement />;
      case "faq":
        return <FAQManagement />;
      case "contact":
        return <ContactManagement />;
      case "menu":
        return <MenuManagement />;
      case "external":
        return <ExternalArticleManagement />;
      case "users":
        return isSuperAdmin ? <UserManagement /> : <div>アクセス権限がありません</div>;
      case "statistics":
        return isSuperAdmin ? <UserStatistics /> : <div>アクセス権限がありません</div>;
      case "migration":
        return isSuperAdmin ? <DataMigration /> : <div>アクセス権限がありません</div>;
      case "cleanup":
        return isSuperAdmin ? <CleanupManagement /> : <div>アクセス権限がありません</div>;
      default:
        return <MemberManagement />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          🛠️ 管理パネル
        </h1>
        <div className="text-sm text-gray-400">
          権限: {userRole === "superAdmin" ? "🔧 スーパー管理者" : "⚙️ 管理者"}
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="amano-bg-card rounded-xl p-4 amano-crystal-border">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white shadow-lg transform scale-105 amano-card-glow"
                  : "text-gray-300 hover:bg-purple-800/30 hover:text-white"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="min-h-[600px]">
        {renderContent()}
      </div>
    </div>
  );
}
