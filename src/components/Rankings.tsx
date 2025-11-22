import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface RankingsProps {
  onMemberClick?: (memberId: Id<"councilMembers">) => void;
  onQuestionClick?: (questionId: Id<"questions">) => void;
}

export function Rankings({ onMemberClick, onQuestionClick }: RankingsProps = {}) {
  const [showAllQuestionRanking, setShowAllQuestionRanking] = useState(false);
  const [showAllLikeRanking, setShowAllLikeRanking] = useState(false);
  const [showAllPartyRanking, setShowAllPartyRanking] = useState(false);

  const members = useQuery(api.councilMembers.list, {});
  const questions = useQuery(api.questions.list);
  const topLikedQuestions = useQuery(api.questions.getTopLikedQuestions, { limit: 10 });
  const user = useQuery(api.auth.loggedInUser);
  const toggleLike = useMutation(api.likes.toggle);

  const handleLike = async (questionId: Id<"questions">) => {
    if (!user) {
      alert("いいねするにはログインが必要です");
      return;
    }
    try {
      await toggleLike({ questionId });
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  if (!members || !questions || !topLikedQuestions) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 役職者かどうかを判定する関数
  const isChairperson = (member: any) => {
    const position = member.position?.toLowerCase() || "";
    return position.includes("議長") || position.includes("副議長");
  };

  // 議員別質問数ランキング（役職者と一般議員を分ける）
  const memberQuestionCounts = members.map(member => {
    const memberQuestions = questions.filter(q => q.councilMemberId === member._id);
    return {
      ...member,
      questionCount: memberQuestions.length,
      totalLikes: memberQuestions.reduce((sum, q) => sum + (q.likeCount || 0), 0),
      isChairperson: isChairperson(member),
    };
  });

  // 一般議員（質問可能）と役職者（質問不可）に分ける
  const regularMembers = memberQuestionCounts
    .filter(member => !member.isChairperson)
    .sort((a, b) => b.questionCount - a.questionCount);

  const chairpersonMembers = memberQuestionCounts
    .filter(member => member.isChairperson)
    .sort((a, b) => b.questionCount - a.questionCount);

  // 議員別いいね数ランキング（一般議員のみ）
  const memberLikeRankings = [...regularMembers]
    .sort((a, b) => b.totalLikes - a.totalLikes)
    .slice(0, showAllLikeRanking ? regularMembers.length : 10);

  // 所属別ランキング
  const partyStats = members.reduce((acc, member) => {
    const party = member.party || "無所属";
    if (!acc[party]) {
      acc[party] = {
        party,
        memberCount: 0,
        questionCount: 0,
        totalLikes: 0,
      };
    }
    
    const memberQuestions = questions.filter(q => q.councilMemberId === member._id);
    acc[party].memberCount += 1;
    acc[party].questionCount += memberQuestions.length;
    acc[party].totalLikes += memberQuestions.reduce((sum, q) => sum + (q.likeCount || 0), 0);
    
    return acc;
  }, {} as Record<string, { party: string; memberCount: number; questionCount: number; totalLikes: number }>);

  const partyRankings = Object.values(partyStats)
    .sort((a, b) => b.questionCount - a.questionCount)
    .slice(0, showAllPartyRanking ? Object.values(partyStats).length : 8);

  // カテゴリー別質問数
  const categoryStats = questions.reduce((acc, question) => {
    acc[question.category] = (acc[question.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryStats)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return "🥇";
      case 1: return "🥈";
      case 2: return "🥉";
      default: return `${index + 1}位`;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return "from-yellow-400 to-yellow-600";
      case 1: return "from-gray-300 to-gray-500";
      case 2: return "from-orange-400 to-orange-600";
      default: return "from-blue-400 to-blue-600";
    }
  };

  const displayedQuestionRanking = showAllQuestionRanking 
    ? regularMembers 
    : regularMembers.slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          🔮 統計情報
        </h1>
        <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto">
          議員の活動状況や人気の質問を統計情報としてご紹介
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="text-2xl mb-2">👥</div>
          <div className="text-2xl font-bold">{members.filter(m => m.isActive).length}</div>
          <div className="text-blue-100 text-sm">活動中議員</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 text-white">
          <div className="text-2xl mb-2">❓</div>
          <div className="text-2xl font-bold">{questions.length}</div>
          <div className="text-green-100 text-sm">総質問数</div>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-red-600 rounded-xl p-6 text-white">
          <div className="text-2xl mb-2">❤️</div>
          <div className="text-2xl font-bold">{questions.reduce((sum, q) => sum + (q.likeCount || 0), 0)}</div>
          <div className="text-pink-100 text-sm">総いいね数</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="text-2xl mb-2">📋</div>
          <div className="text-2xl font-bold">{topCategories.length}</div>
          <div className="text-orange-100 text-sm">質問カテゴリー</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 質問数ランキング */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <span className="mr-2">📊</span>
              質問数統計データ
            </h3>
          </div>
          <div className="p-6">
            {/* 一般議員のランキング */}
            <div className="space-y-4">
              {displayedQuestionRanking.map((member, index) => (
                <div
                  key={member._id}
                  onClick={() => onMemberClick?.(member._id)}
                  className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${getRankColor(index)} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                    {index < 3 ? getRankIcon(index) : index + 1}
                  </div>
                  <div className="flex-shrink-0">
                    {member.memberPhotoUrl ? (
                      <img
                        src={member.memberPhotoUrl}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {member.name}
                    </h4>
                    <p className="text-sm text-gray-600">{member.party || "無所属"}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{member.questionCount}</div>
                    <div className="text-xs text-gray-500">質問</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 役職者の表示（質問不可の説明付き） */}
            {chairpersonMembers.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-700 flex items-center space-x-2">
                    <span>🏛️</span>
                    <span>議会役職者</span>
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    議長・副議長は議事進行役のため、一般質問を行うことは慣例として少ない為除外。
                  </p>
                </div>
                <div className="space-y-3">
                  {chairpersonMembers.map((member) => (
                    <div
                      key={member._id}
                      onClick={() => onMemberClick?.(member._id)}
                      className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        🏛️
                      </div>
                      <div className="flex-shrink-0">
                        {member.memberPhotoUrl ? (
                          <img
                            src={member.memberPhotoUrl}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                            {member.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                          {member.name}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-gray-600">{member.party || "無所属"}</p>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            {member.position}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">質問権なし</div>
                        <div className="text-xs text-gray-400">役職のため</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 全て表示ボタン */}
            {regularMembers.length > 10 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowAllQuestionRanking(!showAllQuestionRanking)}
                  className="px-6 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                >
                  {showAllQuestionRanking ? "上位10位のみ表示" : `全て表示 (${regularMembers.length}位まで)`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* いいね数ランキング */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-red-500 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <span className="mr-2">❤️</span>
              いいね数統計データ
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {memberLikeRankings.map((member, index) => (
                <div
                  key={member._id}
                  onClick={() => onMemberClick?.(member._id)}
                  className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${getRankColor(index)} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                    {index < 3 ? getRankIcon(index) : index + 1}
                  </div>
                  <div className="flex-shrink-0">
                    {member.memberPhotoUrl ? (
                      <img
                        src={member.memberPhotoUrl}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 group-hover:text-pink-600 transition-colors">
                      {member.name}
                    </h4>
                    <p className="text-sm text-gray-600">{member.party || "無所属"}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-pink-600">{member.totalLikes}</div>
                    <div className="text-xs text-gray-500">いいね</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 全て表示ボタン */}
            {regularMembers.length > 10 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowAllLikeRanking(!showAllLikeRanking)}
                  className="px-6 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors font-medium"
                >
                  {showAllLikeRanking ? "上位10位のみ表示" : `全て表示 (${regularMembers.length}位まで)`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 所属別ランキング */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="mr-2">🏛️</span>
            所属別統計データ
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partyRankings.map((party, index) => {
              const rankInfo = {
                icon: getRankIcon(index),
                color: getRankColor(index)
              };
              
              return (
                <div
                  key={party.party}
                  className="group p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${rankInfo.color} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                      {rankInfo.icon}
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      <span className="text-lg">👥</span>
                      <span className="font-bold">{party.memberCount}人</span>
                    </div>
                  </div>
                  
                  <h4 className="font-bold text-gray-800 mb-3 group-hover:text-purple-600 transition-colors text-lg">
                    {party.party}
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">質問数</span>
                      <span className="text-lg font-bold text-blue-600">{party.questionCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">総いいね数</span>
                      <span className="text-lg font-bold text-pink-600">{party.totalLikes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">議員1人あたり質問数</span>
                      <span className="text-sm font-bold text-green-600">
                        {party.memberCount > 0 ? (party.questionCount / party.memberCount).toFixed(1) : "0"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* 全て表示ボタン */}
          {Object.values(partyStats).length > 8 && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowAllPartyRanking(!showAllPartyRanking)}
                className="px-6 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
              >
                {showAllPartyRanking ? "上位8位のみ表示" : `全て表示 (${Object.values(partyStats).length}団体)`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 人気の質問ランキング */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="mr-2">🔥</span>
            人気の質問統計データ
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topLikedQuestions.map((question, index) => {
              const rankInfo = {
                icon: getRankIcon(index),
                color: getRankColor(index)
              };
              
              return (
                <div
                  key={question._id}
                  onClick={() => onQuestionClick?.(question._id)}
                  className="group p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-pink-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${rankInfo.color} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                      {rankInfo.icon}
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                      <span className="text-lg">❤️</span>
                      <span className="font-bold">{question.likeCount}</span>
                    </div>
                  </div>
                  
                  <h4 className="font-bold text-gray-800 mb-3 group-hover:text-pink-600 transition-colors text-base leading-tight">
                    {question.title}
                  </h4>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {question.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-600 flex-wrap">
                      <span className="flex items-center space-x-1">
                        <span>👤</span>
                        <span>{question.memberName || "不明"}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>📅</span>
                        <span>{new Date(question.sessionDate).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}</span>
                      </span>
                      {question.responseCount > 0 && (
                        <span className="flex items-center space-x-1 text-green-600">
                          <span>💬</span>
                          <span>{question.responseCount}件の回答</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {question.youtubeUrl && (
                        <span className="text-red-600 text-xs">📺 動画あり</span>
                      )}
                      {question.documentUrl && (
                        <span className="text-blue-600 text-xs">📄 資料あり</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(question._id);
                      }}
                      disabled={!user}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        question.isLiked
                          ? "bg-pink-100 text-pink-600"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span>{question.isLiked ? "❤️" : "🤍"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* カテゴリー別統計 */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="mr-2">📊</span>
            カテゴリー別質問数
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {topCategories.map((category, index) => {
              const maxCount = Math.max(...topCategories.map(c => c.count));
              const percentage = (category.count / maxCount) * 100;
              
              return (
                <div key={category.category} className="text-center">
                  <div className="relative mb-3">
                    <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full flex items-center justify-center relative overflow-hidden">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 to-teal-500 transition-all duration-1000"
                        style={{ height: `${percentage}%` }}
                      ></div>
                      <span className="relative z-10 text-lg font-bold text-gray-700">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-800 text-sm mb-1">
                    {category.category}
                  </h4>
                  <div className="text-2xl font-bold text-green-600">{category.count}</div>
                  <div className="text-xs text-gray-500">質問</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
