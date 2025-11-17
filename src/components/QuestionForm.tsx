import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { ResponseForm } from "./ResponseForm";

interface QuestionFormProps {
  question?: (Doc<"questions"> & { responses?: any[] }) | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuestionForm({ question, onClose, onSuccess }: QuestionFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    councilMemberId: "",
    sessionDate: new Date().toISOString().split('T')[0],
    sessionNumber: "",
    youtubeUrl: "",
    documentUrl: "",
    status: "pending",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSessionNumberDropdown, setShowSessionNumberDropdown] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [editingResponse, setEditingResponse] = useState<any>(undefined);
  const [deletingResponseId, setDeletingResponseId] = useState<string | null>(null);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);
  
  const members = useQuery(api.councilMembers.list, { activeOnly: true });
  const sessionNumbers = useQuery(api.questions.getSessionNumbers);
  const createQuestion = useMutation(api.questions.create);
  const updateQuestion = useMutation(api.questions.update);
  const deleteResponse = useMutation(api.questions.deleteResponse);
  const deleteQuestion = useMutation(api.questions.remove);

  // questionプロパティが変更されたときにフォームデータを更新
  useEffect(() => {
    if (question) {
      setFormData({
        title: question.title || "",
        content: question.content || "",
        category: question.category || "",
        councilMemberId: question.councilMemberId || "",
        sessionDate: question.sessionDate ? new Date(question.sessionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        sessionNumber: question.sessionNumber || "",
        youtubeUrl: question.youtubeUrl || "",
        documentUrl: question.documentUrl || "",
        status: question.status || "pending",
      });
    } else {
      // 新規作成の場合は初期値をリセット
      setFormData({
        title: "",
        content: "",
        category: "",
        councilMemberId: "",
        sessionDate: new Date().toISOString().split('T')[0],
        sessionNumber: "",
        youtubeUrl: "",
        documentUrl: "",
        status: "pending",
      });
    }
  }, [question]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const sessionDate = new Date(formData.sessionDate).getTime();
      
      if (question) {
        // 更新
        await updateQuestion({
          id: question._id,
          title: formData.title,
          content: formData.content,
          category: formData.category,
          sessionDate,
          sessionNumber: formData.sessionNumber || undefined,
          youtubeUrl: formData.youtubeUrl || undefined,
          documentUrl: formData.documentUrl || undefined,
          status: formData.status as "pending" | "answered" | "archived",
        });
      } else {
        // 新規作成
        await createQuestion({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          councilMemberId: formData.councilMemberId as Id<"councilMembers">,
          sessionDate,
          sessionNumber: formData.sessionNumber || undefined,
          youtubeUrl: formData.youtubeUrl || undefined,
          documentUrl: formData.documentUrl || undefined,
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving question:", error);
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

  const handleSessionNumberSelect = (sessionNumber: string) => {
    handleInputChange("sessionNumber", sessionNumber);
    setShowSessionNumberDropdown(false);
  };

  const handleDeleteResponse = async (responseId: string) => {
    if (!confirm("この回答を削除してもよろしいですか？")) {
      return;
    }

    setDeletingResponseId(responseId);
    try {
      await deleteResponse({ id: responseId as Id<"responses"> });
      onSuccess(); // Refresh the data
    } catch (error) {
      console.error("Error deleting response:", error);
      alert("回答の削除に失敗しました: " + (error as Error).message);
    } finally {
      setDeletingResponseId(null);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!question) return;
    
    if (!confirm("この質問を削除してもよろしいですか？\n※関連する回答やいいねも全て削除されます。")) {
      return;
    }

    setIsDeletingQuestion(true);
    try {
      await deleteQuestion({ id: question._id });
      onSuccess(); // Refresh the data
      onClose(); // Close the form
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("質問の削除に失敗しました: " + (error as Error).message);
    } finally {
      setIsDeletingQuestion(false);
    }
  };

  const categories = [
    "教育・文化",
    "福祉・健康",
    "子育て・少子化",
    "高齢者・介護",
    "都市計画・建設",
    "環境・エネルギー",
    "産業・経済",
    "農林水産業",
    "観光・地域振興",
    "行政・財政",
    "防災・安全",
    "交通・インフラ",
    "医療・保健",
    "スポーツ・レクリエーション",
    "人権・男女共同参画",
    "情報化・デジタル",
    "国際交流・多文化共生",
    "その他"
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
              <span>{question ? "✏️" : "➕"}</span>
              <span>{question ? "質問を編集" : "新しい質問を追加"}</span>
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
              <span>❓</span>
              <span>基本情報</span>
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  質問タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="質問のタイトルを入力してください"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  質問内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="質問の詳細内容を入力してください"
                />
              </div>
            </div>
          </div>

          {/* 分類・議員情報 */}
          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center space-x-2">
              <span>🏷️</span>
              <span>分類・議員情報</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カテゴリー <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">カテゴリーを選択</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  質問議員 <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.councilMemberId}
                  onChange={(e) => handleInputChange("councilMemberId", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">議員を選択</option>
                  {members?.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 会議情報 */}
          <div className="bg-purple-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center space-x-2">
              <span>📅</span>
              <span>会議情報</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  会議日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.sessionDate}
                  onChange={(e) => handleInputChange("sessionDate", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  会議番号
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.sessionNumber}
                    onChange={(e) => handleInputChange("sessionNumber", e.target.value)}
                    onFocus={() => setShowSessionNumberDropdown(true)}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="第○回定例会など"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSessionNumberDropdown(!showSessionNumberDropdown)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-sm">▼</span>
                  </button>
                  
                  {/* ドロップダウンリスト */}
                  {showSessionNumberDropdown && sessionNumbers && sessionNumbers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      <div className="p-2 border-b border-gray-200">
                        <div className="text-xs text-gray-500 font-medium">過去の会議番号から選択</div>
                      </div>
                      {sessionNumbers.map((sessionNumber, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSessionNumberSelect(sessionNumber || "")}
                          className="w-full text-left px-4 py-2 hover:bg-purple-50 text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                        >
                          {sessionNumber}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* 入力フィールドの外をクリックしたときにドロップダウンを閉じる */}
                {showSessionNumberDropdown && (
                  <div 
                    className="fixed inset-0 z-5"
                    onClick={() => setShowSessionNumberDropdown(false)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* リンク情報 */}
          <div className="bg-orange-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center space-x-2">
              <span>🔗</span>
              <span>関連リンク</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={formData.youtubeUrl}
                  onChange={(e) => handleInputChange("youtubeUrl", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  資料URL
                </label>
                <input
                  type="url"
                  value={formData.documentUrl}
                  onChange={(e) => handleInputChange("documentUrl", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="https://example.com/document.pdf"
                />
              </div>
            </div>
          </div>

          {/* ステータス（編集時のみ） */}
          {question && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <span>⚙️</span>
                <span>ステータス</span>
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  回答状況
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="pending">回答待ち</option>
                  <option value="answered">回答済み</option>
                  <option value="archived">アーカイブ</option>
                </select>
              </div>
            </div>
          )}

          {/* 市からの回答（編集時のみ） */}
          {question && (
            <div className="bg-indigo-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-indigo-800 flex items-center space-x-2">
                  <span>💬</span>
                  <span>市からの回答（AI自動要約）</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowResponseForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors"
                >
                  <span>➕</span>
                  <span>回答を追加</span>
                </button>
              </div>
              
              {question.responses && question.responses.length > 0 ? (
                <div className="space-y-4">
                  {question.responses.map((response: any) => (
                    <div key={response._id} className="bg-white rounded-lg p-4 border border-indigo-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                              {response.department || "担当部署未設定"}
                            </span>
                            <span className="text-sm text-gray-600">
                              {response.respondentTitle}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(response.responseDate).toLocaleDateString("ja-JP")}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">{response.content}</p>
                          {response.documentUrl && (
                            <a
                              href={response.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm mt-2"
                            >
                              <span>📄</span>
                              <span>関連資料</span>
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingResponse(response);
                            setShowResponseForm(true);
                          }}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteResponse(response._id)}
                          disabled={deletingResponseId === response._id}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                        >
                          {deletingResponseId === response._id ? "削除中..." : "削除"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-400 text-xl mx-auto mb-3">
                    💬
                  </div>
                  <p className="text-indigo-600 text-sm">まだ回答がありません</p>
                  <p className="text-indigo-500 text-xs mt-1">「回答を追加」ボタンから回答を登録してください</p>
                </div>
              )}
            </div>
          )}

          {/* ボタン */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            {/* 削除ボタン（編集時のみ） */}
            <div>
              {question && (
                <button
                  type="button"
                  onClick={handleDeleteQuestion}
                  disabled={isDeletingQuestion}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isDeletingQuestion ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>削除中...</span>
                    </>
                  ) : (
                    <>
                      <span>🗑️</span>
                      <span>質問を削除</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* 右側のボタン */}
            <div className="flex space-x-4">
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
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 font-medium transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>保存中...</span>
                  </span>
                ) : (
                  <span>{question ? "更新" : "作成"}</span>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* 回答フォームモーダル */}
        {showResponseForm && (
          <ResponseForm
            questionId={question?._id}
            response={editingResponse}
            onClose={() => {
              setShowResponseForm(false);
              setEditingResponse(undefined);
            }}
            onSuccess={() => {
              setShowResponseForm(false);
              setEditingResponse(undefined);
            }}
          />
        )}
      </div>
    </div>
  );
}
