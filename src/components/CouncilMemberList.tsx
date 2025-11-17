import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CouncilMemberCard } from "./CouncilMemberCard";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface CouncilMemberListProps {
  onMemberClick: (memberId: Id<"councilMembers">) => void;
}

export function CouncilMemberList({ onMemberClick }: CouncilMemberListProps) {
  const [selectedParty, setSelectedParty] = useState<string>("all");
  const members = useQuery(api.councilMembers.list, {});

  if (!members) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">議員データを読み込み中...</p>
        </div>
      </div>
    );
  }

  // 会派でグループ化
  const membersByParty = members.reduce((acc, member) => {
    const party = member.party || "無所属";
    if (!acc[party]) {
      acc[party] = [];
    }
    acc[party].push(member);
    return acc;
  }, {} as Record<string, typeof members>);

  // 会派一覧を取得（メンバー数順でソート）
  const parties = Object.entries(membersByParty)
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([party, members]) => ({ name: party, count: members.length }));

  // フィルタリングされたメンバー
  const filteredMembers = selectedParty === "all" 
    ? members 
    : membersByParty[selectedParty] || [];

  const partyColors = [
    "from-blue-500 to-blue-600",
    "from-green-500 to-green-600", 
    "from-orange-500 to-orange-600",
    "from-purple-500 to-purple-600",
    "from-pink-500 to-pink-600",
    "from-indigo-500 to-indigo-600",
    "from-red-500 to-red-600",
    "from-yellow-500 to-yellow-600"
  ];

  const getPartyColor = (partyName: string) => {
    const index = parties.findIndex(p => p.name === partyName);
    return partyColors[index % partyColors.length];
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">👥 議員一覧</h2>
        <p className="text-gray-600">市議会議員の詳細情報をご覧いただけます</p>
      </div>

      {/* Party Filter Tabs */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm">
            🏷️
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-800">所属別フィルター</h3>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedParty("all")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              selectedParty === "all"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span>👥</span>
            <span>すべて ({members.length}名)</span>
          </button>
          
          {parties.map((party) => (
            <button
              key={party.name}
              onClick={() => setSelectedParty(party.name)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedParty === party.name
                  ? `bg-gradient-to-r ${getPartyColor(party.name)} text-white shadow-lg`
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className={`w-4 h-4 bg-gradient-to-br ${getPartyColor(party.name)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                {party.name.charAt(0)}
              </div>
              <span>{party.name} ({party.count}名)</span>
            </button>
          ))}
        </div>

        {/* Selected Party Info */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg">📊</span>
              <div>
                <h4 className="font-bold text-gray-800">
                  {selectedParty === "all" ? "全議員" : selectedParty}
                </h4>
                <p className="text-sm text-gray-600">
                  {filteredMembers.length}名の議員が表示されています
                </p>
              </div>
            </div>
            {selectedParty !== "all" && (
              <div className={`w-12 h-12 bg-gradient-to-br ${getPartyColor(selectedParty)} rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
                {selectedParty.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border-l-4 border-blue-500">
        <div className="flex items-center space-x-3 mb-8">
          <div className={`w-12 h-12 bg-gradient-to-br ${selectedParty === "all" ? "from-blue-500 to-purple-500" : getPartyColor(selectedParty)} rounded-full flex items-center justify-center text-white text-xl font-bold`}>
            {selectedParty === "all" ? "👥" : selectedParty.charAt(0)}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              {selectedParty === "all" ? "全議員" : selectedParty}
            </h3>
            <p className="text-gray-600">{filteredMembers.length}名</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMembers.map((member, index) => (
            <div
              key={member._id}
              className="animate-slideUp cursor-pointer"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => onMemberClick(member._id)}
            >
              <CouncilMemberCard member={member} />
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {members.length === 0 && (
        <div className="text-center py-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl border-2 border-dashed border-blue-300">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-6 animate-bounce">
            😔
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">議員データがありません</h3>
          <p className="text-gray-600 text-lg">
            ※ これはサンプルデータです。実際のデータは三原市議会のAPIから取得する予定です。
          </p>
        </div>
      )}

      {/* No Results for Filter */}
      {members.length > 0 && filteredMembers.length === 0 && (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl border-2 border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
            🔍
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">該当する議員がいません</h3>
          <p className="text-gray-600">
            「{selectedParty}」に所属する議員は現在登録されていません。
          </p>
        </div>
      )}
    </div>
  );
}
