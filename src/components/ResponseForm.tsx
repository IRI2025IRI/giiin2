import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ResponseFormProps {
  questionId?: Id<"questions">;
  response?: any;
  onClose?: () => void;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function ResponseForm({ questionId, response, onClose, onSuccess, onCancel }: ResponseFormProps) {
  const [formData, setFormData] = useState({
    content: response?.content || "",
    respondentTitle: response?.respondentTitle || "",
    department: response?.department || "",
    responseDate: response?.responseDate 
      ? new Date(response.responseDate).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0],
    documentUrl: response?.documentUrl || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const addResponse = useMutation(api.questions.addResponse);
  const updateResponse = useMutation(api.questions.updateResponse);

  // モーダルの表示位置を現在のスクロール位置に設定
  const [modalPosition, setModalPosition] = useState({ top: 0 });
  
  useEffect(() => {
    // モーダル表示時にスクロールを無効化
    document.body.style.overflow = 'hidden';
    
    // クリーンアップ関数でスクロールを復元
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionId && !response) return;
    
    setIsSubmitting(true);

    try {
      const responseDate = new Date(formData.responseDate).getTime();
      
      if (response) {
        // 編集の場合
        await updateResponse({
          responseId: response._id,
          content: formData.content,
          respondentTitle: formData.respondentTitle || undefined,
          department: formData.department || undefined,
          documentUrl: formData.documentUrl || undefined,
          responseDate,
        });
      } else {
        // 新規作成の場合
        if (!questionId) {
          throw new Error("質問IDが必要です");
        }
        await addResponse({
          questionId,
          content: formData.content,
          respondentTitle: formData.respondentTitle || undefined,
          department: formData.department || undefined,
          documentUrl: formData.documentUrl || undefined,
          responseDate: Date.now(),
        });
      }
      
      onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error saving response:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center p-4">
      <div className="amano-bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto amano-crystal-border">
        <div className="sticky top-0 amano-bg-glass border-b border-purple-500 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-200 flex items-center space-x-2 amano-text-glow">
              <span>💬</span>
              <span>{response ? "回答を編集" : "新しい回答を追加"}</span>
            </h2>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-yellow-400 text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* 基本情報 */}
          <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
            <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center space-x-2 amano-text-glow">
              <span>📋</span>
              <span>回答情報</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  担当部署
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                  className="auth-input-field"
                  placeholder="例：総務部、企画課など（未記入の場合は「未記入」と表示されます）"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  回答者役職
                </label>
                <input
                  type="text"
                  value={formData.respondentTitle}
                  onChange={(e) => handleInputChange("respondentTitle", e.target.value)}
                  className="auth-input-field"
                  placeholder="例：市長、部長、課長など（未記入の場合は「未記入」と表示されます）"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  回答日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.responseDate}
                  onChange={(e) => handleInputChange("responseDate", e.target.value)}
                  className="auth-input-field"
                />
              </div>
            </div>
          </div>

          {/* 回答内容 */}
          <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
            <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center space-x-2 amano-text-glow">
              <span>💬</span>
              <span>回答内容</span>
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                回答内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                rows={8}
                className="auth-input-field"
                placeholder="市からの回答内容を入力してください"
              />
            </div>
          </div>

          {/* 関連資料 */}
          <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
            <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center space-x-2 amano-text-glow">
              <span>📄</span>
              <span>関連資料</span>
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                資料URL
              </label>
              <input
                type="url"
                value={formData.documentUrl}
                onChange={(e) => handleInputChange("documentUrl", e.target.value)}
                className="auth-input-field"
                placeholder="https://example.com/document.pdf"
              />
            </div>
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-purple-500">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-purple-500 text-gray-300 rounded-lg hover:bg-purple-500 hover:bg-opacity-20 hover:text-white font-medium transition-all duration-300 amano-crystal-border"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-button"
            >
              {isSubmitting ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>保存中...</span>
                </span>
              ) : (
                <span>{response ? "更新" : "作成"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
