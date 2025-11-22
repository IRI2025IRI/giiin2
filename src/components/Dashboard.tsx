import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Slideshow } from "./Slideshow";

import { TopMembers } from "./TopMembers";
import { RecentQuestions } from "./RecentQuestions";

interface DashboardProps {
  onMemberClick: (memberId: Id<"councilMembers">) => void;
  onQuestionClick: (questionId: Id<"questions">) => void;
  onNewsClick: (newsId: Id<"news">) => void;
  onNavigateToMembers: () => void;
  onNavigateToQuestions: () => void;
  onNavigateToRankings: () => void;
}

export function Dashboard({ onMemberClick, onQuestionClick, onNewsClick, onNavigateToMembers, onNavigateToQuestions, onNavigateToRankings }: DashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  const recentNews = useQuery(api.news.getRecent, { limit: 3 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Hero Section with Slideshow */}
      <div className="relative">
        <Slideshow />
        
        {/* Welcome Message Overlay - pointer-events-none to allow clicks through */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-xl pointer-events-none">
          <div className="text-center text-white p-4 sm:p-8 pointer-events-auto">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 amano-text-glow animate-amano-float">
              ようこそ GIIIN/ギイーンへ
            </h2>
            <div className="text-xs sm:text-sm text-gray-300 space-y-1">
            </div>
          </div>
        </div>
      </div>



      {/* Recent News */}
      {recentNews && recentNews.length > 0 && (
        <div className="amano-bg-card rounded-xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 amano-crystal-border">
          <h3 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-4 sm:mb-6 amano-text-glow">
            📢 最新のお知らせ
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {recentNews.map((news, index) => (
              <div
                key={news._id}
                className="p-3 sm:p-4 amano-bg-glass rounded-lg border border-purple-500/20 hover:border-yellow-400/50 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] animate-slideUp"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => onNewsClick(news._id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-200 mb-1 line-clamp-1 text-sm sm:text-base">
                      {news.title}
                    </h4>
                    <p className="text-gray-400 text-xs sm:text-sm line-clamp-2">
                      {news.content}
                    </p>
                    <p className="text-cyan-400 text-xs mt-2">
                      {new Date(news.publishDate).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <span className="text-yellow-400 ml-2 flex-shrink-0">📰</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Top Members */}
        <TopMembers onMemberClick={onMemberClick} />
        
        {/* Recent Questions */}
        <RecentQuestions onQuestionClick={onQuestionClick} />
      </div>

      {/* Data Source Attribution */}
      <div className="amano-bg-card rounded-xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 text-center">
        <h3 className="text-lg sm:text-xl font-bold text-yellow-400 mb-4 amano-text-glow">
          📊 データ出典について
        </h3>
        <div className="text-gray-300 text-sm sm:text-base space-y-2">
          <p>
            本サイトで使用している議会情報・議員情報は、
            <a 
              href="https://www.city.mihara.hiroshima.jp/site/gikai/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-yellow-400 underline hover:no-underline transition-colors mx-1"
            >
              三原市議会公式サイト
            </a>
            から取得しています。
          </p>
          <p className="text-xs text-gray-400">
            ※ 議員の写真・プロフィール情報等の著作権は三原市に帰属します
          </p>
          <p className="text-xs text-gray-400">
            ※ 最新の正確な情報については、必ず公式サイトをご確認ください
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="amano-bg-card rounded-xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 text-center hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group amano-crystal-border"
             onClick={onNavigateToMembers}>
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:animate-bounce">👥</div>
          <h3 className="text-lg sm:text-xl font-bold text-yellow-400 mb-2 amano-text-glow">議員一覧</h3>
          <p className="text-gray-300 text-sm">三原市議会議員の詳細情報を確認</p>
        </div>

        <div className="amano-bg-card rounded-xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 text-center hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group amano-crystal-border"
             onClick={onNavigateToQuestions}>
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:animate-bounce">📜</div>
          <h3 className="text-lg sm:text-xl font-bold text-yellow-400 mb-2 amano-text-glow">質問・回答</h3>
          <p className="text-gray-300 text-sm">議会での質問と回答を検索・閲覧</p>
        </div>

        <div className="amano-bg-card rounded-xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 text-center hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group amano-crystal-border sm:col-span-2 lg:col-span-1"
             onClick={onNavigateToRankings}>
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:animate-bounce">🔮</div>
          <h3 className="text-lg sm:text-xl font-bold text-yellow-400 mb-2 amano-text-glow">統計情報</h3>
          <p className="text-gray-300 text-sm">議員活動の統計とランキング</p>
        </div>
      </div>
    </div>
  );
}
