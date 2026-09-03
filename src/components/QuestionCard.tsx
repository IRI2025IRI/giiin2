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

const statusTagClass: Record<string, string> = {
  answered: "ga-tag status-answered",
  pending: "ga-tag status-pending",
  archived: "ga-tag status-archived",
};

const statusLabel: Record<string, string> = {
  answered: "回答済み",
  pending: "回答待ち",
  archived: "アーカイブ",
};

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
          <span key={i} className="ga-tag neutral">{part}</span>
        );
      }
      if (answerKeywords.includes(part)) {
        return (
          <span key={i} className="ga-tag accent">{part}</span>
        );
      }
      if (otherKeywords.includes(part)) {
        return (
          <span key={i} className="ga-tag status-archived">{part}</span>
        );
      }
      return part;
    });
  };

  return (
    <div className="ga-surface-card transition-transform duration-200 hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={statusTagClass[question.status]}>{statusLabel[question.status]}</span>
            <span className="ga-pill cat">{question.category}</span>
            {question.sessionNumber && (
              <span className="ga-tag neutral">{question.sessionNumber}</span>
            )}
            <span className="text-xs" style={{ color: "var(--ga-muted)" }}>
              {new Date(question.sessionDate).toLocaleDateString('ja-JP')}
            </span>
          </div>

          <h3 className="text-xl font-bold mb-2" style={{ color: "var(--ga-ink)" }}>
            {question.title}
          </h3>
        </div>

        {/* Member Info */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="text-right">
            <div className="font-medium" style={{ color: "var(--ga-ink)" }}>{question.memberName}</div>
            {question.memberParty && (
              <div className="text-sm" style={{ color: "var(--ga-muted)" }}>{question.memberParty}</div>
            )}
          </div>
          <div className="ga-avatar" style={{ width: 48, height: 48, fontSize: "1rem" }}>
            {question.memberPhotoUrl ? (
              <img src={question.memberPhotoUrl} alt={question.memberName} />
            ) : (
              question.memberName.charAt(0)
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <div className="leading-relaxed whitespace-pre-wrap" style={{ color: "var(--ga-muted)" }}>
          {highlightKeywords(isExpanded ? question.content : truncateContent(question.content))}
        </div>
        {question.content.length > 200 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm mt-2 font-medium transition-colors"
            style={{ color: "var(--ga-teal-deep)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            {isExpanded ? "閉じる" : "続きを読む"}
          </button>
        )}
      </div>

      {/* Links */}
      {(question.youtubeUrl || question.documentUrl) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {question.youtubeUrl && (
            <a href={question.youtubeUrl} target="_blank" rel="noopener noreferrer" className="ga-btn ga-btn-ghost">
              YouTube
            </a>
          )}
          {question.documentUrl && (
            <a href={question.documentUrl} target="_blank" rel="noopener noreferrer" className="ga-btn ga-btn-ghost">
              資料
            </a>
          )}
        </div>
      )}

      {/* Responses Section */}
      {question.responses && question.responses.length > 0 && (
        <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--ga-line)" }}>
          <h4 className="text-lg font-bold mb-4 flex items-center" style={{ color: "var(--ga-ink)" }}>
            AI要約回答 ({question.responses.length}件)
            <InfoTooltip text="議員からの質問（質問側の内容）と、それに対する市の担当部署からの回答（市側の回答）をAIが要約して表示しています。" />
          </h4>
          <div className="space-y-4">
            {question.responses.map((response) => (
              <div key={response._id} className="rounded-lg p-4" style={{ background: "var(--ga-paper)", border: "1px solid var(--ga-line)" }}>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="ga-tag neutral">{response.respondentTitle || "未記入"}</span>
                  {response.department ? (
                    <span className="ga-tag accent">{response.department}</span>
                  ) : (
                    <span className="ga-tag status-archived">未記入</span>
                  )}
                  <span className="text-xs" style={{ color: "var(--ga-muted)" }}>
                    {new Date(response.responseDate).toLocaleDateString('ja-JP')}
                  </span>
                </div>

                <div className="leading-relaxed mb-3 whitespace-pre-wrap" style={{ color: "var(--ga-muted)" }}>
                  {highlightKeywords(response.content)}
                </div>

                {response.documentUrl && (
                  <a href={response.documentUrl} target="_blank" rel="noopener noreferrer" className="ga-btn ga-btn-ghost">
                    関連資料
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid var(--ga-line)" }}>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className="ga-btn ga-btn-ghost"
          >
            <span>{question.isLiked ? "❤️" : "🤍"}</span>
            <span>{question.likeCount}</span>
          </button>

          <div className="flex items-center space-x-2 text-sm" style={{ color: "var(--ga-muted)" }}>
            <span>💬</span>
            <span>{question.responseCount} 件の回答</span>
          </div>
        </div>

        {onClick && (
          <button onClick={onClick} className="ga-btn ga-btn-primary">
            詳細を見る →
          </button>
        )}
      </div>

      {/* キーワードハイライトの説明 */}
      {question.responses && question.responses.length > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--ga-line)" }}>
          <div className="text-xs flex flex-wrap items-center gap-3" style={{ color: "var(--ga-muted)" }}>
            <span>キーワードハイライト:</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ background: "var(--ga-teal)" }}></span>
              <span>質問側</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ background: "var(--ga-gold)" }}></span>
              <span>回答側</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-full" style={{ background: "var(--ga-muted)" }}></span>
              <span>その他</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
