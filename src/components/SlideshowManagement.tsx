import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";

interface SlideFormData {
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  backgroundColor: string;
  order: number;
  isActive: boolean;
}

export function SlideshowManagement() {
  const slides = useQuery(api.slideshow.list);
  const createSlide = useMutation(api.slideshow.create);
  const updateSlide = useMutation(api.slideshow.update);
  const deleteSlide = useMutation(api.slideshow.remove);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Doc<"slideshowSlides"> | null>(null);
  const [formData, setFormData] = useState<SlideFormData>({
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    backgroundColor: "#4c1d95",
    order: 0,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (slide: any) => {
    // null を undefined に変換
    const editableSlide = {
      ...slide,
      imageUrl: slide.imageUrl || undefined,
      linkUrl: slide.linkUrl || undefined
    };
    setEditingSlide(editableSlide);
    setFormData({
      title: editableSlide.title,
      description: editableSlide.description,
      imageUrl: editableSlide.imageUrl || "",
      linkUrl: editableSlide.linkUrl || "",
      backgroundColor: editableSlide.backgroundColor,
      order: editableSlide.order,
      isActive: editableSlide.isActive,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: Id<"slideshowSlides">) => {
    if (confirm("このスライドを削除してもよろしいですか？")) {
      try {
        await deleteSlide({ id });
      } catch (error) {
        console.error("Failed to delete slide:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 空の文字列をundefinedに変換
      const submitData = {
        ...formData,
        imageUrl: formData.imageUrl.trim() || undefined,
        linkUrl: formData.linkUrl.trim() || undefined,
      };

      if (editingSlide) {
        await updateSlide({
          id: editingSlide._id,
          ...submitData,
        });
      } else {
        await createSlide(submitData);
      }
      handleFormClose();
    } catch (error) {
      console.error("Failed to save slide:", error);
      alert("保存に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSlide(null);
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      backgroundColor: "#4c1d95",
      order: 0,
      isActive: true,
    });
  };

  const handleInputChange = (field: keyof SlideFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!slides) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 animate-amano-glow"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-yellow-400 flex items-center space-x-2 amano-text-glow">
            <span>🖼️</span>
            <span>スライドショー管理</span>
          </h2>
          <p className="text-gray-300 text-sm mt-1">
            トップページのスライドショー設定
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105 amano-crystal-border animate-amano-glow"
        >
          ➕ 新しいスライドを追加
        </button>
      </div>

      {/* Slides List */}
      <div className="space-y-4">
        {slides.length > 0 ? (
          slides.map((slide) => (
            <div key={slide._id} className="amano-bg-glass rounded-xl p-6 amano-crystal-border hover:shadow-2xl transition-all duration-300">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Preview */}
                <div className="flex-shrink-0">
                  <div 
                    className="w-32 h-20 rounded-lg flex items-center justify-center text-white font-medium text-sm overflow-hidden"
                    style={{ backgroundColor: slide.backgroundColor }}
                  >
                    {slide.imageUrl ? (
                      <img 
                        src={slide.imageUrl} 
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      "画像なし"
                    )}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      slide.isActive 
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" 
                        : "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
                    }`}>
                      {slide.isActive ? "表示中" : "非表示"}
                    </span>
                    <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      順序: {slide.order}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-200 mb-1">
                    {slide.title}
                  </h3>
                  
                  <p className="text-gray-300 text-sm mb-2">
                    {slide.description}
                  </p>
                  
                  {slide.linkUrl && (
                    <p className="text-blue-400 text-sm">
                      🔗 {slide.linkUrl}
                    </p>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex space-x-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(slide)}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg text-sm hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(slide._id)}
                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm hover:from-pink-500 hover:to-red-500 transition-all duration-300 transform hover:scale-105"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 amano-bg-glass rounded-xl amano-crystal-border">
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-gray-300 text-lg">スライドが登録されていません</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="mt-4 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105"
            >
              最初のスライドを追加
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="amano-bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto amano-crystal-border">
            <div className="sticky top-0 amano-bg-glass border-b border-purple-500 px-8 py-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-200 flex items-center space-x-2 amano-text-glow">
                  <span>{editingSlide ? "✏️" : "➕"}</span>
                  <span>{editingSlide ? "スライドを編集" : "新しいスライドを追加"}</span>
                </h2>
                <button
                  onClick={handleFormClose}
                  className="text-gray-300 hover:text-yellow-400 text-2xl font-bold transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="auth-input-field"
                    placeholder="スライドのタイトル"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    順序 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.order}
                    onChange={(e) => handleInputChange("order", parseInt(e.target.value) || 0)}
                    className="auth-input-field"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  説明 <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                  className="auth-input-field"
                  placeholder="スライドの説明文"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  画像URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                  className="auth-input-field"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  リンクURL
                </label>
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => handleInputChange("linkUrl", e.target.value)}
                  className="auth-input-field"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  背景色
                </label>
                <input
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) => handleInputChange("backgroundColor", e.target.value)}
                  className="auth-input-field h-12"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange("isActive", e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-300">
                  スライドを表示する
                </label>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-purple-500">
                <button
                  type="button"
                  onClick={handleFormClose}
                  className="px-6 py-3 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white font-medium transition-colors"
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
                    <span>{editingSlide ? "更新" : "作成"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
