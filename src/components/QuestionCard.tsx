import { useState, type ReactNode } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { InfoTooltip } from "./InfoTooltip";

interface QuestionCardProps {
  question: {
    _id: Id<"questions">;
    title: string;
    content: string;
    category: string;
    sessionDate: number;
    sessionNumber?: string;
    status: "pending" | "answered" | "archived";
    memberName: string;
    memberParty?: string;
    memberPhotoUrl?: string | null;
    responseCount: number;
    likeCount: number;
    isLiked: boolean;
    youtubeUrl?: string;
    documentUrl?: string;
    responses?: Array<{
      _id: Id<"responses">;
      content: string;
      respondentTitle?: string;
      department?: string;
      responseDate: number;
      documentUrl?: string;
    }>;
  };
  onClick?: () => void;
}

export function QuestionCard({ question, onClick }: QuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  
  const toggleLike = useMutation(api.likes.toggle);

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      await toggleLike({ questionId: question._id });
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "answered":
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white";
      case "pending":
        return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white";
      case "archived":
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
      default:
        return "bg-gradient-to-r from-purple-500 to-blue-500 text-white";
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

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  // キーワードをハイライトする関数（HTML注入ではなくReact要素として返す）
  const highlightKeywords = (text: string): ReactNode[] => {
    // 質問側のキーワード
    const questionKeywords = ["質問側の内容", "質問内容", "質問者", "議員質問", "質問事項"];
    // 市側の回答キーワード
    const answerKeywords = [
      "市側の回答", "市からの回答", "回答内容", "市長答弁", "部長答弁", "課長答弁",
      "市の見解", "市の方針", "市の対応",
    ];
    // その他の重要キーワード
    const otherKeywords = ["再質問", "再答弁", "要望", "提案", "検討", "実施", "対策"];
    const allKeywords = [...questionKeywords, ...answerKeywords, ...otherKeywords];

    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(${allKeywords.map(escapeRegExp).join("|")})`, "g");

    return text.split(pattern).map((part, i) => {
      if (questionKeywords.includes(part)) {
        return (
          <span key={i} className="inline-block px-2 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full text-xs font-bold shadow-lg">
            {part}
          </span>
        );
      }
      if (answerKeywords.includes(part)) {
        return (
          <span key={i} className="inline-block px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-xs font-bold shadow-lg">
            {part}
          </span>
        );
      }
      if (otherKeywords.includes(part)) {
        return (
          <span key={i} className="inline-block px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-bold shadow-lg">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(question.status)}`}>
              {getStatusText(question.status)}
            </span>
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              {question.category}
            </span>
            {question.sessionNumber && (
              <span className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                {question.sessionNumber}
              </span>
            )}
            <span className="text-gray-400 text-xs">
              📅 {new Date(question.sessionDate).toLocaleDateString('ja-JP')}
            </span>
          </div>
          
          <h3 className="text-xl font-bold text-yellow-400 mb-2 amano-text-glow line-clamp-2">
            {question.title}
          </h3>
        </div>

        {/* Member Info */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="text-right">
            <div className="font-medium text-gray-200">{question.memberName}</div>
            {question.memberParty && (
              <div className="text-sm text-gray-400">{question.memberParty}</div>
            )}
          </div>
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0 amano-crystal-border">
            {question.memberPhotoUrl ? (
              <img
                src={question.memberPhotoUrl}
                alt={question.memberName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-lg">
                {question.memberName.charAt(0)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
          {highlightKeywords(isExpanded ? question.content : truncateContent(question.content))}
        </div>
        {question.content.length > 200 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-cyan-400 hover:text-cyan-300 text-sm mt-2 font-medium transition-colors"
          >
            {isExpanded ? "▲ 折りたたむ" : "▼ 続きを読む"}
          </button>
        )}
      </div>

      {/* Links */}
      {(question.youtubeUrl || question.documentUrl) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {question.youtubeUrl && (
            <a
              href={question.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm hover:from-pink-500 hover:to-red-500 transition-all duration-300 transform hover:scale-105 amano-crystal-border"
            >
              <span>📺</span>
              <span>YouTube</span>
            </a>
          )}
          {question.documentUrl && (
            <a
              href={question.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg text-sm hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105 amano-crystal-border"
            >
              <span>📄</span>
              <span>資料</span>
            </a>
          )}
        </div>
      )}

      {/* Responses Section */}
      {question.responses && question.responses.length > 0 && (
        <div className="mt-6 pt-6 border-t border-purple-500">
          <h4 className="text-lg font-bold text-yellow-400 mb-4 amano-text-glow flex items-center">
            💬 AI要約 ({question.responses.length}件)
            <InfoTooltip text="議員からの質問（質問側の内容）と、それに対する市の担当部署からの回答（市側の回答）をAIが要約して表示しています。" />
          </h4>
          <div className="space-y-4">
            {question.responses.map((response) => (
              <div key={response._id} className="amano-bg-card rounded-lg p-4 amano-crystal-border">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    {response.respondentTitle || "未記入"}
                  </span>
                  {response.department ? (
                    <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {response.department}
                    </span>
                  ) : (
                    <span className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      未記入
                    </span>
                  )}
                  <span className="text-gray-400 text-xs">
                    📅 {new Date(response.responseDate).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                
                <div className="text-gray-300 leading-relaxed mb-3 whitespace-pre-wrap">
                  {highlightKeywords(response.content)}
                </div>
                
                {response.documentUrl && (
                  <a
                    href={response.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-2 rounded-lg text-sm hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105 amano-crystal-border"
                  >
                    <span>📄</span>
                    <span>関連資料</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-purple-500">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 amano-crystal-border ${
              question.isLiked
                ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white"
                : "bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 hover:from-orange-500 hover:to-yellow-500 hover:text-white"
            }`}
          >
            <span>{question.isLiked ? "🤔" : "💭"}</span>
            <span>{question.likeCount}</span>
          </button>
          
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <span>💬</span>
            <span>{question.responseCount} 件の回答</span>
          </div>
        </div>

        {onClick && (
          <button
            onClick={onClick}
            className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105 amano-crystal-border"
          >
            詳細を見る →
          </button>
        )}
      </div>

      {/* キーワードハイライトの説明 */}
      {question.responses && question.responses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <div className="text-xs text-gray-400 flex flex-wrap items-center gap-2">
            <span>🔍 キーワードハイライト:</span>
            <span className="inline-flex items-center space-x-1">
              <span className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></span>
              <span>質問側</span>
            </span>
            <span className="inline-flex items-center space-x-1">
              <span className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></span>
              <span>回答側</span>
            </span>
            <span className="inline-flex items-center space-x-1">
              <span className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
              <span>その他</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
