import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useReveal } from "../hooks/useGaAnimations";

interface RecentQuestionsProps {
  onQuestionClick?: (questionId: Id<"questions">) => void;
}

const statusLabel: Record<string, string> = {
  pending: "回答待ち",
  answered: "回答済み",
  archived: "アーカイブ",
};

export function RecentQuestions({ onQuestionClick }: RecentQuestionsProps = {}) {
  const questions = useQuery(api.questions.getRecent, { limit: 5 });
  const user = useQuery(api.auth.loggedInUser);
  const toggleLike = useMutation(api.likes.toggle);
  const reveal = useReveal<HTMLDivElement>();

  const handleLike = async (e: React.MouseEvent, questionId: Id<"questions">) => {
    e.stopPropagation();
    if (!user) {
      alert("気になるするにはログインが必要です");
      return;
    }
    try {
      await toggleLike({ questionId });
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  // タッチイベントの処理を改善
  const handleTouchInteraction = (questionId: Id<"questions">) => {
    let touchStartTime = 0;
    let touchStartY = 0;
    let touchStartX = 0;
    let hasMoved = false;

    const handleTouchStart = (e: React.TouchEvent) => {
      touchStartTime = Date.now();
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      hasMoved = false;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = Math.abs(currentY - touchStartY);
      const deltaX = Math.abs(currentX - touchStartX);

      // 10px以上動いた場合はスクロールと判定
      if (deltaY > 10 || deltaX > 10) {
        hasMoved = true;
      }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      e.preventDefault();
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;

      // スクロールしていない かつ タッチ時間が短い場合のみクリックとして処理
      if (!hasMoved && touchDuration < 500) {
        onQuestionClick?.(questionId);
      }
    };

    return {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    };
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!questions) {
    return (
      <div className="flex justify-center py-8">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: "var(--ga-teal)" }}
        ></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="ga-surface-card text-center py-8">
        <p style={{ color: "var(--ga-muted)" }}>まだ質問がありません</p>
      </div>
    );
  }

  const [featured, ...rest] = questions;

  const renderAvatar = (q: typeof featured) =>
    q.memberPhotoUrl ? (
      <span className="ga-avatar">
        <img src={q.memberPhotoUrl} alt={q.memberName} />
      </span>
    ) : (
      <span className="ga-avatar">{q.memberName.charAt(0)}</span>
    );

  return (
    <div ref={reveal.ref} className={reveal.className}>
      <div className="ga-feature-grid">
        {/* 最新の質問（大きく表示） */}
        <div
          onClick={() => onQuestionClick?.(featured._id)}
          {...handleTouchInteraction(featured._id)}
          className="ga-qa-feature"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <div className="ga-qa-top">
            <span className="ga-pill">{statusLabel[featured.status]}</span>
            <span className="ga-pill cat">{featured.category}</span>
            <span className="ga-qa-date">{formatDate(featured.sessionDate)}</span>
          </div>
          <h4 className="ga-qa-title">{featured.title}</h4>
          <p className="ga-qa-body">{featured.content}</p>
          <div className="ga-qa-foot">
            <div className="ga-member-chip">
              {renderAvatar(featured)}
              <span>
                {featured.memberName}
                {featured.memberParty ? ` ・ ${featured.memberParty}` : ""}
              </span>
            </div>
            <div className="ga-meta">
              {featured.responseCount > 0 && <span>💬 {featured.responseCount}件の回答</span>}
              <button
                onClick={(e) => handleLike(e, featured._id)}
                style={{ cursor: "pointer", background: "none", border: "none", color: "inherit", font: "inherit" }}
              >
                {featured.isLiked ? "❤️" : "🤍"} {featured.likeCount}
              </button>
            </div>
          </div>
        </div>

        {/* その他の質問 */}
        <div className="ga-qa-list">
          {rest.map((question) => (
            <div
              key={question._id}
              onClick={() => onQuestionClick?.(question._id)}
              {...handleTouchInteraction(question._id)}
              className="ga-qa-card"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <div className="ga-qa-top">
                <span className="ga-pill status">{statusLabel[question.status]}</span>
                <span className="ga-pill cat">{question.category}</span>
                <span className="ga-qa-date">{formatDate(question.sessionDate)}</span>
              </div>
              <h4 className="ga-qa-title">{question.title}</h4>
              <div className="ga-qa-foot">
                <div className="ga-member-chip">
                  {renderAvatar(question)}
                  <span>{question.memberName}</span>
                </div>
                <div className="ga-meta">
                  <button
                    onClick={(e) => handleLike(e, question._id)}
                    style={{ cursor: "pointer", background: "none", border: "none", color: "inherit", font: "inherit" }}
                  >
                    {question.isLiked ? "❤️" : "🤍"} {question.likeCount}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
