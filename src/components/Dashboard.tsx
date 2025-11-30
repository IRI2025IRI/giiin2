import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Slideshow } from "./Slideshow";

import { TopMembers } from "./TopMembers";
import { RecentQuestions } from "./RecentQuestions";

interface DashboardProps {
  onMemberClick: (memberId: Id<"councilMembers">) => void;
  onNewsClick: (newsId: Id<"news">) => void;
  onViewChange: (view: string) => void;
  onQuestionClick?: (questionId: Id<"questions">) => void;
}

export function Dashboard({ onMemberClick, onNewsClick, onViewChange, onQuestionClick }: DashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  const recentNews = useQuery(api.news.getRecent, { limit: 3 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const handleQuestionClick = (questionId: Id<"questions">) => {
    if (onQuestionClick) {
      onQuestionClick(questionId);
    } else {
      // Fallback to questions list view
      onViewChange("questions");
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* スライドショー with タイトルオーバーレイ */}
      <div className="relative">
        <Slideshow />
        
        {/* タイトルオーバーレイ */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-4 animate-amano-float">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow drop-shadow-2xl">
              ようこそGIIIN/ギイーンへ
            </h1>
            {/* 現在時刻 */}

          </div>
        </div>
      </div>

      {/* クイックアクセス */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h2 className="text-xl font-bold text-yellow-400 mb-6 amano-text-glow text-center">
          🚀 クイックアクセス
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => onViewChange("questions")}
            className="amano-bg-glass p-4 rounded-lg text-center hover:bg-gradient-to-r hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105 group"
          >
            <div className="text-3xl mb-2 group-hover:animate-bounce">❓</div>
            <div className="text-sm font-medium text-gray-200 group-hover:text-white">質問・回答</div>
          </button>
          <button
            onClick={() => onViewChange("members")}
            className="amano-bg-glass p-4 rounded-lg text-center hover:bg-gradient-to-r hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105 group"
          >
            <div className="text-3xl mb-2 group-hover:animate-bounce">👥</div>
            <div className="text-sm font-medium text-gray-200 group-hover:text-white">議員一覧</div>
          </button>
          <button
            onClick={() => onViewChange("rankings")}
            className="amano-bg-glass p-4 rounded-lg text-center hover:bg-gradient-to-r hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105 group"
          >
            <div className="text-3xl mb-2 group-hover:animate-bounce">📊</div>
            <div className="text-sm font-medium text-gray-200 group-hover:text-white">統計</div>
          </button>
          <button
            onClick={() => onViewChange("news")}
            className="amano-bg-glass p-4 rounded-lg text-center hover:bg-gradient-to-r hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105 group"
          >
            <div className="text-3xl mb-2 group-hover:animate-bounce">📢</div>
            <div className="text-sm font-medium text-gray-200 group-hover:text-white">お知らせ</div>
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 質問数の多い議員 */}
        <TopMembers onMemberClick={onMemberClick} />

        {/* 最近の質問 */}
        <RecentQuestions onQuestionClick={handleQuestionClick} />
      </div>

      {/* 最新お知らせ */}
      {recentNews && recentNews.length > 0 && (
        <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-yellow-400 amano-text-glow">
              📢 最新お知らせ
            </h2>
            <button
              onClick={() => onViewChange("news")}
              className="text-sm text-cyan-400 hover:text-yellow-400 transition-colors"
            >
              すべて見る →
            </button>
          </div>
          <div className="space-y-4">
            {recentNews.map((news, index) => (
              <div
                key={news._id}
                onClick={() => onNewsClick(news._id)}
                className="cursor-pointer p-4 amano-bg-glass rounded-lg hover:bg-gradient-to-r hover:from-yellow-500/20 hover:via-purple-500/20 hover:to-cyan-400/20 transition-all duration-300 transform hover:scale-[1.02] animate-slideUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">📢</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-200 hover:text-yellow-400 transition-colors">
                      {news.title}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                      <span>📅 {new Date(news.publishDate).toLocaleDateString("ja-JP")}</span>
                      <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-0.5 rounded-full text-xs">
                        {news.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 統計情報 */}

      {/* 使い方ガイド */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h2 className="text-xl font-bold text-yellow-400 mb-6 amano-text-glow text-center">
          📖 使い方ガイド
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-bold text-gray-200 mb-2">1. 検索</h3>
            <p className="text-sm text-gray-400">
              議員名やキーワードで質問を簡単に検索できます
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="font-bold text-gray-200 mb-2">2. 分析</h3>
            <p className="text-sm text-gray-400">
              議員の活動状況を確認できます
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="font-bold text-gray-200 mb-2">3. 参加</h3>
            <p className="text-sm text-gray-400">
              いいね機能で関心のある質問を評価できます
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
