import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { CouncilMemberForm } from "./CouncilMemberForm";

export function MemberManagement() {
  const members = useQuery(api.councilMembers.list, {});
  const deleteMember = useMutation(api.councilMembers.remove);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Doc<"councilMembers"> | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  const handleEdit = (member: Doc<"councilMembers">) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: Id<"councilMembers">) => {
    if (confirm("この議員を削除してもよろしいですか？")) {
      try {
        await deleteMember({ id });
      } catch (error) {
        console.error("Failed to delete member:", error);
      }
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingMember(null);
  };

  const handleFormSuccess = () => {
    // Form will close automatically
  };

  const filteredMembers = members?.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.party?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.position?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === "all" || 
                         (filterActive === "active" && member.isActive) ||
                         (filterActive === "inactive" && !member.isActive);
    
    return matchesSearch && matchesFilter;
  });

  if (!members) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-yellow-400 flex items-center space-x-2 amano-text-glow">
            <span>⚔️</span>
            <span>議員管理</span>
          </h2>
          <p className="text-gray-300 text-sm mt-1">
            議員情報の追加・編集・削除
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105 amano-crystal-border"
        >
          ➕ 新しい議員を追加
        </button>
      </div>

      {/* Filters */}
      <div className="amano-bg-glass rounded-xl p-4 space-y-4 amano-crystal-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="議員名、会派、役職で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="auth-input-field"
            />
          </div>
          <div className="flex space-x-2">
            {[
              { value: "all", label: "全て" },
              { value: "active", label: "現職" },
              { value: "inactive", label: "非現職" }
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterActive(filter.value as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  filterActive === filter.value
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                    : "amano-bg-card text-gray-300 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="amano-bg-glass rounded-xl overflow-hidden amano-crystal-border">
        {filteredMembers && filteredMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-medium">議員名</th>
                  <th className="px-6 py-4 text-left font-medium hidden sm:table-cell">会派</th>
                  <th className="px-6 py-4 text-left font-medium hidden md:table-cell">役職</th>
                  <th className="px-6 py-4 text-left font-medium">ステータス</th>
                  <th className="px-6 py-4 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500">
                {filteredMembers.map((member, index) => (
                  <tr 
                    key={member._id} 
                    className={`hover:bg-gradient-to-r hover:from-purple-900/20 hover:to-blue-900/20 transition-all duration-300 ${
                      index % 2 === 0 ? "amano-bg-card" : "bg-transparent"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {member.photoUrl ? (
                            <img 
                              src={member.photoUrl} 
                              alt={member.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            member.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-200">{member.name}</div>
                          <div className="text-sm text-gray-400 sm:hidden">
                            {member.party && <span>{member.party}</span>}
                            {member.position && <span className="ml-2">({member.position})</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 hidden sm:table-cell">
                      {member.party || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-300 hidden md:table-cell">
                      {member.position || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.isActive 
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" 
                          : "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
                      }`}>
                        {member.isActive ? "現職" : "非現職"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(member)}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded text-sm hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(member._id)}
                          className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded text-sm hover:from-pink-500 hover:to-red-500 transition-all duration-300 transform hover:scale-105"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-300 text-lg">
              {searchTerm || filterActive !== "all" ? "条件に一致する議員が見つかりません" : "議員が登録されていません"}
            </p>
            {!searchTerm && filterActive === "all" && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="mt-4 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105"
              >
                最初の議員を追加
              </button>
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <CouncilMemberForm
          member={editingMember || undefined}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
