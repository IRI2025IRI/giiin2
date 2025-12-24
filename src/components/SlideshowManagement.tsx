import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface SlideFormData {
  title: string;
  description: string;
  linkUrl: string;
  backgroundColor: string;
  order: number;
  isActive: boolean;
}

export function SlideshowManagement() {
  const slides = useQuery(api.slideshow.listAll) || [];
  const createSlide = useMutation(api.slideshow.create);
  const updateSlide = useMutation(api.slideshow.update);
  const deleteSlide = useMutation(api.slideshow.remove);
  const generateUploadUrl = useMutation(api.slideshow.generateUploadUrl);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Id<"slideshowSlides"> | null>(null);
  const [formData, setFormData] = useState<SlideFormData>({
    title: "",
    description: "",
    linkUrl: "",
    backgroundColor: "#4c1d95",
    order: 1,
    isActive: true,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // プレビュー用のURLを作成
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      linkUrl: "",
      backgroundColor: "#4c1d95",
      order: 1,
      isActive: true,
    });
    setSelectedImage(null);
    setImagePreview(null);
    setEditingSlide(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEdit = (slide: any) => {
    setEditingSlide(slide._id);
    setFormData({
      title: slide.title,
      description: slide.description,
      linkUrl: slide.linkUrl || "",
      backgroundColor: slide.backgroundColor,
      order: slide.order,
      isActive: slide.isActive,
    });
    setImagePreview(slide.imageUrl || null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageId: Id<"_storage"> | undefined;

      // 新しい画像がアップロードされた場合
      if (selectedImage) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedImage.type },
          body: selectedImage,
        });
        
        if (!result.ok) {
          const errorText = await result.text();
          throw new Error(`Upload failed: ${result.status} ${errorText}`);
        }
        
        const json = await result.json();
        imageId = json.storageId;
      }

      if (editingSlide) {
        await updateSlide({
          slideId: editingSlide,
          ...formData,
          ...(imageId && { imageId }),
        });
      } else {
        await createSlide({
          ...formData,
          ...(imageId && { imageId }),
        });
      }

      resetForm();
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error saving slide:", error);
      alert(`スライドの保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (slideId: Id<"slideshowSlides">) => {
    if (confirm("このスライドを削除しますか？")) {
      try {
        await deleteSlide({ slideId });
      } catch (error) {
        console.error("Error deleting slide:", error);
        alert("スライドの削除に失敗しました");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-yellow-400 amano-text-glow">
          🎬 スライドショー管理
        </h2>
        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
        >
          新規スライド作成
        </button>
      </div>

      {/* スライド一覧 */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h3 className="text-lg font-bold text-yellow-400 mb-4">現在のスライド</h3>
        {slides.length === 0 ? (
          <p className="text-gray-400 text-center py-8">スライドがありません</p>
        ) : (
          <div className="space-y-4">
            {slides.map((slide) => (
              <div
                key={slide._id}
                className="amano-bg-glass p-4 rounded-lg border border-purple-500/20"
              >
                <div className="flex items-start space-x-4">
                  {slide.imageUrl && (
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="w-24 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-bold text-white">{slide.title}</h4>
                      <span className="text-sm text-gray-400">#{slide.order}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          slide.isActive
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {slide.isActive ? "有効" : "無効"}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{slide.description}</p>
                    {slide.linkUrl && (
                      <a
                        href={slide.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-yellow-400 text-sm"
                      >
                        {slide.linkUrl}
                      </a>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(slide)}
                      className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(slide._id)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* フォームモーダル */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="amano-bg-card rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto amano-crystal-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-yellow-400">
                {editingSlide ? "スライド編集" : "新規スライド作成"}
              </h3>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  タイトル *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="auth-input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  説明 *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="auth-input-field h-24 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  画像
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="auth-input-field"
                />
                {imagePreview && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-400 mb-2">プレビュー:</p>
                    <img
                      src={imagePreview}
                      alt="プレビュー"
                      className="w-full max-w-md h-32 object-cover rounded-lg border border-purple-500/30"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  リンクURL
                </label>
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                  className="w-full h-12 rounded-lg border border-purple-500/30 bg-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    表示順序
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    className="auth-input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    状態
                  </label>
                  <select
                    value={formData.isActive ? "active" : "inactive"}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "active" })}
                    className="auth-input-field"
                  >
                    <option value="active">有効</option>
                    <option value="inactive">無効</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 auth-button disabled:opacity-50"
                >
                  {isSubmitting ? "保存中..." : editingSlide ? "更新" : "作成"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
