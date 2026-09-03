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
  const questions = useQuery(api.questions.list, {});
  const topLikedQuestions = useQuery(api.questions.getTopLikedQuestions, { limit: 10 });
  const user = useQuery(api.auth.loggedInUser);
  const toggleLike = useMutation(api.likes.toggle);

  const handleLike = async (questionId: Id<"questions">) => {
    if (!user) {
      alert("気になるするにはログインが必要です");
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
        <div className="ga-spinner"></div>
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

  const rankNumber = (index: number) => String(index + 1).padStart(2, "0");

  const displayedQuestionRanking = showAllQuestionRanking
    ? regularMembers
    : regularMembers.slice(0, 10);

  return (
    <div className="ga-page">
      <div className="ga-page-header">
        <h1>統計情報</h1>
        <p style={{ maxWidth: "42ch", margin: "0 auto" }}>議員の活動状況や人気の質問を統計情報としてご紹介</p>
      </div>

      <div className="ga-main">
        {/* Stats Overview */}
        <div className="ga-block grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "活動中議員", value: members.filter(m => m.isActive).length },
            { label: "総質問数", value: questions.length },
            { label: "総気になる数", value: questions.reduce((sum, q) => sum + (q.likeCount || 0), 0) },
            { label: "質問カテゴリー", value: topCategories.length },
          ].map((item) => (
            <div key={item.label} className="ga-surface-card text-center">
              <div className="ga-jf" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--ga-teal-deep)" }}>
                {item.value}
              </div>
              <div className="text-sm mt-1" style={{ color: "var(--ga-muted)" }}>{item.label}</div>
            </div>
          ))}
        </div>

        <div className="ga-block grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 質問数ランキング */}
          <div className="ga-surface-card">
            <div className="ga-section-head" style={{ marginBottom: 20 }}>
              <div className="ga-headline">
                <span className="ga-eyebrow">Ranking</span>
                <h2>質問数統計データ</h2>
              </div>
            </div>

            {/* 一般議員のランキング */}
            <div className="space-y-2">
              {displayedQuestionRanking.map((member, index) => (
                <div
                  key={member._id}
                  onClick={() => onMemberClick?.(member._id)}
                  className="ga-member-row"
                >
                  <span className="ga-rank">{rankNumber(index)}</span>
                  <span className="ga-avatar">
                    {member.memberPhotoUrl ? <img src={member.memberPhotoUrl} alt={member.name} /> : member.name.charAt(0)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="ga-name truncate">{member.name}</div>
                    <div className="ga-party truncate">{member.party || "無所属"}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold" style={{ color: "var(--ga-teal-deep)" }}>{member.questionCount}</div>
                    <div className="text-xs" style={{ color: "var(--ga-muted)" }}>質問</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 役職者の表示（質問不可の説明付き） */}
            {chairpersonMembers.length > 0 && (
              <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--ga-line)" }}>
                <div className="mb-3">
                  <h4 className="text-sm font-bold" style={{ color: "var(--ga-ink)" }}>議会役職者</h4>
                  <p className="text-xs mt-1" style={{ color: "var(--ga-muted)" }}>
                    議長・副議長は議事進行役のため、一般質問を行うことは慣例として少ない為除外。
                  </p>
                </div>
                <div className="space-y-2">
                  {chairpersonMembers.map((member) => (
                    <div
                      key={member._id}
                      onClick={() => onMemberClick?.(member._id)}
                      className="ga-member-row"
                      style={{ background: "var(--ga-paper)" }}
                    >
                      <span className="ga-avatar">
                        {member.memberPhotoUrl ? <img src={member.memberPhotoUrl} alt={member.name} /> : member.name.charAt(0)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="ga-name truncate">{member.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="ga-party truncate">{member.party || "無所属"}</span>
                          <span className="ga-tag accent">{member.position}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm" style={{ color: "var(--ga-muted)" }}>質問権なし</div>
                        <div className="text-xs" style={{ color: "var(--ga-muted)" }}>役職のため</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 全て表示ボタン */}
            {regularMembers.length > 10 && (
              <div className="mt-6 text-center">
                <button onClick={() => setShowAllQuestionRanking(!showAllQuestionRanking)} className="ga-btn ga-btn-ghost">
                  {showAllQuestionRanking ? "上位10位のみ表示" : `全て表示 (${regularMembers.length}位まで)`}
                </button>
              </div>
            )}
          </div>

          {/* いいね数ランキング */}
          <div className="ga-surface-card">
            <div className="ga-section-head" style={{ marginBottom: 20 }}>
              <div className="ga-headline">
                <span className="ga-eyebrow">Ranking</span>
                <h2>気になる数統計データ</h2>
              </div>
            </div>
            <div className="space-y-2">
              {memberLikeRankings.map((member, index) => (
                <div
                  key={member._id}
                  onClick={() => onMemberClick?.(member._id)}
                  className="ga-member-row"
                >
                  <span className="ga-rank">{rankNumber(index)}</span>
                  <span className="ga-avatar">
                    {member.memberPhotoUrl ? <img src={member.memberPhotoUrl} alt={member.name} /> : member.name.charAt(0)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="ga-name truncate">{member.name}</div>
                    <div className="ga-party truncate">{member.party || "無所属"}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold" style={{ color: "var(--ga-gold)" }}>{member.totalLikes}</div>
                    <div className="text-xs" style={{ color: "var(--ga-muted)" }}>気になる</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 全て表示ボタン */}
            {regularMembers.length > 10 && (
              <div className="mt-6 text-center">
                <button onClick={() => setShowAllLikeRanking(!showAllLikeRanking)} className="ga-btn ga-btn-ghost">
                  {showAllLikeRanking ? "上位10位のみ表示" : `全て表示 (${regularMembers.length}位まで)`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 所属別ランキング */}
        <div className="ga-block ga-surface-card">
          <div className="ga-section-head" style={{ marginBottom: 20 }}>
            <div className="ga-headline">
              <span className="ga-eyebrow">Ranking</span>
              <h2>所属別統計データ</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partyRankings.map((party, index) => (
              <div key={party.party} className="rounded-xl p-5" style={{ border: "1px solid var(--ga-line)" }}>
                <div className="flex justify-between items-start mb-3">
                  <span className="ga-rank" style={{ fontSize: "1.6rem" }}>{rankNumber(index)}</span>
                  <span className="ga-tag neutral">{party.memberCount}人</span>
                </div>

                <h4 className="font-bold mb-3 text-lg" style={{ color: "var(--ga-ink)" }}>{party.party}</h4>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: "var(--ga-muted)" }}>質問数</span>
                    <span className="font-bold" style={{ color: "var(--ga-teal-deep)" }}>{party.questionCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: "var(--ga-muted)" }}>総気になる数</span>
                    <span className="font-bold" style={{ color: "var(--ga-gold)" }}>{party.totalLikes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: "var(--ga-muted)" }}>議員1人あたり質問数</span>
                    <span className="text-sm font-bold" style={{ color: "var(--ga-ink)" }}>
                      {party.memberCount > 0 ? (party.questionCount / party.memberCount).toFixed(1) : "0"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 全て表示ボタン */}
          {Object.values(partyStats).length > 8 && (
            <div className="mt-6 text-center">
              <button onClick={() => setShowAllPartyRanking(!showAllPartyRanking)} className="ga-btn ga-btn-ghost">
                {showAllPartyRanking ? "上位8位のみ表示" : `全て表示 (${Object.values(partyStats).length}団体)`}
              </button>
            </div>
          )}
        </div>

        {/* 人気の質問ランキング */}
        <div className="ga-block ga-surface-card">
          <div className="ga-section-head" style={{ marginBottom: 20 }}>
            <div className="ga-headline">
              <span className="ga-eyebrow">Ranking</span>
              <h2>人気の質問統計データ</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topLikedQuestions.map((question, index) => (
              <div
                key={question._id}
                onClick={() => onQuestionClick?.(question._id)}
                className="ga-qa-card"
                style={{ cursor: "pointer" }}
              >
                <div className="flex justify-between items-start">
                  <span className="ga-rank" style={{ fontSize: "1.4rem" }}>{rankNumber(index)}</span>
                  <span className="ga-tag accent">{question.likeCount} 気になる</span>
                </div>

                <h4 className="ga-qa-title">{question.title}</h4>

                <div className="ga-qa-top">
                  <span className="ga-pill cat">{question.category}</span>
                </div>
                <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "var(--ga-muted)" }}>
                  <span>{question.memberName || "不明"}</span>
                  <span>{new Date(question.sessionDate).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}</span>
                  {question.responseCount > 0 && <span>💬 {question.responseCount}件の回答</span>}
                </div>

                <div className="ga-qa-foot">
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--ga-muted)" }}>
                    {question.youtubeUrl && <span>動画あり</span>}
                    {question.documentUrl && <span>資料あり</span>}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(question._id);
                    }}
                    disabled={!user}
                    className="ga-btn ga-btn-ghost"
                    style={!user ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                  >
                    {question.isLiked ? "❤️" : "🤍"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* カテゴリー別統計 */}
        <div className="ga-block ga-surface-card">
          <div className="ga-section-head" style={{ marginBottom: 20 }}>
            <div className="ga-headline">
              <span className="ga-eyebrow">Categories</span>
              <h2>カテゴリー別質問数</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {topCategories.map((category, index) => {
              const maxCount = Math.max(...topCategories.map(c => c.count));
              const percentage = (category.count / maxCount) * 100;

              return (
                <div key={category.category} className="text-center">
                  <div className="relative mb-3">
                    <div
                      className="w-16 h-16 mx-auto rounded-full flex items-center justify-center relative overflow-hidden"
                      style={{ background: "var(--ga-line)" }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 transition-all duration-1000"
                        style={{ height: `${percentage}%`, background: "var(--ga-gold)" }}
                      ></div>
                      <span className="relative z-10 text-lg font-bold" style={{ color: "var(--ga-teal-deep)" }}>
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--ga-ink)" }}>
                    {category.category}
                  </h4>
                  <div className="text-2xl font-bold" style={{ color: "var(--ga-teal-deep)" }}>{category.count}</div>
                  <div className="text-xs" style={{ color: "var(--ga-muted)" }}>質問</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
