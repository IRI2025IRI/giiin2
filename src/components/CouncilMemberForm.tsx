import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";

interface CouncilMemberFormProps {
  member?: Doc<"councilMembers">;
  onClose: () => void;
  onSuccess: () => void;
}

export function CouncilMemberForm({ member, onClose, onSuccess }: CouncilMemberFormProps) {
  const [formData, setFormData] = useState({
    name: member?.name || "",
    position: member?.position || "",
    party: member?.party || "",
    politicalParty: member?.politicalParty || "",
    electionCount: member?.electionCount || 0,
    committee: member?.committee || "",
    address: member?.address || "",
    phone: member?.phone || "",
    email: member?.email || "",
    website: member?.website || "",
    blogUrl: member?.blogUrl || "",
    bio: member?.bio || "",
    notes: member?.notes || "",
    photoUrl: member?.photoUrl || "",
    isActive: member?.isActive ?? true,
    termStart: member?.termStart ? new Date(member.termStart).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    termEnd: member?.termEnd ? new Date(member.termEnd).toISOString().split('T')[0] : "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const createMember = useMutation(api.councilMembers.create);
  const updateMember = useMutation(api.councilMembers.update);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (member) {
        // 更新
        await updateMember({
          id: member._id,
          ...formData,
          termStart: new Date(formData.termStart).getTime(),
          termEnd: formData.termEnd ? new Date(formData.termEnd).getTime() : undefined,
        });
      } else {
        // 新規作成
        await createMember({
          ...formData,
          termStart: new Date(formData.termStart).getTime(),
          termEnd: formData.termEnd ? new Date(formData.termEnd).getTime() : undefined,
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving member:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
              <span>{member ? "✏️" : "➕"}</span>
              <span>{member ? "議員情報を編集" : "新しい議員を追加"}</span>
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* 基本情報 */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center space-x-2">
              <span>👤</span>
              <span>基本情報</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  氏名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="山田太郎"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  写真URL
                </label>
                <input
                  type="url"
                  value={formData.photoUrl}
                  onChange={(e) => handleInputChange("photoUrl", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  役職
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleInputChange("position", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="議長、副議長など"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  当選回数
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.electionCount}
                  onChange={(e) => handleInputChange("electionCount", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          {/* 所属・会派情報 */}
          <div className="bg-purple-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center space-x-2">
              <span>🏷️</span>
              <span>所属・会派情報</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所属会派
                </label>
                <input
                  type="text"
                  value={formData.party}
                  onChange={(e) => handleInputChange("party", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="○○会派"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所属党派
                </label>
                <input
                  type="text"
                  value={formData.politicalParty}
                  onChange={(e) => handleInputChange("politicalParty", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="○○党"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  常任委員会
                </label>
                <input
                  type="text"
                  value={formData.committee}
                  onChange={(e) => handleInputChange("committee", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="総務委員会、文教委員会など"
                />
              </div>
            </div>
          </div>

          {/* 任期情報 */}
          <div className="bg-orange-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center space-x-2">
              <span>📅</span>
              <span>任期情報</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任期開始日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.termStart}
                  onChange={(e) => handleInputChange("termStart", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任期終了日
                </label>
                <input
                  type="date"
                  value={formData.termEnd}
                  onChange={(e) => handleInputChange("termEnd", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  任期終了日が未定の場合は空欄にしてください
                </p>
              </div>
            </div>
          </div>

          {/* 連絡先情報 */}
          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center space-x-2">
              <span>📞</span>
              <span>連絡先情報</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  住所
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="広島県三原市..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0848-xx-xxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="example@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  公式サイト
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ブログURL
                </label>
                <input
                  type="url"
                  value={formData.blogUrl}
                  onChange={(e) => handleInputChange("blogUrl", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="https://blog.example.com"
                />
              </div>
            </div>
          </div>

          {/* プロフィール・備考 */}
          <div className="bg-orange-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center space-x-2">
              <span>📝</span>
              <span>プロフィール・備考</span>
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プロフィール
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="経歴、政治信条、趣味など..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  備考
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="その他の情報..."
                />
              </div>
            </div>
          </div>

          {/* ステータス */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <span>⚙️</span>
              <span>ステータス</span>
            </h3>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange("isActive", e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                現職議員
              </label>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 font-medium transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>保存中...</span>
                </span>
              ) : (
                <span>{member ? "更新" : "作成"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
