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
    { id: "members", name: "議員管理" },
    { id: "questions", name: "質問管理" },
    { id: "news", name: "お知らせ管理" },
    { id: "images", name: "画像管理" },
    { id: "slideshow", name: "スライドショー" },
    { id: "faq", name: "FAQ管理" },
    { id: "contact", name: "お問い合わせ" },
    { id: "menu", name: "メニュー設定" },
    { id: "external", name: "外部記事管理" },
    ...(isSuperAdmin ? [
      { id: "users", name: "ユーザー管理" },
      { id: "statistics", name: "統計情報" },
      { id: "migration", name: "データ移行" },
      { id: "cleanup", name: "データクリーンアップ" },
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
    <div className="ga-page">
      <div className="ga-main" style={{ paddingTop: "clamp(24px, 5vw, 40px)" }}>
        <div className="ga-block flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold" style={{ color: "var(--ga-ink)" }}>管理パネル</h1>
          <div className="text-sm" style={{ color: "var(--ga-muted)" }}>
            権限: {userRole === "superAdmin" ? "スーパー管理者" : "管理者"}
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="ga-block flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? "ga-btn ga-btn-primary" : "ga-btn ga-btn-ghost"}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* コンテンツエリア */}
        <div className="ga-block ga-admin min-h-[600px]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
