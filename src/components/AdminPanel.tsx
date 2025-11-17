import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MemberManagement } from "./MemberManagement";
import { NewsManagement } from "./NewsManagement";
import { QuestionManagement } from "./QuestionManagement";
import { SlideshowManagement } from "./SlideshowManagement";
import { UserManagement } from "./UserManagement";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("members");
  const user = useQuery(api.auth.loggedInUser);
  const userRole = useQuery(api.admin.getUserRole);

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">ログインが必要です</p>
      </div>
    );
  }

  if (userRole === "user") {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">管理者権限が必要です</p>
      </div>
    );
  }

  const tabs = [
    { id: "members", label: "議員管理", icon: "👥" },
    { id: "questions", label: "質問管理", icon: "❓" },
    { id: "news", label: "お知らせ管理", icon: "📢" },
    { id: "slideshow", label: "スライドショー管理", icon: "🎬" },
    { id: "users", label: "ユーザー管理", icon: "👤" },
  ];

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
      case "users":
        return <UserManagement />;
      default:
        return <MemberManagement />;
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <span className="text-3xl mr-3">⚙️</span>
              管理画面
            </h1>
            <p className="text-gray-600 mt-1">
              ようこそ、{user.name || user.email}さん
              {userRole && (userRole === "admin" || userRole === "superAdmin") && (
                <span className="ml-2 text-red-600 font-medium">
                  ({userRole === "superAdmin" ? "運営者" : "編集者"})
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-2 sm:space-x-8 px-3 sm:px-6 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 sm:px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="text-lg sm:mr-2">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* タブコンテンツ */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
