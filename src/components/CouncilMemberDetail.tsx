import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { QuestionCard } from "./QuestionCard";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

interface CouncilMemberDetailProps {
  memberId: Id<"councilMembers">;
  onBack: () => void;
  onQuestionClick: (questionId: Id<"questions">) => void;
}

export function CouncilMemberDetail({ memberId, onBack, onQuestionClick }: CouncilMemberDetailProps) {
  const [activeTab, setActiveTab] = useState("profile");

  const member = useQuery(api.councilMembers.get, { id: memberId });
  const memberStats = useQuery(api.councilMembers.getStats, { memberId });
  const memberQuestions = useQuery(api.questions.list, { councilMemberId: memberId });

  useDocumentMeta({
    title: member
      ? `${member.name}${member.position ? `（${member.position}）` : ""} - 三原市議会議員 | GIIIN/ギイーン`
      : "GIIIN/ギイーン - 議員活動を身近に。【広島県三原市】",
    description: member
      ? `${member.name}議員（${[member.party, member.position].filter(Boolean).join(" / ") || "三原市議会議員"}）の質問・回答・活動実績をGIIIN/ギイーンで見る。`
      : undefined,
    canonicalUrl: member ? `https://giiin.info/?view=memberDetail&member=${member._id}` : undefined,
    structuredData: member
      ? {
          "@context": "https://schema.org",
          "@type": "Person",
          name: member.name,
          jobTitle: member.position || "三原市議会議員",
          affiliation: member.party || undefined,
          memberOf: {
            "@type": "GovernmentOrganization",
            name: "三原市議会",
          },
          url: `https://giiin.info/?view=memberDetail&member=${member._id}`,
          image: member.photoUrl || undefined,
        }
      : undefined,
  });

  if (!member) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="ga-spinner mb-4"></div>
          <p style={{ color: "var(--ga-muted)" }}>読み込み中...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "profile", name: "プロフィール" },
    { id: "questions", name: "質問一覧" },
    { id: "stats", name: "統計" },
  ];

  const infoRow = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between">
      <span style={{ color: "var(--ga-muted)" }}>{label}:</span>
      <span style={{ color: "var(--ga-ink)" }}>{value}</span>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold mb-4" style={{ color: "var(--ga-ink)" }}>基本情報</h3>
                <div className="space-y-3 text-sm">
                  {infoRow("氏名", member.name)}
                  {member.party && infoRow("会派", member.party)}
                  {member.position && infoRow("役職", member.position)}
                  {member.electionCount && infoRow("当選回数", `${member.electionCount}回`)}
                  {member.committee && infoRow("委員会", member.committee)}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4" style={{ color: "var(--ga-ink)" }}>連絡先</h3>
                <div className="space-y-3 text-sm">
                  {member.phone && infoRow("電話", member.phone)}
                  {member.email && infoRow(
                    "メール",
                    <a href={`mailto:${member.email}`} style={{ color: "var(--ga-teal-deep)" }}>{member.email}</a>
                  )}
                  {member.website && infoRow(
                    "ウェブサイト",
                    <a href={member.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ga-teal-deep)" }}>公式サイト</a>
                  )}
                  {member.blogUrl && infoRow(
                    "ブログ",
                    <a href={member.blogUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ga-teal-deep)" }}>ブログ</a>
                  )}
                </div>
              </div>
            </div>

            {/* 経歴・プロフィール */}
            {member.bio && (
              <div>
                <h3 className="text-lg font-bold mb-4" style={{ color: "var(--ga-ink)" }}>経歴・プロフィール</h3>
                <div className="p-4 rounded-lg" style={{ background: "var(--ga-paper)", border: "1px solid var(--ga-line)" }}>
                  <p className="whitespace-pre-wrap" style={{ color: "var(--ga-muted)" }}>{member.bio}</p>
                </div>
              </div>
            )}

            {/* 備考 */}
            {member.notes && (
              <div>
                <h3 className="text-lg font-bold mb-4" style={{ color: "var(--ga-ink)" }}>備考</h3>
                <div className="p-4 rounded-lg" style={{ background: "var(--ga-paper)", border: "1px solid var(--ga-line)" }}>
                  <p className="whitespace-pre-wrap" style={{ color: "var(--ga-muted)" }}>{member.notes}</p>
                </div>
              </div>
            )}
          </div>
        );

      case "questions":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold" style={{ color: "var(--ga-ink)" }}>
              質問一覧 ({memberQuestions?.length || 0}件)
            </h3>
            {memberQuestions && memberQuestions.length > 0 ? (
              <div className="space-y-4">
                {memberQuestions.map((question) => (
                  <QuestionCard
                    key={question._id}
                    question={question}
                    onClick={() => onQuestionClick(question._id)}
                  />
                ))}
              </div>
            ) : (
              <div className="ga-empty">
                <p>まだ質問がありません</p>
              </div>
            )}
          </div>
        );

      case "stats":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold" style={{ color: "var(--ga-ink)" }}>活動統計</h3>
            {memberStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="ga-surface-card text-center">
                  <div className="ga-jf" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--ga-teal-deep)" }}>
                    {memberStats.totalQuestions}
                  </div>
                  <div className="text-sm mt-1" style={{ color: "var(--ga-muted)" }}>総質問数</div>
                </div>
                <div className="ga-surface-card text-center">
                  <div className="ga-jf" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--ga-teal-deep)" }}>
                    {memberStats.questionsThisYear}
                  </div>
                  <div className="text-sm mt-1" style={{ color: "var(--ga-muted)" }}>今年の質問数</div>
                </div>
                <div className="ga-surface-card text-center">
                  <div className="ga-jf" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--ga-teal-deep)" }}>
                    {memberStats.totalLikes}
                  </div>
                  <div className="text-sm mt-1" style={{ color: "var(--ga-muted)" }}>気になる数</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="ga-spinner mb-4"></div>
                <p style={{ color: "var(--ga-muted)" }}>統計を読み込み中...</p>
              </div>
            )}

            {/* カテゴリー別統計 */}
            {memberStats && memberStats.categories.length > 0 && (
              <div>
                <h4 className="text-md font-bold mb-4" style={{ color: "var(--ga-ink)" }}>カテゴリー別質問数</h4>
                <div className="space-y-2">
                  {memberStats.categories.map((category) => (
                    <div
                      key={category.name}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: "var(--ga-paper)", border: "1px solid var(--ga-line)" }}
                    >
                      <span style={{ color: "var(--ga-ink)" }}>{category.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 rounded-full h-2" style={{ background: "var(--ga-line)" }}>
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${(category.count / Math.max(...memberStats.categories.map(c => c.count))) * 100}%`,
                              background: "var(--ga-gold)",
                            }}
                          />
                        </div>
                        <span className="font-bold min-w-[2rem] text-right" style={{ color: "var(--ga-teal-deep)" }}>{category.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="ga-page">
      <div className="ga-main" style={{ paddingTop: "clamp(24px, 5vw, 40px)" }}>
        {/* 戻るボタン */}
        <button onClick={onBack} className="ga-btn ga-btn-ghost ga-block">
          ← 議員一覧に戻る
        </button>

        {/* ヘッダー */}
        <div className="ga-block ga-surface-card">
          <div className="flex items-start gap-4 sm:gap-6">
            {/* 写真 */}
            <div
              className="ga-avatar flex-shrink-0"
              style={{ width: "clamp(56px, 18vw, 96px)", height: "clamp(56px, 18vw, 96px)", fontSize: "clamp(1.1rem, 4vw, 2rem)" }}
            >
              {member.photoUrl ? <img src={member.photoUrl} alt={member.name} /> : member.name.charAt(0)}
            </div>

            {/* 基本情報 */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--ga-ink)" }}>{member.name}</h1>
              <div className="flex flex-wrap gap-2 mb-4">
                {member.party && <span className="ga-tag neutral">{member.party}</span>}
                {member.position && <span className="ga-tag accent">{member.position}</span>}
              </div>
              <div className="text-sm" style={{ color: "var(--ga-muted)" }}>
                <p>
                  任期: {new Date(member.termStart).toLocaleDateString("ja-JP")} 〜{" "}
                  {member.termEnd ? new Date(member.termEnd).toLocaleDateString("ja-JP") : "現在"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="ga-block flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? "ga-btn ga-btn-primary" : "ga-btn ga-btn-ghost"}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* タブコンテンツ */}
        <div className="ga-block ga-surface-card">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
