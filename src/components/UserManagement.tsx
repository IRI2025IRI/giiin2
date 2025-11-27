import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface EditUserModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: Id<"users">, data: { name?: string; email?: string }) => void;
}

function EditUserModal({ user, isOpen, onClose, onSave }: EditUserModalProps) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onSave(user._id, { name, email });
      onClose();
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="amano-bg-card rounded-lg p-6 w-full max-w-md amano-crystal-border">
        <h3 className="text-xl font-bold text-yellow-400 mb-4 amano-text-glow">
          ユーザー情報編集
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              名前
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input-field"
              placeholder="名前を入力してください"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input-field"
              placeholder="メールアドレスを入力してください"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg font-medium border-2 border-gray-500 text-gray-300 hover:border-yellow-400 hover:text-yellow-400 transition-all duration-300"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 auth-button"
            >
              {isLoading ? "更新中..." : "更新"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: Id<"users">) => void;
}

function DeleteConfirmModal({ user, isOpen, onClose, onConfirm }: DeleteConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !user) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(user._id);
      onClose();
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="amano-bg-card rounded-lg p-6 w-full max-w-md amano-crystal-border">
        <h3 className="text-xl font-bold text-red-400 mb-4 amano-text-glow">
          ⚠️ ユーザー削除確認
        </h3>
        
        <div className="space-y-4">
          <p className="text-gray-300">
            以下のユーザーを削除しますか？この操作は取り消せません。
          </p>
          
          <div className="amano-bg-glass rounded-lg p-4 border border-red-500">
            <p className="text-white font-medium">{user.name || "名前未設定"}</p>
            <p className="text-gray-300 text-sm">{user.email}</p>
            <p className="text-gray-400 text-xs">
              登録日: {new Date(user._creationTime).toLocaleDateString('ja-JP')}
            </p>
          </div>
          
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
            <p className="font-medium mb-1">⚠️ 注意</p>
            <p className="mb-2">
              このユーザーに関連する全てのデータ（いいね、作成したコンテンツなど）も削除されます。
            </p>
            <p className="text-xs">
              削除後、同じメールアドレスでの新規登録が可能になります。
            </p>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg font-medium border-2 border-gray-500 text-gray-300 hover:border-yellow-400 hover:text-yellow-400 transition-all duration-300"
            >
              キャンセル
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 py-2 px-4 rounded-lg font-medium bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? "削除中..." : "削除する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UserManagement() {
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [debugEmail, setDebugEmail] = useState("");
  const [debugResults, setDebugResults] = useState<any>(null);
  const [cleanupEmail, setCleanupEmail] = useState("");
  const [cleanupResults, setCleanupResults] = useState<any>(null);
  
  const users = useQuery(api.admin.getAllUsers);
  const userStats = useQuery(api.admin.getUserStats);
  const grantAdminRole = useMutation(api.admin.grantAdminRole);
  const revokeAdminRole = useMutation(api.admin.revokeAdminRole);
  const updateUser = useMutation(api.admin.updateUser);
  const deleteUser = useMutation(api.admin.deleteUser);
  const cleanupAuthByEmail = useMutation(api.admin.cleanupAuthByEmail);

  if (!users || !userStats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">ユーザー情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => {
    const matchesRole = selectedRole === "all" || 
      (selectedRole === "admin" && user.isAdmin) ||
      (selectedRole === "user" && !user.isAdmin);
    
    const matchesSearch = !searchTerm || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRole && matchesSearch;
  });

  const handleRoleChange = async (userId: Id<"users">, newRole: "admin" | "superAdmin" | "user") => {
    try {
      if (newRole === "user") {
        await revokeAdminRole({ targetUserId: userId });
      } else {
        await grantAdminRole({ targetUserId: userId, role: newRole });
      }
    } catch (error) {
      console.error("Failed to change role:", error);
    }
  };

  const handleUpdateUser = async (userId: Id<"users">, data: { name?: string; email?: string }) => {
    try {
      await updateUser({ userId, ...data });
    } catch (error) {
      console.error("Failed to update user:", error);
      throw error;
    }
  };

  const handleDeleteUser = async (userId: Id<"users">) => {
    try {
      await deleteUser({ userId });
      // 削除後、より長い時間待ってからページをリフレッシュ
      setTimeout(() => {
        window.location.reload();
      }, 3000); // 3秒に延長
    } catch (error) {
      console.error("Failed to delete user:", error);
      throw error;
    }
  };

  const handleCleanupAuth = async () => {
    if (!cleanupEmail) return;
    
    try {
      const result = await cleanupAuthByEmail({ email: cleanupEmail });
      setCleanupResults(result);
    } catch (error) {
      console.error("Cleanup failed:", error);
      setCleanupResults({ error: error instanceof Error ? error.message : "クリーンアップに失敗しました" });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "superAdmin":
        return "text-yellow-400";
      case "admin":
        return "text-purple-400";
      default:
        return "text-gray-300";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "superAdmin":
        return "運営者";
      case "admin":
        return "編集者";
      default:
        return "一般ユーザー";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          👤 ユーザー管理
        </h2>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="amano-bg-card rounded-lg p-4 text-center amano-crystal-border">
          <div className="text-2xl font-bold text-yellow-400 amano-text-glow">
            {userStats.totalUsers}
          </div>
          <div className="text-gray-300 text-sm">総ユーザー数</div>
        </div>
        <div className="amano-bg-card rounded-lg p-4 text-center amano-crystal-border">
          <div className="text-2xl font-bold text-purple-400 amano-text-glow">
            {userStats.adminUsers}
          </div>
          <div className="text-gray-300 text-sm">管理者</div>
        </div>
        <div className="amano-bg-card rounded-lg p-4 text-center amano-crystal-border">
          <div className="text-2xl font-bold text-cyan-400 amano-text-glow">
            {userStats.regularUsers}
          </div>
          <div className="text-gray-300 text-sm">一般ユーザー</div>
        </div>
        <div className="amano-bg-card rounded-lg p-4 text-center amano-crystal-border">
          <div className="text-2xl font-bold text-green-400 amano-text-glow">
            {userStats.demographicsCompleted}
          </div>
          <div className="text-gray-300 text-sm">属性登録済み</div>
        </div>
        <div className="amano-bg-card rounded-lg p-4 text-center amano-crystal-border">
          <div className="text-2xl font-bold text-blue-400 amano-text-glow">
            {userStats.emailsVerified}
          </div>
          <div className="text-gray-300 text-sm">メール認証済み</div>
        </div>
        <div className="amano-bg-card rounded-lg p-4 text-center amano-crystal-border">
          <div className="text-2xl font-bold text-orange-400 amano-text-glow">
            {userStats.emailsUnverified}
          </div>
          <div className="text-gray-300 text-sm">メール未認証</div>
        </div>
      </div>

      {/* フィルター */}
      <div className="amano-bg-card rounded-lg p-4 amano-crystal-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="名前またはメールアドレスで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="auth-input-field"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="auth-input-field"
            >
              <option value="all">全ての役割</option>
              <option value="admin">管理者</option>
              <option value="user">一般ユーザー</option>
            </select>
          </div>
        </div>
      </div>

      {/* ユーザー一覧 */}
      <div className="amano-bg-card rounded-lg amano-crystal-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="amano-bg-glass">
              <tr>
                <th className="text-left p-4 text-yellow-400 font-medium">ユーザー情報</th>
                <th className="text-left p-4 text-yellow-400 font-medium">役割</th>
                <th className="text-left p-4 text-yellow-400 font-medium">登録日</th>
                <th className="text-left p-4 text-yellow-400 font-medium">状態</th>
                <th className="text-center p-4 text-yellow-400 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user._id} className={index % 2 === 0 ? "amano-bg-glass" : ""}>
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-white">
                        {user.name || "名前未設定"}
                      </div>
                      <div className="text-sm text-gray-300">{user.email}</div>
                      {user.demographics && (
                        <div className="text-xs text-gray-400 mt-1">
                          {user.demographics.ageGroup} / {user.demographics.gender} / {user.demographics.region}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`font-medium ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300 text-sm">
                    {new Date(user._creationTime).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className={`text-xs px-2 py-1 rounded ${
                        user.emailStatus?.isVerified 
                          ? "bg-green-500/20 text-green-300" 
                          : "bg-orange-500/20 text-orange-300"
                      }`}>
                        {user.emailStatus?.isVerified ? "メール認証済み" : "メール未認証"}
                      </div>
                      {user.demographics && (
                        <div className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300">
                          属性登録済み
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center space-x-2">
                      {/* 役割変更 */}
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value as any)}
                        className="text-xs px-2 py-1 rounded bg-gray-700 text-white border border-gray-600"
                      >
                        <option value="user">一般ユーザー</option>
                        <option value="admin">編集者</option>
                        <option value="superAdmin">運営者</option>
                      </select>
                      
                      {/* 編集ボタン */}
                      <button
                        onClick={() => setEditingUser(user)}
                        className="px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                      >
                        編集
                      </button>
                      
                      {/* 削除ボタン */}
                      <button
                        onClick={() => setDeletingUser(user)}
                        className="px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
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
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            条件に一致するユーザーが見つかりません
          </div>
        )}
      </div>

      {/* クリーンアップ */}
      <div className="amano-bg-card rounded-lg p-4 amano-crystal-border">
        <h3 className="text-lg font-bold text-red-400 mb-3">🔧 認証データクリーンアップ</h3>
        <div className="flex space-x-3">
          <input
            type="email"
            placeholder="メールアドレス"
            value={cleanupEmail}
            onChange={(e) => setCleanupEmail(e.target.value)}
            className="auth-input-field flex-1"
          />
          <button
            onClick={handleCleanupAuth}
            disabled={!cleanupEmail}
            className="px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            実行
          </button>
        </div>
        {cleanupResults && (
          <div className={`mt-3 p-3 rounded text-sm ${
            cleanupResults.error ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"
          }`}>
            {cleanupResults.error || `${cleanupResults.cleanedCount} 件完了`}
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      <EditUserModal
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleUpdateUser}
      />

      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        user={deletingUser}
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}
