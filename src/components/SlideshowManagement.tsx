import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";

export function SlideshowManagement() {
  const slides = useQuery(api.slideshow.list);
  const createSlide = useMutation(api.slideshow.create);
  const updateSlide = useMutation(api.slideshow.update);
  const deleteSlide = useMutation(api.slideshow.remove);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    backgroundColor: "#1a1a2e",
    isTransparent: false,
    isActive: true,
    order: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (slide: any) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      description: slide.description || "",
      imageUrl: slide.imageUrl || "",
      linkUrl: slide.linkUrl || "",
      backgroundColor: slide.backgroundColor || "#1a1a2e",
      isTransparent: slide.backgroundColor === "transparent",
      isActive: slide.isActive,
      order: slide.order,
    });
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingSlide(null);
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      backgroundColor: "#1a1a2e",
      isTransparent: false,
      isActive: true,
      order: (slides?.length || 0) + 1,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      const slideData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim() || undefined,
        linkUrl: formData.linkUrl.trim() || undefined,
        backgroundColor: formData.isTransparent ? "transparent" : formData.backgroundColor,
        isActive: formData.isActive,
        order: formData.order,
      };

      if (editingSlide) {
        await updateSlide({
          id: editingSlide._id,
          ...slideData,
        });
      } else {
        await createSlide(slideData);
      }
      
      setIsFormOpen(false);
      setEditingSlide(null);
    } catch (error) {
      console.error("Error saving slide:", error);
      alert("保存に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"slideshowSlides">) => {
    if (confirm("このスライドを削除してもよろしいですか？")) {
      try {
        await deleteSlide({ id });
      } catch (error) {
        console.error("Error deleting slide:", error);
        alert("削除に失敗しました。");
      }
    }
  };

  const backgroundColorOptions = [
    { value: "#1a1a2e", label: "ダークブルー", preview: "#1a1a2e" },
    { value: "#2d1b69", label: "パープル", preview: "#2d1b69" },
    { value: "#0f3460", label: "ネイビー", preview: "#0f3460" },
    { value: "#16213e", label: "ミッドナイト", preview: "#16213e" },
    { value: "#1e3a8a", label: "ブルー", preview: "#1e3a8a" },
    { value: "#7c3aed", label: "バイオレット", preview: "#7c3aed" },
    { value: "#059669", label: "エメラルド", preview: "#059669" },
    { value: "#dc2626", label: "レッド", preview: "#dc2626" },
    { value: "#ea580c", label: "オレンジ", preview: "#ea580c" },
    { value: "#000000", label: "ブラック", preview: "#000000" },
  ];

  if (!slides) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 amano-text-glow">
            🎬 スライドショー管理
          </h2>
          <p className="text-gray-300 text-sm mt-1">
            トップページのスライドショーを管理
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="auth-button px-6 py-3"
        >
          ➕ 新しいスライドを追加
        </button>
      </div>

      {/* Slides List */}
      <div className="space-y-4">
        {slides.length > 0 ? (
          slides.map((slide, index) => (
            <div key={slide._id} className="amano-bg-glass rounded-lg p-4 border border-gray-500/30 hover:border-yellow-400/50 transition-all duration-300">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-sm text-gray-400">順序: {slide.order}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      slide.isActive 
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" 
                        : "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
                    }`}>
                      {slide.isActive ? "表示中" : "非表示"}
                    </span>
                    {slide.backgroundColor && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">背景:</span>
                        {slide.backgroundColor === "transparent" ? (
                          <span className="text-xs text-gray-400">透明</span>
                        ) : (
                          <div 
                            className="w-4 h-4 rounded border border-gray-400"
                            style={{ backgroundColor: slide.backgroundColor }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-200 mb-2">
                    {slide.title}
                  </h3>
                  
                  {slide.description && (
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                      {slide.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    {slide.imageUrl && (
                      <span className="flex items-center text-purple-400">
                        🖼️ 画像あり
                      </span>
                    )}
                    {slide.linkUrl && (
                      <span className="flex items-center text-blue-400">
                        🔗 リンクあり
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(slide)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(slide._id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 amano-bg-card rounded-xl p-6 shadow-2xl border border-purple-500/30">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-gray-300 text-lg mb-4">
              スライドが登録されていません
            </p>
            <button
              onClick={handleCreate}
              className="auth-button px-6 py-3"
            >
              最初のスライドを追加
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="amano-bg-card rounded-xl p-6 shadow-2xl border border-purple-500/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-yellow-400 amano-text-glow">
                  {editingSlide ? "スライドを編集" : "新しいスライドを作成"}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-gray-400 hover:text-yellow-400 transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                    タイトル <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="auth-input-field"
                    placeholder="スライドのタイトル"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                    説明
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="auth-input-field resize-vertical"
                    placeholder="スライドの説明文"
                  />
                </div>

                <div>
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-300 mb-2">
                    画像URL
                  </label>
                  <input
                    type="url"
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="auth-input-field"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-300 mb-2">
                    リンクURL
                  </label>
                  <input
                    type="url"
                    id="linkUrl"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
                    className="auth-input-field"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    背景色
                  </label>
                  
                  {/* 透明チェックボックス */}
                  <div className="mb-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isTransparent}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          isTransparent: e.target.checked,
                          backgroundColor: e.target.checked ? "transparent" : "#1a1a2e"
                        }))}
                        className="w-4 h-4 text-yellow-400 border-purple-500 rounded focus:ring-yellow-400 bg-transparent"
                      />
                      <span className="text-sm text-gray-300">透明にする</span>
                    </label>
                  </div>

                  {/* 色選択（透明でない場合のみ表示） */}
                  {!formData.isTransparent && (
                    <div className="grid grid-cols-5 gap-2">
                      {backgroundColorOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, backgroundColor: option.value }))}
                          className={`relative w-12 h-12 rounded-lg border-2 transition-all ${
                            formData.backgroundColor === option.value
                              ? "border-yellow-400 scale-110"
                              : "border-gray-500 hover:border-gray-400"
                          }`}
                          style={{ backgroundColor: option.preview }}
                          title={option.label}
                        >
                          {formData.backgroundColor === option.value && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-white text-lg">✓</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* カスタムカラー入力 */}
                  {!formData.isTransparent && (
                    <div className="mt-4">
                      <label className="block text-xs text-gray-400 mb-1">
                        カスタムカラー
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={formData.backgroundColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                          className="w-12 h-8 rounded border border-gray-500 bg-transparent"
                        />
                        <input
                          type="text"
                          value={formData.backgroundColor}
                          onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                          className="auth-input-field text-sm"
                          placeholder="#1a1a2e"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="order" className="block text-sm font-medium text-gray-300 mb-2">
                    表示順序
                  </label>
                  <input
                    type="number"
                    id="order"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    className="auth-input-field"
                    min="1"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-yellow-400 border-purple-500 rounded focus:ring-yellow-400 bg-transparent"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-300">
                    スライドを表示する
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-purple-500/30">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-6 py-3 border border-gray-500 text-gray-300 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    disabled={isSubmitting}
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.title.trim()}
                    className="auth-button px-8 py-3"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>保存中...</span>
                      </div>
                    ) : (
                      editingSlide ? "更新" : "作成"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
