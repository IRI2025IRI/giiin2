import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { ResponseForm } from "./ResponseForm";

interface QuestionCardProps {
  question: Doc<"questions">;
  index: number;
}

export function QuestionCard({ question, index }: QuestionCardProps) {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const user = useQuery(api.auth.loggedInUser);
  const isAdmin = useQuery(api.admin.isAdmin);
  const member = useQuery(api.councilMembers.getById, { id: question.councilMemberId });
  const responses = useQuery(api.questions.getResponses, { questionId: question._id });
  const likeCount = useQuery(api.likes.getCount, { questionId: question._id });
  const userLike = useQuery(
    api.likes.getUserLike,
    user ? { userId: user._id, questionId: question._id } : "skip"
  );
  
  const toggleLike = useMutation(api.likes.toggle);

  const handleLike = async () => {
    if (!user) return;
    await toggleLike({ questionId: question._id });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "answered":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "answered":
        return "回答済み";
      case "pending":
        return "回答待ち";
      case "archived":
        return "アーカイブ";
      default:
        return status;
    }
  };

  const shouldTruncate = question.content.length > 200;
  const displayContent = isExpanded || !shouldTruncate 
    ? question.content 
    : question.content.substring(0, 200) + "...";

  return (
    <div
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden animate-slideUp"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 line-clamp-2">
              {question.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
              {member && (
                <span className="font-medium text-blue-600">{member.name}</span>
              )}
              <span>•</span>
              <span>{new Date(question.sessionDate).toLocaleDateString('ja-JP')}</span>
              {question.sessionNumber && (
                <>
                  <span>•</span>
                  <span>{question.sessionNumber}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(question.status)}`}>
              {getStatusText(question.status)}
            </span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              {question.category}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        <div className="mb-4">
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
            {displayContent}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              {isExpanded ? "折りたたむ" : "続きを読む"}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={!user}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                userLike
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              } ${!user ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
            >
              <span>{userLike ? "❤️" : "🤍"}</span>
              <span>{likeCount || 0}</span>
            </button>
            
            {question.youtubeUrl && (
              <a
                href={question.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-all duration-300 hover:scale-105"
              >
                <span>📺</span>
                <span className="hidden sm:inline">動画</span>
              </a>
            )}
            
            {question.documentUrl && (
              <a
                href={question.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-200 transition-all duration-300 hover:scale-105"
              >
                <span>📄</span>
                <span className="hidden sm:inline">資料</span>
              </a>
            )}
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowResponseForm(!showResponseForm)}
              className="px-4 py-2 bg-green-100 text-green-600 rounded-lg text-sm font-medium hover:bg-green-200 transition-all duration-300 hover:scale-105"
            >
              {showResponseForm ? "キャンセル" : "回答を追加"}
            </button>
          )}
        </div>

        {/* Response Form */}
        {showResponseForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg animate-slideDown">
            <ResponseForm
              questionId={question._id}
              onSuccess={() => setShowResponseForm(false)}
              onCancel={() => setShowResponseForm(false)}
            />
          </div>
        )}

        {/* Responses */}
        {responses && responses.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
              <span className="mr-2">💬</span>
              回答 ({responses.length})
            </h4>
            {responses.map((response) => (
              <div
                key={response._id}
                className="bg-green-50 border border-green-200 rounded-lg p-4 animate-slideDown"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-semibold text-green-800 text-sm sm:text-base">
                      {response.respondentTitle}
                    </span>
                    {response.department && (
                      <>
                        <span className="hidden sm:inline text-gray-400">•</span>
                        <span className="text-xs sm:text-sm text-gray-600">{response.department}</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {new Date(response.responseDate).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
                  {response.content}
                </p>
                {response.documentUrl && (
                  <a
                    href={response.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                  >
                    <span>📄</span>
                    <span>関連資料</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
