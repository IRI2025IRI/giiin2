import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function ContactManagement() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<Id<"contactMessages"> | null>(null);
  const [responseText, setResponseText] = useState("");

  const contactMessages = useQuery(api.contact.getContactMessages, 
    selectedStatus === "all" ? {} : { status: selectedStatus }
  );
  const updateStatus = useMutation(api.contact.updateContactStatus);

  const handleStatusUpdate = async (messageId: Id<"contactMessages">, newStatus: "new" | "in_progress" | "resolved") => {
    try {
      await updateStatus({
        id: messageId,
        status: newStatus,
        response: responseText || undefined,
      });
      toast.success("ステータスを更新しました");
      setSelectedMessage(null);
      setResponseText("");
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("ステータスの更新に失敗しました");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "resolved":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new":
        return "新規";
      case "in_progress":
        return "対応中";
      case "resolved":
        return "解決済み";
      default:
        return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "general":
        return "一般的なお問い合わせ";
      case "bug":
        return "バグ報告";
      case "feature":
        return "機能要望";
      case "data":
        return "データに関するお問い合わせ";
      case "partnership":
        return "連携・協力のご相談";
      case "other":
        return "その他";
      default:
        return category;
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-yellow-400 amano-text-glow">
          📧 お問い合わせ管理
        </h2>
        
        {/* ステータスフィルター */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-300">ステータス:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="auth-input-field text-sm py-2"
          >
            <option value="all">すべて</option>
            <option value="new">新規</option>
            <option value="in_progress">対応中</option>
            <option value="resolved">解決済み</option>
          </select>
        </div>
      </div>

      {/* 統計情報 */}
      {contactMessages && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="amano-bg-card rounded-lg p-4 border border-purple-500/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {contactMessages.length}
              </div>
              <div className="text-sm text-gray-300">総件数</div>
            </div>
          </div>
          <div className="amano-bg-card rounded-lg p-4 border border-red-500/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {contactMessages.filter(m => m.status === "new").length}
              </div>
              <div className="text-sm text-gray-300">新規</div>
            </div>
          </div>
          <div className="amano-bg-card rounded-lg p-4 border border-yellow-500/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {contactMessages.filter(m => m.status === "in_progress").length}
              </div>
              <div className="text-sm text-gray-300">対応中</div>
            </div>
          </div>
          <div className="amano-bg-card rounded-lg p-4 border border-green-500/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {contactMessages.filter(m => m.status === "resolved").length}
              </div>
              <div className="text-sm text-gray-300">解決済み</div>
            </div>
          </div>
        </div>
      )}

      {/* お問い合わせ一覧 */}
      <div className="amano-bg-card rounded-xl p-6 border border-purple-500/30">
        {!contactMessages ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300">読み込み中...</p>
          </div>
        ) : contactMessages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-300">お問い合わせはありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contactMessages.map((message) => (
              <div
                key={message._id}
                className="amano-bg-glass rounded-lg p-4 border border-gray-500/30 hover:border-yellow-400/50 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(message.status)}`}>
                        {getStatusLabel(message.status)}
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {getCategoryLabel(message.category)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(message.submittedAt).toLocaleString("ja-JP")}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-white">
                        {message.subject || "件名なし"}
                      </h3>
                      <p className="text-sm text-gray-300">
                        {message.name} ({message.email})
                      </p>
                    </div>
                    
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {message.message}
                    </p>
                    
                    {message.response && (
                      <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded">
                        <p className="text-xs text-green-300 font-medium">回答:</p>
                        <p className="text-sm text-gray-300">{message.response}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => setSelectedMessage(selectedMessage === message._id ? null : message._id)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                    >
                      {selectedMessage === message._id ? "閉じる" : "詳細"}
                    </button>
                  </div>
                </div>
                
                {/* 詳細表示・ステータス更新 */}
                {selectedMessage === message._id && (
                  <div className="mt-4 pt-4 border-t border-gray-500/30 space-y-4">
                    <div>
                      <h4 className="font-medium text-yellow-400 mb-2">メッセージ全文:</h4>
                      <div className="p-3 bg-gray-800/50 rounded border border-gray-600/30">
                        <p className="text-gray-300 whitespace-pre-wrap">{message.message}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        回答・メモ:
                      </label>
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="回答やメモを入力..."
                        rows={3}
                        className="auth-input-field resize-none"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleStatusUpdate(message._id, "new")}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                      >
                        新規に戻す
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(message._id, "in_progress")}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
                      >
                        対応中にする
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(message._id, "resolved")}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                      >
                        解決済みにする
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
