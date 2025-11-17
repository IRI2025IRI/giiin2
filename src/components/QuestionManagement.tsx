import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { QuestionForm } from "./QuestionForm";
import { toast } from "sonner";

export function QuestionManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<Id<"councilMembers"> | "all">("all");
  
  const questions = useQuery(api.questions.list);
  const members = useQuery(api.councilMembers.list, {});
  const deleteQuestion = useMutation(api.questions.remove);
  
  // Get question with responses when editing
  const questionWithResponses = useQuery(
    api.questions.getById,
    editingQuestion ? { id: editingQuestion._id } : "skip"
  );

  const handleEdit = (question: any) => {
    setEditingQuestion(question);
    setIsFormOpen(true);
  };

  const handleDelete = async (questionId: Id<"questions">) => {
    if (!confirm("この質問を削除しますか？")) return;
    
    try {
      await deleteQuestion({ id: questionId });
      toast.success("質問を削除しました");
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("質問の削除に失敗しました");
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingQuestion(null);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingQuestion(null);
    toast.success(editingQuestion ? "質問を更新しました" : "質問を追加しました");
  };

  // Filter questions by selected member
  const filteredQuestions = questions?.filter(question => 
    selectedMember === "all" || question.councilMemberId === selectedMember
  ) || [];

  if (!questions || !members) {
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
        <h2 className="text-2xl font-bold text-gray-800">質問管理</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
        >
          新規質問追加
        </button>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">議員で絞り込み:</label>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value as Id<"councilMembers"> | "all")}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">すべての議員</option>
            {members.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">
            {filteredQuestions.length}件の質問
          </span>
        </div>
      </div>

      {/* 質問一覧 */}
      <div className="grid grid-cols-1 gap-4">
        {filteredQuestions.map((question) => {
          const member = members.find(m => m._id === question.councilMemberId);
          return (
            <div key={question._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      {question.category}
                    </span>
                    <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${
                      question.status === "answered" 
                        ? "bg-green-100 text-green-800"
                        : question.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {question.status === "answered" ? "回答済み" : 
                       question.status === "pending" ? "回答待ち" : "アーカイブ"}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{question.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{question.content}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>議員: {member?.name || "不明"}</span>
                    <span>会期: {new Date(question.sessionDate).toLocaleDateString('ja-JP')}</span>
                    {question.sessionNumber && <span>第{question.sessionNumber}回</span>}
                  </div>
                </div>
              </div>

              {/* 操作ボタン */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(question)}
                  className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(question._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 質問が存在しない場合 */}
      {filteredQuestions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❓</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {selectedMember === "all" ? "質問が登録されていません" : "該当する質問がありません"}
          </h3>
          <p className="text-gray-600 mb-6">
            {selectedMember === "all" ? "最初の質問を追加してください" : "別の議員を選択するか、新しい質問を追加してください"}
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
          >
            質問を追加
          </button>
        </div>
      )}

      {/* 質問追加・編集フォーム */}
      {isFormOpen && (
        <QuestionForm
          question={editingQuestion ? (questionWithResponses || editingQuestion) : undefined}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
