import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { CouncilMemberCard } from "./CouncilMemberCard";

interface CouncilMemberListProps {
  onMemberClick: (memberId: Id<"councilMembers">) => void;
}

export function CouncilMemberList({ onMemberClick }: CouncilMemberListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showFilters, setShowFilters] = useState(false);
  
  const members = useQuery(api.councilMembers.list, { activeOnly: true });
  const memberStats: any[] = [];

  if (!members) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">読み込み中...</p>
        </div>
      </div>
    );
  }

  // Get unique groups for filter
  const groups = Array.from(new Set(members.map(m => m.party).filter(Boolean)));

  // Filter and sort members
  const filteredMembers = members
    .filter(member => {
      const matchesSearch = searchQuery === "" || 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.party && member.party.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (member.position && member.position.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesGroup = selectedGroup === "all" || member.party === selectedGroup;
      
      return matchesSearch && matchesGroup;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name, 'ja');
        case "group":
          return (a.party || "").localeCompare(b.party || "", 'ja');
        case "questions":
          const aStats = memberStats?.find(s => s.memberId === a._id);
          const bStats = memberStats?.find(s => s.memberId === b._id);
          return (bStats?.questionCount || 0) - (aStats?.questionCount || 0);
        case "likes":
          const aLikes = memberStats?.find(s => s.memberId === a._id);
          const bLikes = memberStats?.find(s => s.memberId === b._id);
          return (bLikes?.totalLikes || 0) - (aLikes?.totalLikes || 0);
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          👥 三原市議会議員一覧
        </h1>
        <p className="text-gray-300 text-sm sm:text-base">
          現在の議員数: {members.length}名
        </p>
      </div>

      {/* Filters */}
      <div className="amano-bg-card rounded-xl p-4 sm:p-6 shadow-2xl border border-purple-500/30">
        {/* Filter Toggle Button */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-yellow-400 amano-text-glow">
            🔍 検索・フィルター
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors flex items-center space-x-2"
          >
            <span>{showFilters ? "閉じる" : "開く"}</span>
            <span className={`transform transition-transform ${showFilters ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>
        </div>

        {/* Collapsible Filter Content */}
        {showFilters && (
          <div className="space-y-4 animate-slideDown">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  検索
                </label>
                <input
                  type="text"
                  placeholder="議員名、会派、役職で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="auth-input-field text-sm"
                />
              </div>

              {/* Group Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  会派
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="auth-input-field text-sm"
                >
                  <option value="all">すべて</option>
                  {groups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  並び順
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="auth-input-field text-sm"
                >
                  <option value="name">名前順</option>
                  <option value="group">会派順</option>
                  <option value="questions">質問数順</option>
                  <option value="likes">いいね数順</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="flex items-end">
                <div className="text-sm text-gray-400">
                  {filteredMembers.length}名 / {members.length}名
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Info (always visible) */}
        <div className={`${showFilters ? 'mt-4 pt-4 border-t border-purple-500/30' : ''} flex justify-between items-center text-sm text-gray-400`}>
          <span>{filteredMembers.length}名の議員が見つかりました</span>
        </div>
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-400">該当する議員が見つかりませんでした</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredMembers.map((member, index) => (
            <div
              key={member._id}
              className="animate-slideUp"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CouncilMemberCard
                member={member}
                onClick={() => onMemberClick(member._id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Data Source Attribution */}
      <div className="amano-bg-card rounded-xl p-4 sm:p-6 shadow-2xl border border-purple-500/30 text-center">
        <h3 className="text-lg sm:text-xl font-bold text-yellow-400 mb-4 amano-text-glow">
          📊 データ出典について
        </h3>
        <div className="text-gray-300 text-sm sm:text-base space-y-2">
          <p>
            議員情報・写真は
            <a 
              href="https://www.city.mihara.hiroshima.jp/site/gikai/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-yellow-400 underline hover:no-underline transition-colors mx-1"
            >
              三原市議会公式サイト
            </a>
            から取得しています。
          </p>
          <p className="text-xs text-gray-400">
            ※ 議員の写真・プロフィール情報等の著作権は三原市に帰属します
          </p>
          <p className="text-xs text-gray-400">
            ※ 最新の正確な情報については、必ず公式サイトをご確認ください
          </p>
        </div>
      </div>
    </div>
  );
}
