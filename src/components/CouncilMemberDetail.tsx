import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { QuestionCard } from "./QuestionCard";
import { useState } from "react";

interface CouncilMemberDetailProps {
  memberId: Id<"councilMembers">;
  onBack: () => void;
  onQuestionClick: (questionId: Id<"questions">) => void;
}

export function CouncilMemberDetail({ memberId, onBack, onQuestionClick }: CouncilMemberDetailProps) {
  const member = useQuery(api.councilMembers.getById, { id: memberId });
  const questions = useQuery(api.questions.getByMemberId, { memberId });
  const user = useQuery(api.auth.loggedInUser);
  const isAdmin = useQuery(api.admin.isAdmin);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

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

  const displayedQuestions = showAllQuestions ? questions : questions?.slice(0, 5);
  const hasMoreQuestions = questions && questions.length > 5;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-yellow-400 hover:text-cyan-300 font-medium transition-all duration-300 text-sm sm:text-base amano-text-glow"
      >
        <span>←</span>
        <span className="hidden sm:inline">議員一覧に戻る</span>
        <span className="sm:hidden">戻る</span>
      </button>

      {/* Member Profile */}
      <div className="amano-bg-card rounded-xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 amano-crystal-border">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* Photo */}
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-yellow-400 shadow-lg amano-card-glow">
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={`${member.name}の写真`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                  {member.name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2 amano-text-glow">
              {member.name}
            </h1>
            
            <div className="space-y-2 text-gray-300">
              {member.politicalParty && (
                <p className="text-sm sm:text-base">
                  <span className="text-cyan-400">政党：</span>
                  {member.politicalParty}
                </p>
              )}
              {member.position && (
                <p className="text-sm sm:text-base">
                  <span className="text-cyan-400">役職：</span>
                  {member.position}
                </p>
              )}
              {member.committee && (
                <p className="text-sm sm:text-base">
                  <span className="text-cyan-400">委員会：</span>
                  {member.committee}
                </p>
              )}
              <p className="text-sm sm:text-base">
                <span className="text-cyan-400">任期：</span>
                {new Date(member.termStart).toLocaleDateString('ja-JP')}
                {member.termEnd && ` ～ ${new Date(member.termEnd).toLocaleDateString('ja-JP')}`}
              </p>
              {member.electionCount && (
                <p className="text-sm sm:text-base">
                  <span className="text-cyan-400">当選回数：</span>
                  {member.electionCount}回
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        {(member.email || member.phone || member.website) && (
          <div className="mt-6 pt-6 border-t border-purple-500/30">
            <h3 className="text-lg font-bold text-yellow-400 mb-3 amano-text-glow">連絡先</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {member.email && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-cyan-400">📧</span>
                  <a href={`mailto:${member.email}`} className="text-gray-300 hover:text-yellow-400 transition-colors break-all">
                    {member.email}
                  </a>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-cyan-400">📞</span>
                  <a href={`tel:${member.phone}`} className="text-gray-300 hover:text-yellow-400 transition-colors">
                    {member.phone}
                  </a>
                </div>
              )}
              {member.website && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-cyan-400">🌐</span>
                  <a href={member.website} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-yellow-400 transition-colors break-all">
                    ウェブサイト
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bio */}
        {member.bio && (
          <div className="mt-6 pt-6 border-t border-purple-500/30">
            <h3 className="text-lg font-bold text-yellow-400 mb-3 amano-text-glow">プロフィール</h3>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
              {member.bio}
            </p>
          </div>
        )}

        {/* Data Source Attribution */}
        <div className="mt-6 pt-6 border-t border-purple-500/30">
          <p className="text-xs text-gray-400 text-center">
            ※ 議員情報・写真は
            <a 
              href="https://www.city.mihara.hiroshima.jp/site/gikai/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-yellow-400 underline hover:no-underline transition-colors mx-1"
            >
              三原市議会公式サイト
            </a>
            より取得（著作権：三原市）
          </p>
        </div>
      </div>

      {/* Questions Section */}
      <div className="amano-bg-card rounded-xl p-4 sm:p-6 shadow-2xl border border-purple-500/30">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 amano-text-glow">
            📜 質問・回答履歴
          </h2>
          <div className="text-sm text-gray-400">
            {questions?.length || 0}件
          </div>
        </div>

        {!questions ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300">読み込み中...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-400">まだ質問がありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedQuestions?.map((question, index) => (
              <div
                key={question._id}
                className="animate-slideUp cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => onQuestionClick(question._id)}
              >
                <QuestionCard 
                  question={{
                    ...question,
                    memberName: member.name,
                    memberParty: member.politicalParty,
                    memberPhotoUrl: member.photoUrl,
                    likeCount: 0,
                    isLiked: false,
                    responseCount: question.responses?.length || 0
                  }} 
                />
              </div>
            ))}
            
            {hasMoreQuestions && !showAllQuestions && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setShowAllQuestions(true)}
                  className="auth-button max-w-xs mx-auto"
                >
                  すべての質問を表示 ({questions.length - 5}件)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
