import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface TopMembersProps {
  onMemberClick: (memberId: Id<"councilMembers">) => void;
}

export function TopMembers({ onMemberClick }: TopMembersProps) {
  const rankingsData = useQuery(api.councilMembers.getRankings);

  if (!rankingsData || !rankingsData.rankings) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 text-sm">読み込み中...</span>
        </div>
      </div>
    );
  }

  const topMembers = rankingsData.rankings.slice(0, 5);

  if (topMembers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-2xl mx-auto mb-4">
          👤
        </div>
        <p className="text-gray-500">議員データがありません</p>
      </div>
    );
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return { icon: "🥇", color: "from-yellow-400 to-yellow-600" };
    if (index === 1) return { icon: "🥈", color: "from-gray-400 to-gray-600" };
    if (index === 2) return { icon: "🥉", color: "from-orange-400 to-orange-600" };
    return { icon: `${index + 1}`, color: "from-blue-400 to-blue-600" };
  };

  return (
    <div className="amano-bg-card rounded-xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 amano-crystal-border">
      <h3 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-4 sm:mb-6 amano-text-glow">
        🏆 質問数の多い議員
      </h3>
      <div className="space-y-3">
        {topMembers.map((item, index) => {
        if (!item.member) return null;
        const rankInfo = getRankIcon(index);
        return (
          <div
            key={item.member._id}
            onClick={() => onMemberClick(item.member._id)}
            className="relative flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-all duration-300 cursor-pointer group overflow-hidden"
          >
            {/* Background Photo */}
            {(item.member.photoId || item.member.photoUrl) ? (
              <MemberBackgroundPhoto 
                photoId={item.member.photoId} 
                photoUrl={item.member.photoUrl}
                memberName={item.member.name}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 opacity-15 group-hover:opacity-25 transition-opacity duration-300">
                <div className="absolute inset-0 flex items-center justify-center text-6xl text-blue-300 opacity-30">
                  👤
                </div>
              </div>
            )}
            
            {/* Content Overlay */}
            <div className="relative z-10 flex items-center space-x-3 w-full bg-white bg-opacity-90 rounded-lg p-2 backdrop-blur-sm">
              <div className={`w-8 h-8 bg-gradient-to-br ${rankInfo.color} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {rankInfo.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors text-sm truncate">
                  {item.member.name}
                </p>
                {item.member.party && (
                  <p className="text-xs text-gray-500 truncate">{item.member.party}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {item.stats.totalQuestions}
                </div>
                <div className="text-xs text-blue-500 font-medium">質問</div>
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

function MemberBackgroundPhoto({ photoId, photoUrl, memberName }: { 
  photoId?: Id<"_storage">, 
  photoUrl?: string,
  memberName: string 
}) {
  const storagePhotoUrl = useQuery(
    api.councilMembers.getPhotoUrl, 
    photoId ? { storageId: photoId } : "skip"
  );
  
  // 使用する画像URLを決定（storagePhotoUrl > photoUrl の優先順位）
  const imageUrl = storagePhotoUrl || photoUrl;
  
  if (!imageUrl) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 opacity-20 group-hover:opacity-30 transition-opacity duration-300">
        <div className="absolute inset-0 flex items-center justify-center text-6xl text-blue-300 opacity-50">
          👤
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 group-hover:opacity-40 transition-opacity duration-300"
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
    </div>
  );
}
