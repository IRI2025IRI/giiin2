import { useState } from "react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionId) return;
    
    setIsSubmitting(true);

    try {
      const responseDate = new Date(formData.responseDate).getTime();
      
      await addResponse({
        questionId,
        content: formData.content,
        respondentTitle: formData.respondentTitle,
        department: formData.department || undefined,
        documentUrl: formData.documentUrl || undefined,
      });
      
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
              <span>💬</span>
              <span>{response ? "回答を編集（AI自動要約）" : "新しい回答を追加（AI自動要約）"}</span>
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* 基本情報 */}
          <div className="bg-indigo-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center space-x-2">
              <span>📋</span>
              <span>回答情報（AI自動要約）</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  担当部署 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="例：総務部、企画課など"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  回答者役職 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.respondentTitle}
                  onChange={(e) => handleInputChange("respondentTitle", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="例：市長、部長、課長など"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  回答日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.responseDate}
                  onChange={(e) => handleInputChange("responseDate", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 回答内容 */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center space-x-2">
              <span>💬</span>
              <span>回答内容</span>
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                回答内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="市からの回答内容を入力してください"
              />
            </div>
          </div>

          {/* 関連資料 */}
          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center space-x-2">
              <span>📄</span>
              <span>関連資料</span>
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                資料URL
              </label>
              <input
                type="url"
                value={formData.documentUrl}
                onChange={(e) => handleInputChange("documentUrl", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://example.com/document.pdf"
              />
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
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-lg hover:from-indigo-600 hover:to-blue-700 font-medium transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
