import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { CouncilMemberForm } from "./CouncilMemberForm";
import { toast } from "sonner";

export function MemberManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Doc<"councilMembers"> | null>(null);
  
  const members = useQuery(api.councilMembers.list, {});
  const deleteMember = useMutation(api.councilMembers.remove);

  const handleEdit = (member: Doc<"councilMembers">) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleDelete = async (memberId: Id<"councilMembers">) => {
    if (!confirm("この議員を削除しますか？")) return;
    
    try {
      await deleteMember({ id: memberId });
      toast.success("議員を削除しました");
    } catch (error) {
      console.error("Error deleting member:", error);
      toast.error("議員の削除に失敗しました");
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingMember(null);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingMember(null);
    toast.success(editingMember ? "議員情報を更新しました" : "議員を追加しました");
  };

  if (!members) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">議員管理</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
        >
          新規議員追加
        </button>
      </div>

      {/* 議員一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div key={member._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* 議員情報 */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800 mb-1">{member.name}</h3>
                  {member.position && (
                    <p className="text-sm text-gray-600 mb-1">{member.position}</p>
                  )}
                  {member.party && (
                    <p className="text-sm text-blue-600">{member.party}</p>
                  )}
                </div>
                {!member.isActive && (
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                    非表示
                  </div>
                )}
              </div>

              {/* 追加情報 */}
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                {member.committee && (
                  <p>委員会: {member.committee}</p>
                )}
                {member.electionCount && (
                  <p>当選回数: {member.electionCount}回</p>
                )}
                <p>任期開始: {new Date(member.termStart).toLocaleDateString('ja-JP')}</p>
                {member.termEnd && (
                  <p>任期終了: {new Date(member.termEnd).toLocaleDateString('ja-JP')}</p>
                )}
              </div>

              {/* 操作ボタン */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(member)}
                  className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(member._id)}
                  className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 議員が存在しない場合 */}
      {members.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">議員が登録されていません</h3>
          <p className="text-gray-600 mb-6">最初の議員を追加してください</p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
          >
            議員を追加
          </button>
        </div>
      )}

      {/* 議員追加・編集フォーム */}
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
