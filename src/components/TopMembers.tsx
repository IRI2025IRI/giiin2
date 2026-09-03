import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useReveal } from "../hooks/useGaAnimations";

interface TopMembersProps {
  onMemberClick: (memberId: Id<"councilMembers">) => void;
}

export function TopMembers({ onMemberClick }: TopMembersProps) {
  const rankingsData = useQuery(api.councilMembers.getRankings);
  const reveal = useReveal<HTMLDivElement>();

  if (!rankingsData || !rankingsData.rankings) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex items-center space-x-2">
          <div
            className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--ga-teal)" }}
          ></div>
          <span className="text-sm" style={{ color: "var(--ga-muted)" }}>読み込み中...</span>
        </div>
      </div>
    );
  }

  const topMembers = rankingsData.rankings.slice(0, 5);

  if (topMembers.length === 0) {
    return (
      <div className="ga-surface-card text-center py-8">
        <p style={{ color: "var(--ga-muted)" }}>議員データがありません</p>
      </div>
    );
  }

  const maxQuestions = topMembers[0]?.stats.totalQuestions || 1;
  const dotCount = 5;

  const renderAvatar = (member: { name: string; photoUrl?: string }) =>
    member.photoUrl ? (
      <span className="ga-avatar">
        <img src={member.photoUrl} alt={member.name} />
      </span>
    ) : (
      <span className="ga-avatar">{member.name.charAt(0)}</span>
    );

  const [spotlight, ...rows] = topMembers;

  return (
    <div ref={reveal.ref} className={reveal.className}>
      <div className="ga-member-feature-grid">
        {spotlight?.member && (
          <div
            onClick={() => onMemberClick(spotlight.member!._id)}
            className="ga-member-spotlight"
          >
            <MemberSpotlightAvatar
              photoId={spotlight.member.photoId}
              photoUrl={spotlight.member.photoUrl}
              memberName={spotlight.member.name}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="ga-rank">01</span>
                <h3 className="truncate">{spotlight.member.name}</h3>
              </div>
              {spotlight.member.party && <div className="ga-party">{spotlight.member.party}</div>}
              <div className="ga-qcount">質問数 {spotlight.stats.totalQuestions}件</div>
            </div>
          </div>
        )}

        <div className="ga-member-list">
          {rows.map((item, index) => {
            if (!item.member) return null;
            const filled = Math.max(1, Math.round((item.stats.totalQuestions / maxQuestions) * dotCount));
            return (
              <div
                key={item.member._id}
                onClick={() => onMemberClick(item.member!._id)}
                className="ga-member-row"
              >
                <span className="ga-rank">{String(index + 2).padStart(2, "0")}</span>
                {renderAvatar(item.member)}
                <div className="flex-1 min-w-0">
                  <div className="ga-name truncate">{item.member.name}</div>
                  {item.member.party && <div className="ga-party truncate">{item.member.party}</div>}
                </div>
                <div className="ga-dotmeter">
                  {Array.from({ length: dotCount }).map((_, i) => (
                    <span key={i} className={i < filled ? "fill" : ""} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MemberSpotlightAvatar({
  photoId,
  photoUrl,
  memberName,
}: {
  photoId?: Id<"_storage">;
  photoUrl?: string;
  memberName: string;
}) {
  const storagePhotoUrl = useQuery(
    api.councilMembers.getPhotoUrl,
    photoId ? { storageId: photoId } : "skip"
  );
  const imageUrl = storagePhotoUrl || photoUrl;

  return (
    <span className="ga-avatar">
      {imageUrl ? <img src={imageUrl} alt={memberName} /> : memberName.charAt(0)}
    </span>
  );
}
