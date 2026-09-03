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
      className="block ga-surface-card overflow-hidden transition-transform duration-300 hover:-translate-y-1"
      style={{ padding: 0 }}
    >
      {/* Photo Section */}
      <div
        className="relative h-32 sm:h-40 flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, var(--ga-teal-soft), var(--ga-gold-soft))" }}
      >
        {(member.memberPhotoUrl || member.photoUrl) ? (
          <img
            src={member.memberPhotoUrl || member.photoUrl}
            alt={member.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="ga-jf" style={{ fontSize: "2rem", color: "var(--ga-teal)" }}>
            {member.name.charAt(0)}
          </div>
        )}
        {member.isActive && (
          <div className="absolute top-2 right-2 ga-tag neutral">現職</div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-6">
        <div className="mb-3">
          <h3 className="text-lg sm:text-xl font-bold mb-1" style={{ color: "var(--ga-ink)" }}>
            {member.name}
          </h3>
          {member.politicalParty && (
            <p className="text-xs sm:text-sm mb-2" style={{ color: "var(--ga-muted)" }}>{member.politicalParty}</p>
          )}
          {member.position && (
            <span className="ga-pill cat">{member.position}</span>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center text-xs sm:text-sm mb-3" style={{ color: "var(--ga-muted)" }}>
          <span>当選回数: {member.electionCount || 0}回</span>
          <span>任期: {new Date(member.termStart).getFullYear()}年〜</span>
        </div>

        {/* Bio Preview */}
        {member.bio && (
          <p className="text-xs sm:text-sm line-clamp-2 mb-3" style={{ color: "var(--ga-muted)" }}>
            {member.bio}
          </p>
        )}

        {/* Contact Info */}
        <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--ga-muted)" }}>
          {member.email && <span>メール</span>}
          {member.phone && <span>電話</span>}
          {member.website && <span>サイト</span>}
        </div>
      </div>
    </a>
  );
}
