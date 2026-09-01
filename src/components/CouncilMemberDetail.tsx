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
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">読み込み中...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "profile", name: "プロフィール", icon: "👤" },
    { id: "questions", name: "質問一覧", icon: "❓" },
    { id: "stats", name: "統計", icon: "📊" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold text-yellow-400 mb-4 amano-text-glow">
                  📋 基本情報
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">氏名:</span>
                    <span className="text-gray-200">{member.name}</span>
                  </div>
                  {member.party && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">会派:</span>
                      <span className="text-gray-200">{member.party}</span>
                    </div>
                  )}
                  {member.position && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">役職:</span>
                      <span className="text-gray-200">{member.position}</span>
                    </div>
                  )}
                  {member.electionCount && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">当選回数:</span>
                      <span className="text-gray-200">{member.electionCount}回</span>
                    </div>
                  )}
                  {member.committee && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">委員会:</span>
                      <span className="text-gray-200">{member.committee}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-yellow-400 mb-4 amano-text-glow">
                  📞 連絡先
                </h3>
                <div className="space-y-3 text-sm">
                  {member.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">電話:</span>
                      <span className="text-gray-200">{member.phone}</span>
                    </div>
                  )}
                  {member.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">メール:</span>
                      <a href={`mailto:${member.email}`} className="text-cyan-400 hover:text-yellow-400 transition-colors">
                        {member.email}
                      </a>
                    </div>
                  )}
                  {member.website && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">ウェブサイト:</span>
                      <a href={member.website} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-yellow-400 transition-colors">
                        公式サイト
                      </a>
                    </div>
                  )}
                  {member.blogUrl && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">ブログ:</span>
                      <a href={member.blogUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-yellow-400 transition-colors">
                        ブログ
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 経歴・プロフィール */}
            {member.bio && (
              <div>
                <h3 className="text-lg font-bold text-yellow-400 mb-4 amano-text-glow">
                  📖 経歴・プロフィール
                </h3>
                <div className="amano-bg-glass p-4 rounded-lg">
                  <p className="text-gray-200 whitespace-pre-wrap">{member.bio}</p>
                </div>
              </div>
            )}

            {/* 備考 */}
            {member.notes && (
              <div>
                <h3 className="text-lg font-bold text-yellow-400 mb-4 amano-text-glow">
                  📝 備考
                </h3>
                <div className="amano-bg-glass p-4 rounded-lg">
                  <p className="text-gray-200 whitespace-pre-wrap">{member.notes}</p>
                </div>
              </div>
            )}
          </div>
        );

      case "questions":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-yellow-400 amano-text-glow">
              ❓ 質問一覧 ({memberQuestions?.length || 0}件)
            </h3>
            {memberQuestions && memberQuestions.length > 0 ? (
              <div className="space-y-4">
                {memberQuestions.map((question, index) => (
                  <div
                    key={question._id}
                    className="animate-slideUp"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <QuestionCard
                      question={question}
                      onClick={() => onQuestionClick(question._id)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 amano-bg-glass rounded-lg">
                <div className="text-4xl mb-4">❓</div>
                <p className="text-gray-400">まだ質問がありません</p>
              </div>
            )}
          </div>
        );

      case "stats":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-yellow-400 amano-text-glow">
              📊 活動統計
            </h3>
            {memberStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="amano-bg-glass p-6 rounded-lg text-center">
                  <div className="text-3xl mb-2">❓</div>
                  <div className="text-2xl font-bold text-yellow-400">{memberStats.totalQuestions}</div>
                  <div className="text-sm text-gray-300">総質問数</div>
                </div>
                <div className="amano-bg-glass p-6 rounded-lg text-center">
                  <div className="text-3xl mb-2">📅</div>
                  <div className="text-2xl font-bold text-purple-400">{memberStats.questionsThisYear}</div>
                  <div className="text-sm text-gray-300">今年の質問数</div>
                </div>
                <div className="amano-bg-glass p-6 rounded-lg text-center">
                  <div className="text-3xl mb-2">🤔</div>
                  <div className="text-2xl font-bold text-cyan-400">{memberStats.totalLikes}</div>
                  <div className="text-sm text-gray-300">気になる数</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-300">統計を読み込み中...</p>
              </div>
            )}

            {/* カテゴリー別統計 */}
            {memberStats && memberStats.categories.length > 0 && (
              <div>
                <h4 className="text-md font-bold text-yellow-400 mb-4 amano-text-glow">
                  📈 カテゴリー別質問数
                </h4>
                <div className="space-y-2">
                  {memberStats.categories.map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between p-3 amano-bg-glass rounded-lg">
                      <span className="text-gray-200">{category.name}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-yellow-400 to-purple-400 h-2 rounded-full transition-all duration-1000"
                            style={{
                              width: `${(category.count / Math.max(...memberStats.categories.map(c => c.count))) * 100}%`,
                              animationDelay: `${index * 100}ms`
                            }}
                          />
                        </div>
                        <span className="text-yellow-400 font-bold min-w-[2rem] text-right">{category.count}</span>
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
    <div className="space-y-6 animate-fadeIn">
      {/* 戻るボタン */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-gray-300 hover:text-yellow-400 transition-colors"
      >
        <span>←</span>
        <span>議員一覧に戻る</span>
      </button>

      {/* ヘッダー */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <div className="flex items-start space-x-6">
          {/* 写真 */}
          <div className="flex-shrink-0">
            {member.photoUrl ? (
              <img
                src={member.photoUrl}
                alt={member.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-purple-400/30"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-4xl border-4 border-purple-400/30">
                👤
              </div>
            )}
          </div>

          {/* 基本情報 */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-yellow-400 mb-2 amano-text-glow">
              {member.name}
            </h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {member.party && (
                <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm">
                  {member.party}
                </span>
              )}
              {member.position && (
                <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm">
                  {member.position}
                </span>
              )}
            </div>
            <div className="text-gray-300 text-sm">
              <p>任期: {new Date(member.termStart).toLocaleDateString("ja-JP")} 〜 
                {member.termEnd ? new Date(member.termEnd).toLocaleDateString("ja-JP") : "現在"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="amano-bg-card rounded-xl p-4 amano-crystal-border">
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white shadow-lg transform scale-105"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* タブコンテンツ */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        {renderTabContent()}
      </div>
    </div>
  );
}
