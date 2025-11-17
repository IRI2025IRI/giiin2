import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface CouncilMemberDetailProps {
  memberId: Id<"councilMembers">;
  onBack: () => void;
  onQuestionClick: (questionId: Id<"questions">) => void;
}

export function CouncilMemberDetail({ memberId, onBack, onQuestionClick }: CouncilMemberDetailProps) {
  const member = useQuery(api.councilMembers.getById, { id: memberId });
  const questions = useQuery(api.questions.getByCouncilMember, { councilMemberId: memberId });
  const user = useQuery(api.auth.loggedInUser);
  const toggleLike = useMutation(api.likes.toggle);
  
  const [loadingLikes, setLoadingLikes] = useState<Set<Id<"questions">>>(new Set());

  const handleLike = async (questionId: Id<"questions">, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    setLoadingLikes(prev => new Set(prev).add(questionId));
    try {
      await toggleLike({ questionId });
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setLoadingLikes(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  if (!member) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm sm:text-base"
      >
        <span>←</span>
        <span>議員一覧に戻る</span>
      </button>

      {/* Member Profile Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8 text-white">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/20 flex items-center justify-center text-3xl sm:text-4xl font-bold flex-shrink-0">
              {member.photoUrl ? (
                <img 
                  src={member.photoUrl} 
                  alt={member.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                member.name.charAt(0)
              )}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{member.name}</h1>
              <div className="space-y-1 text-blue-100">
                {member.party && <p className="text-lg">{member.party}</p>}
                {member.position && <p>{member.position}</p>}
                {member.committee && <p>所属委員会: {member.committee}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">基本情報</h3>
              <div className="space-y-3">
                {member.politicalParty && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 min-w-0 flex-shrink-0">政党:</span>
                    <span className="font-medium">{member.politicalParty}</span>
                  </div>
                )}
                {member.electionCount && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 min-w-0 flex-shrink-0">当選回数:</span>
                    <span className="font-medium">{member.electionCount}回</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 min-w-0 flex-shrink-0">任期:</span>
                  <span className="font-medium">
                    {new Date(member.termStart).getFullYear()}年〜
                    {member.termEnd ? new Date(member.termEnd).getFullYear() + "年" : "現在"}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">連絡先</h3>
              <div className="space-y-3">
                {member.email && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 min-w-0 flex-shrink-0">📧</span>
                    <a href={`mailto:${member.email}`} className="text-blue-600 hover:text-blue-800 break-all">
                      {member.email}
                    </a>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 min-w-0 flex-shrink-0">📞</span>
                    <a href={`tel:${member.phone}`} className="text-blue-600 hover:text-blue-800">
                      {member.phone}
                    </a>
                  </div>
                )}
                {member.website && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 min-w-0 flex-shrink-0">🌐</span>
                    <a 
                      href={member.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 break-all"
                    >
                      公式サイト
                    </a>
                  </div>
                )}
                {member.blogUrl && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 min-w-0 flex-shrink-0">📝</span>
                    <a 
                      href={member.blogUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 break-all"
                    >
                      ブログ
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {member.bio && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">プロフィール</h3>
              <p className="text-gray-700 leading-relaxed">{member.bio}</p>
            </div>
          )}

          {/* Notes */}
          {member.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">備考</h3>
              <p className="text-gray-700 leading-relaxed">{member.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Questions */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
            <span className="mr-3">❓</span>
            最近の質問・発言
          </h2>
        </div>
        
        <div className="p-6">
          {!questions ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-500 text-lg">まだ質問・発言がありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <div
                  key={question._id}
                  className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-all duration-300 cursor-pointer group"
                  onClick={() => onQuestionClick(question._id)}
                >
                  {/* Question Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                        {question.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                          {question.category}
                        </span>
                        <span className="flex items-center">
                          📅 {new Date(question.sessionDate).toLocaleDateString('ja-JP')}
                        </span>
                        {question.sessionNumber && (
                          <span className="flex items-center">
                            📋 {question.sessionNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Like Button */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={(e) => handleLike(question._id, e)}
                        disabled={!user || loadingLikes.has(question._id)}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-full transition-all duration-300 ${
                          question.isLiked
                            ? "bg-red-100 text-red-600 hover:bg-red-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        } ${!user ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
                        title={user ? (question.isLiked ? "いいねを取り消す" : "いいね") : "ログインが必要です"}
                      >
                        {loadingLikes.has(question._id) ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span className={`text-lg ${question.isLiked ? "animate-pulse" : ""}`}>
                            {question.isLiked ? "❤️" : "🤍"}
                          </span>
                        )}
                        <span className="font-medium text-sm">
                          {question.likeCount || 0}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Question Content Preview */}
                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed line-clamp-3">
                      {question.content}
                    </p>
                  </div>

                  {/* Question Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        question.status === "answered" 
                          ? "bg-green-100 text-green-800" 
                          : question.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {question.status === "answered" ? "回答済み" : 
                         question.status === "pending" ? "回答待ち" : "アーカイブ"}
                      </span>
                      {question.responseCount > 0 && (
                        <span className="flex items-center">
                          💬 {question.responseCount}件の回答
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3 text-sm">
                      {question.youtubeUrl && (
                        <a
                          href={question.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-800 transition-colors"
                        >
                          <span>📺</span>
                          <span>動画</span>
                        </a>
                      )}
                      {question.documentUrl && (
                        <a
                          href={question.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <span>📄</span>
                          <span>資料</span>
                        </a>
                      )}
                      <span className="text-blue-600 group-hover:text-blue-800 font-medium">
                        詳細を見る →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
