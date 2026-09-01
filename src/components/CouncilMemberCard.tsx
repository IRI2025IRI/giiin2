import { Doc } from "../../convex/_generated/dataModel";

interface CouncilMemberCardProps {
  member: Doc<"councilMembers"> & { memberPhotoUrl?: string | null };
  onClick?: () => void;
}

export function CouncilMemberCard({ member, onClick }: CouncilMemberCardProps) {
  // 検索エンジンのクローラーがリンクとして認識できるよう実体のあるhrefを持たせつつ、
  // 実際のクリックはSPA内遷移として処理する
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return; // 新しいタブで開く操作等はブラウザ標準の挙動に任せる
    }
    e.preventDefault();
    if (onClick) {
      onClick();
    } else {
      // Fallback to custom event
      window.dispatchEvent(new CustomEvent('memberClick', { detail: member._id }));
    }
  };

  return (
    <a
      href={`?view=memberDetail&member=${member._id}`}
      onClick={handleClick}
      className="block bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group overflow-hidden"
    >
      {/* Photo Section */}
      <div className="relative h-32 sm:h-40 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
        {(member.memberPhotoUrl || member.photoUrl) ? (
          <img
            src={member.memberPhotoUrl || member.photoUrl}
            alt={member.name}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="text-4xl sm:text-6xl text-gray-400">👤</div>
        )}
        {member.isActive && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            現職
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-6">
        <div className="mb-3">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors mb-1">
            {member.name}
          </h3>
          {member.politicalParty && (
            <p className="text-xs sm:text-sm text-gray-600 mb-2">{member.politicalParty}</p>
          )}
          {member.position && (
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {member.position}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500 mb-3">
          <span>当選回数: {member.electionCount || 0}回</span>
          <span>任期: {new Date(member.termStart).getFullYear()}年〜</span>
        </div>

        {/* Bio Preview */}
        {member.bio && (
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">
            {member.bio}
          </p>
        )}

        {/* Contact Info */}
        <div className="flex flex-wrap gap-2">
          {member.email && (
            <div className="flex items-center text-xs text-gray-500">
              <span className="mr-1">📧</span>
              <span className="truncate max-w-24">メール</span>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center text-xs text-gray-500">
              <span className="mr-1">📞</span>
              <span>電話</span>
            </div>
          )}
          {member.website && (
            <div className="flex items-center text-xs text-gray-500">
              <span className="mr-1">🌐</span>
              <span>サイト</span>
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
