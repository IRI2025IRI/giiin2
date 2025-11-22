import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface FAQItem {
  _id: Id<"faqItems">;
  question: string;
  answer: string;
  category: string;
  order: number;
  isPublished: boolean;
  createdBy: Id<"users">;
  updatedBy?: Id<"users">;
  createdAt: number;
  updatedAt?: number;
}

export function FAQManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    order: 1,
    isPublished: true,
  });

  const faqs = useQuery(api.faq.getAllFAQs);
  const categories = useQuery(api.faq.getCategories);
  const createFAQ = useMutation(api.faq.createFAQ);
  const updateFAQ = useMutation(api.faq.updateFAQ);
  const deleteFAQ = useMutation(api.faq.deleteFAQ);
  const createSampleFAQs = useMutation(api.faqSampleData.createSampleFAQs);
  const deleteSampleFAQs = useMutation(api.faqSampleData.deleteSampleFAQs);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim() || !formData.answer.trim() || !formData.category.trim()) {
      toast.error("質問、回答、カテゴリは必須項目です");
      return;
    }

    try {
      if (editingFaq) {
        await updateFAQ({
          id: editingFaq._id,
          ...formData,
        });
        toast.success("FAQを更新しました");
      } else {
        await createFAQ(formData);
        toast.success("FAQを作成しました");
      }
      
      resetForm();
    } catch (error) {
      toast.error(editingFaq ? "FAQの更新に失敗しました" : "FAQの作成に失敗しました");
      console.error(error);
    }
  };

  const handleEdit = (faq: FAQItem) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order: faq.order,
      isPublished: faq.isPublished,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: Id<"faqItems">) => {
    if (!confirm("このFAQを削除してもよろしいですか？")) {
      return;
    }

    try {
      await deleteFAQ({ id });
      toast.success("FAQを削除しました");
    } catch (error) {
      toast.error("FAQの削除に失敗しました");
      console.error(error);
    }
  };

  const handleCreateSampleData = async () => {
    if (!confirm("サンプルFAQデータを作成しますか？\n既存のデータがある場合は作成されません。")) {
      return;
    }

    try {
      const result = await createSampleFAQs();
      toast.success(result.message);
    } catch (error) {
      toast.error("サンプルデータの作成に失敗しました");
      console.error(error);
    }
  };

  const handleDeleteAllFAQs = async () => {
    if (!confirm("全てのFAQデータを削除しますか？\nこの操作は取り消せません。")) {
      return;
    }

    try {
      const result = await deleteSampleFAQs();
      toast.success(result.message);
    } catch (error) {
      toast.error("FAQデータの削除に失敗しました");
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "",
      order: 1,
      isPublished: true,
    });
    setEditingFaq(null);
    setIsFormOpen(false);
  };

  if (faqs === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin animate-amano-glow"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          FAQ管理
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105 amano-crystal-border animate-amano-glow text-sm"
          >
            新規FAQ作成
          </button>
          {faqs.length === 0 && (
            <button
              onClick={handleCreateSampleData}
              className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:from-green-500 hover:to-emerald-400 transition-all duration-500 transform hover:scale-105 amano-crystal-border text-sm"
            >
              サンプルデータ作成
            </button>
          )}
          {faqs.length > 0 && (
            <button
              onClick={handleDeleteAllFAQs}
              className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-lg font-medium hover:from-red-500 hover:to-red-400 transition-all duration-500 transform hover:scale-105 amano-crystal-border text-sm"
            >
              全削除
            </button>
          )}
        </div>
      </div>

      {/* FAQ作成・編集フォーム */}
      {isFormOpen && (
        <div className="amano-bg-card p-6 rounded-lg border border-purple-500 amano-card-glow">
          <h3 className="text-xl font-bold text-yellow-400 mb-4 amano-text-glow">
            {editingFaq ? "FAQ編集" : "新規FAQ作成"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                質問 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="auth-input-field"
                placeholder="よくある質問を入力してください"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                回答 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                className="auth-input-field min-h-32"
                placeholder="回答を入力してください"
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  カテゴリ <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="auth-input-field"
                  placeholder="カテゴリ名"
                  list="categories"
                  required
                />
                <datalist id="categories">
                  {categories?.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  表示順序
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                  className="auth-input-field"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  公開状態
                </label>
                <select
                  value={formData.isPublished ? "published" : "draft"}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.value === "published" })}
                  className="auth-input-field"
                >
                  <option value="published">公開</option>
                  <option value="draft">下書き</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="auth-button flex-1"
              >
                {editingFaq ? "更新" : "作成"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FAQ一覧 */}
      <div className="space-y-4">
        {faqs.length === 0 ? (
          <div className="text-center py-12 amano-bg-card rounded-lg border border-purple-500 amano-card-glow">
            <div className="text-6xl mb-4">❓</div>
            <h3 className="text-xl font-semibold text-gray-400 mb-4">
              FAQがまだ作成されていません
            </h3>
            <p className="text-gray-500 mb-6">
              サンプルデータを作成するか、新規FAQを作成してください
            </p>
            <button
              onClick={handleCreateSampleData}
              className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-500 hover:to-emerald-400 transition-all duration-500 transform hover:scale-105 amano-crystal-border animate-amano-glow"
            >
              サンプルデータを作成
            </button>
          </div>
        ) : (
          faqs.map((faq) => (
            <div key={faq._id} className="amano-bg-card p-6 rounded-lg border border-purple-500 amano-card-glow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm px-2 py-1 bg-purple-600 text-white rounded">
                      {faq.category}
                    </span>
                    <span className="text-sm text-gray-400">
                      順序: {faq.order}
                    </span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      faq.isPublished 
                        ? "bg-green-600 text-white" 
                        : "bg-gray-600 text-gray-300"
                    }`}>
                      {faq.isPublished ? "公開" : "下書き"}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2 amano-text-glow">
                    {faq.question}
                  </h3>
                  <p className="text-gray-300 line-clamp-3">
                    {faq.answer}
                  </p>
                  <div className="text-xs text-gray-500 mt-2">
                    作成日: {new Date(faq.createdAt).toLocaleDateString('ja-JP')}
                    {faq.updatedAt && (
                      <span className="ml-4">
                        更新日: {new Date(faq.updatedAt).toLocaleDateString('ja-JP')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(faq)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(faq._id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
