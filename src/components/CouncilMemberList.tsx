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
          <div className="ga-spinner mb-4"></div>
          <p style={{ color: "var(--ga-muted)" }}>読み込み中...</p>
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
        case "questions": {
          const aStats = memberStats?.find(s => s.memberId === a._id);
          const bStats = memberStats?.find(s => s.memberId === b._id);
          return (bStats?.questionCount || 0) - (aStats?.questionCount || 0);
        }
        case "likes": {
          const aLikes = memberStats?.find(s => s.memberId === a._id);
          const bLikes = memberStats?.find(s => s.memberId === b._id);
          return (bLikes?.totalLikes || 0) - (aLikes?.totalLikes || 0);
        }
        default:
          return 0;
      }
    });

  return (
    <div className="ga-page">
      <div className="ga-page-header">
        <h1>三原市議会議員一覧</h1>
        <p>現在の議員数: {members.length}名</p>
      </div>

      <div className="ga-main">
        {/* Filters */}
        <div className="ga-block ga-surface-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: "var(--ga-ink)" }}>検索・フィルター</h3>
            <button onClick={() => setShowFilters(!showFilters)} className="ga-btn ga-btn-ghost">
              <span>{showFilters ? "閉じる" : "開く"}</span>
              <span className={`transform transition-transform ${showFilters ? "rotate-180" : ""}`}>▾</span>
            </button>
          </div>

          {showFilters && (
            <div className="space-y-4 animate-slideDown">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="ga-field">
                  <label>検索</label>
                  <input
                    type="text"
                    placeholder="議員名、会派、役職で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ga-input"
                  />
                </div>

                <div className="ga-field">
                  <label>会派</label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="ga-select"
                  >
                    <option value="all">すべて</option>
                    {groups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ga-field">
                  <label>並び順</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="ga-select"
                  >
                    <option value="name">名前順</option>
                    <option value="group">会派順</option>
                    <option value="questions">質問数順</option>
                    <option value="likes">気になる数順</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <div className="text-sm" style={{ color: "var(--ga-muted)" }}>
                    {filteredMembers.length}名 / {members.length}名
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            className="flex justify-between items-center text-sm"
            style={showFilters ? { marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--ga-line)", color: "var(--ga-muted)" } : { color: "var(--ga-muted)" }}
          >
            <span>{filteredMembers.length}名の議員が見つかりました</span>
          </div>
        </div>

        {/* Members Grid */}
        <div className="ga-block">
          {filteredMembers.length === 0 ? (
            <div className="ga-empty">
              <p>該当する議員が見つかりませんでした</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredMembers.map((member) => (
                <CouncilMemberCard
                  key={member._id}
                  member={member}
                  onClick={() => onMemberClick(member._id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Data Source Attribution */}
        <div className="ga-block ga-surface-card text-center">
          <h3 className="text-lg sm:text-xl font-bold mb-4" style={{ color: "var(--ga-ink)" }}>
            データ出典について
          </h3>
          <div className="text-sm sm:text-base space-y-2" style={{ color: "var(--ga-muted)" }}>
            <p>
              議員情報は
              <a
                href="https://www.city.mihara.hiroshima.jp/site/gikai/"
                target="_blank"
                rel="noopener noreferrer"
                className="mx-1"
                style={{ color: "var(--ga-teal-deep)", textDecoration: "underline" }}
              >
                三原市議会公式サイト
              </a>
              から取得しています。
            </p>
            <p className="text-xs">
              ※ 最新の正確な情報については、必ず公式サイトをご確認ください
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
