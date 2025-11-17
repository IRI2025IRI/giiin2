import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface EditingUser {
  _id: string;
  name: string;
  email: string;
}

export function UserManagement() {
  const users = useQuery(api.admin.listUsers);
  const changeUserRole = useMutation(api.admin.changeUserRole);
  const updateUser = useMutation(api.admin.updateUser);
  const deleteUser = useMutation(api.admin.deleteUser);
  const isSuperAdmin = useQuery(api.admin.isSuperAdmin);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<{ _id: string; name: string } | null>(null);

  const handleRoleChange = async (userId: string, newRole: "user" | "admin" | "superAdmin") => {
    setIsLoading(userId);
    try {
      await changeUserRole({
        userId: userId as any,
        role: newRole,
      });
    } catch (error) {
      console.error("Error changing user role:", error);
      alert("権限の変更に失敗しました: " + (error as Error).message);
    } finally {
      setIsLoading(null);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser({
      _id: user._id,
      name: user.name || "",
      email: user.email || "",
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    setIsLoading(editingUser._id);
    try {
      await updateUser({
        userId: editingUser._id as any,
        name: editingUser.name,
        email: editingUser.email,
      });
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      alert("ユーザー情報の更新に失敗しました: " + (error as Error).message);
    } finally {
      setIsLoading(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleDeleteUser = (user: any) => {
    setDeletingUser({
      _id: user._id,
      name: user.name || user.email || "不明なユーザー",
    });
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;
    
    setIsLoading(deletingUser._id);
    try {
      await deleteUser({
        userId: deletingUser._id as any,
      });
      setDeletingUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("ユーザーの削除に失敗しました: " + (error as Error).message);
    } finally {
      setIsLoading(null);
    }
  };

  const cancelDeleteUser = () => {
    setDeletingUser(null);
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "superAdmin":
        return "bg-red-100 text-red-700";
      case "admin":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Only superAdmin can access user management
  if (isSuperAdmin === false) {
    return (
      <div className="text-center py-20">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-4xl mx-auto mb-6">
          🚫
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          アクセス権限がありません
        </h3>
        <p className="text-gray-600 text-lg">
          この機能を利用するには運営者権限が必要です。
        </p>
      </div>
    );
  }

  if (!users) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">ユーザーデータを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
          <span>👥</span>
          <span>ユーザー管理</span>
        </h3>
        <p className="text-gray-600 mb-6">
          登録ユーザーの権限を設定できます。編集者は質問・回答の追加・編集・削除が可能で、運営者は権限管理も可能です。
        </p>

        {users.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ユーザー名</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">メールアドレス</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">登録日</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">権限</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">
                              {user.name || "名前未設定"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">{user.email || "-"}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {new Date(user._creationTime).toLocaleDateString("ja-JP")}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                          >
                            編集
                          </button>
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value as "user" | "admin" | "superAdmin")}
                            disabled={isLoading === user._id}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="user">一般ユーザー</option>
                            <option value="admin">編集者</option>
                            <option value="superAdmin">運営者</option>
                          </select>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={isLoading === user._id}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            削除
                          </button>
                          {isLoading === user._id && (
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {users.map((user) => (
                <div key={user._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 truncate">
                        {user.name || "名前未設定"}
                      </h4>
                      <p className="text-sm text-gray-600 truncate">
                        {user.email || "-"}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>

                  {/* Registration Date */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>📅</span>
                      <span>登録日: {new Date(user._creationTime).toLocaleDateString("ja-JP")}</span>
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      権限設定
                    </label>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value as "user" | "admin" | "superAdmin")}
                      disabled={isLoading === user._id}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="user">一般ユーザー</option>
                      <option value="admin">編集者</option>
                      <option value="superAdmin">運営者</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      disabled={isLoading === user._id}
                      className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      disabled={isLoading === user._id}
                      className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      削除
                    </button>
                    {isLoading === user._id && (
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-2xl mx-auto mb-4">
              👥
            </div>
            <p className="text-gray-500">登録ユーザーがいません</p>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">ユーザー情報編集</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ユーザー名
                  </label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ユーザー名を入力"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="メールアドレスを入力"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSaveUser}
                  disabled={isLoading === editingUser._id}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading === editingUser._id ? "保存中..." : "保存"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-2xl">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">アカウント削除の確認</h3>
                  <p className="text-sm text-gray-600">この操作は取り消せません</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 mb-2">
                  <strong>{deletingUser.name}</strong> のアカウントを完全に削除しますか？
                </p>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• ユーザーアカウントが削除されます</li>
                  <li>• 投稿したお知らせが削除されます</li>
                  <li>• いいねした履歴が削除されます</li>
                  <li>• 管理者権限も削除されます</li>
                </ul>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={confirmDeleteUser}
                  disabled={isLoading === deletingUser._id}
                  className="flex-1 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading === deletingUser._id ? "削除中..." : "削除する"}
                </button>
                <button
                  onClick={cancelDeleteUser}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
