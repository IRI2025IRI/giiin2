import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { TopMembers } from "./TopMembers";
import { RecentQuestions } from "./RecentQuestions";
import { Slideshow } from "./Slideshow";

interface DashboardProps {
  onMemberClick: (memberId: Id<"councilMembers">) => void;
  onQuestionClick: (questionId: Id<"questions">) => void;
  onNewsClick: (newsId: Id<"news">) => void;
}

export function Dashboard({ onMemberClick, onQuestionClick, onNewsClick }: DashboardProps) {
  const stats = useQuery(api.questions.getStats);
  const categories = useQuery(api.questions.getCategories);
  const recentNews = useQuery(api.news.getRecent, { limit: 3 });

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">読み込み中...</span>
        </div>
      </div>
    );
  }

  const categoryColors = [
    "from-blue-500 to-blue-600",
    "from-green-500 to-green-600", 
    "from-orange-500 to-orange-600",
    "from-purple-500 to-purple-600",
    "from-pink-500 to-pink-600",
    "from-indigo-500 to-indigo-600",
    "from-red-500 to-red-600",
    "from-yellow-500 to-yellow-600"
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Slideshow Section */}
      <Slideshow />

      {/* Recent News */}
      {recentNews && recentNews.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 animate-slideUp">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
            <span className="text-xl sm:text-2xl mr-2">📢</span>
            最新のお知らせ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {recentNews.map((news) => (
              <div
                key={news._id}
                onClick={() => onNewsClick(news._id)}
                className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {news.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(news.publishDate).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm sm:text-base">
                  {news.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                  {news.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Members and Categories - Side by Side on Desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        {/* Top Members */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 animate-slideUp xl:h-[600px] xl:flex xl:flex-col">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 flex items-center">
            <span className="text-xl sm:text-2xl mr-2">🏆</span>
            活発な議員
          </h2>
          <div className="xl:flex-1 xl:overflow-hidden">
            <TopMembers onMemberClick={onMemberClick} />
          </div>
        </div>

        {/* Question Categories Chart */}
        {categories && categories.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 animate-slideUp xl:h-[600px] xl:flex xl:flex-col">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 flex items-center">
              <span className="text-xl sm:text-2xl mr-2">📊</span>
              質問カテゴリー別統計
            </h2>
            <div className="xl:flex-1 space-y-2 xl:overflow-hidden">
              {categories.slice(0, 8).map((category, index) => {
                const maxCount = Math.max(...categories.map(c => c.count));
                const percentage = (category.count / maxCount) * 100;
                const colorClass = categoryColors[index % categoryColors.length];
                
                return (
                  <div key={category.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-xs sm:text-sm font-medium text-gray-700 truncate flex-1 pr-2">
                        {category.name}
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                        <span className="font-bold text-gray-600">{category.count}件</span>
                        <span className="text-gray-500">
                          ({Math.round((category.count / stats.totalQuestions) * 100)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-white drop-shadow-sm">
                          {category.count}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recent Questions */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 animate-slideUp">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
          <span className="text-xl sm:text-2xl mr-2">💬</span>
          最近の質問
        </h2>
        <RecentQuestions onQuestionClick={onQuestionClick} />
      </div>
    </div>
  );
}
