import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface RecentQuestionsProps {
  onQuestionClick?: (questionId: Id<"questions">) => void;
}

export function RecentQuestions({ onQuestionClick }: RecentQuestionsProps = {}) {
  const questions = useQuery(api.questions.getRecent, { limit: 5 });
  const user = useQuery(api.auth.loggedInUser);
  const toggleLike = useMutation(api.likes.toggle);

  const handleLike = async (e: React.MouseEvent, questionId: Id<"questions">) => {
    e.stopPropagation();
    if (!user) {
      alert("いいねするにはログインが必要です");
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
        console.log("RecentQuestions: Valid touch interaction for question:", questionId);
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
    return new Date(timestamp).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const statusConfig = {
    pending: { icon: "⏳", color: "from-yellow-400 to-orange-500" },
    answered: { icon: "✅", color: "from-green-400 to-blue-500" },
    archived: { icon: "📁", color: "from-gray-400 to-gray-600" }
  };

  if (!questions) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="amano-bg-card rounded-xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 amano-crystal-border">
      <h3 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-4 sm:mb-6 amano-text-glow">
        📝 最近の質問
      </h3>
      <div>
        {questions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-gray-500">まだ質問がありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => {
            const touchHandlers = handleTouchInteraction(question._id);
            return (
              <div
                key={question._id}
                onClick={() => onQuestionClick?.(question._id)}
                {...touchHandlers}
                className="group p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300 cursor-pointer hover:border-blue-300"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2 text-xs text-gray-700">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      {question.category}
                    </span>
                    <span>
                      📅 {formatDate(question.sessionDate)}
                    </span>
                  </div>
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${statusConfig[question.status].color}`}>
                    <span>{statusConfig[question.status].icon}</span>
                  </div>
                </div>
                
                {/* Member photo and question title section */}
                <div className="flex items-start space-x-3 mb-3">
                  <div className="flex-shrink-0">
                    {question.memberPhotoUrl ? (
                      <img
                        src={question.memberPhotoUrl}
                        alt={question.memberName}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-sm">
                        {question.memberName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-gray-900 font-bold mb-1 group-hover:text-blue-600 transition-colors text-sm sm:text-base leading-tight">
                      {question.title}
                    </h4>
                    <p className="text-gray-700 font-medium text-xs sm:text-sm mb-2">{question.memberName}</p>
                    {question.memberParty && (
                      <p className="text-gray-600 text-xs">{question.memberParty}</p>
                    )}
                  </div>
                </div>
                
                {/* Action buttons section */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs ml-15 sm:ml-19">
                  <div className="flex items-center space-x-3">
                    {question.responseCount > 0 && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <span>💬</span>
                        <span>{question.responseCount}件の回答</span>
                      </div>
                    )}
                    
                    {question.likeCount > 0 && (
                      <div className="flex items-center space-x-1 text-pink-600">
                        <span>❤️</span>
                        <span>{question.likeCount}</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => handleLike(e, question._id)}
                    className="flex items-center space-x-1 text-pink-600 hover:text-pink-800 transition-colors"
                  >
                    <span>{question.isLiked ? "❤️" : "🤍"}</span>
                    <span className="font-medium">{question.likeCount}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
