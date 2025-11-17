import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface SlideFormData {
  title: string;
  description: string;
  imageFile: File | null;
  linkUrl: string;
  backgroundColor: string;
  order: number;
  isActive: boolean;
}

export function SlideshowManagement() {
  const slides = useQuery(api.slideshow.list) || [];
  const createSlide = useMutation(api.slideshow.create);
  const updateSlide = useMutation(api.slideshow.update);
  const deleteSlide = useMutation(api.slideshow.remove);
  const generateUploadUrl = useMutation(api.slideshow.generateUploadUrl);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Id<"slideshowSlides"> | null>(null);
  const [formData, setFormData] = useState<SlideFormData>({
    title: "",
    description: "",
    imageFile: null,
    linkUrl: "",
    backgroundColor: "transparent",
    order: 1,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const backgroundColors = [
    { value: "transparent", label: "なし", preview: "transparent" },
    { value: "#ffffff", label: "白", preview: "#ffffff" },
    { value: "#f3f4f6", label: "グレー", preview: "#f3f4f6" },
    { value: "#dbeafe", label: "青", preview: "#dbeafe" },
    { value: "#dcfce7", label: "緑", preview: "#dcfce7" },
    { value: "#fef3c7", label: "黄", preview: "#fef3c7" },
    { value: "#fecaca", label: "赤", preview: "#fecaca" },
    { value: "#e9d5ff", label: "紫", preview: "#e9d5ff" },
    { value: "#fed7aa", label: "オレンジ", preview: "#fed7aa" },
  ];

  useEffect(() => {
    if (editingSlide) {
      const slide = slides.find(s => s._id === editingSlide);
      if (slide) {
        setFormData({
          title: slide.title,
          description: slide.description,
          imageFile: null,
          linkUrl: slide.linkUrl || "",
          backgroundColor: slide.backgroundColor,
          order: slide.order,
          isActive: slide.isActive,
        });
      }
    }
  }, [editingSlide, slides]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      imageFile: null,
      linkUrl: "",
      backgroundColor: "transparent",
      order: Math.max(...slides.map(s => s.order), 0) + 1,
      isActive: true,
    });
    setEditingSlide(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    setIsSubmitting(true);
    try {
      let imageId: Id<"_storage"> | undefined;

      if (formData.imageFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": formData.imageFile.type },
          body: formData.imageFile,
        });
        const json = await result.json();
        if (!result.ok) {
          throw new Error(`Upload failed: ${JSON.stringify(json)}`);
        }
        imageId = json.storageId;
      }

      if (editingSlide) {
        await updateSlide({
          id: editingSlide,
          title: formData.title.trim(),
          description: formData.description.trim(),
          linkUrl: formData.linkUrl.trim() || undefined,
          backgroundColor: formData.backgroundColor,
          order: formData.order,
          isActive: formData.isActive,
          ...(imageId && { imageId }),
        });
      } else {
        await createSlide({
          title: formData.title.trim(),
          description: formData.description.trim(),
          linkUrl: formData.linkUrl.trim() || undefined,
          backgroundColor: formData.backgroundColor,
          order: formData.order,
          isActive: formData.isActive,
          imageId,
        });
      }

      resetForm();
    } catch (error) {
      console.error("Failed to save slide:", error);
      alert("スライドの保存に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"slideshowSlides">) => {
    if (!confirm("このスライドを削除しますか？")) return;
    
    try {
      await deleteSlide({ id });
    } catch (error) {
      console.error("Failed to delete slide:", error);
      alert("スライドの削除に失敗しました");
    }
  };

  const handleEdit = (id: Id<"slideshowSlides">) => {
    setEditingSlide(id);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">スライドショー管理</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          新規スライド追加
        </button>
      </div>

      {/* スライド一覧 */}
      <div className="grid gap-4">
        {slides.map((slide) => (
          <div key={slide._id} className="bg-white rounded-lg shadow-md p-4 border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-lg">{slide.title}</h3>
                  <span className="text-sm text-gray-500">順序: {slide.order}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    slide.isActive 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {slide.isActive ? "表示中" : "非表示"}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">{slide.description}</p>
                {slide.linkUrl && (
                  <p className="text-blue-600 text-sm mb-2">
                    リンク: {slide.linkUrl}
                  </p>
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">背景色:</span>
                  <div 
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ 
                      backgroundColor: slide.backgroundColor === "transparent" ? "transparent" : slide.backgroundColor,
                      backgroundImage: slide.backgroundColor === "transparent" ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)" : "none",
                      backgroundSize: slide.backgroundColor === "transparent" ? "10px 10px" : "auto",
                      backgroundPosition: slide.backgroundColor === "transparent" ? "0 0, 0 5px, 5px -5px, -5px 0px" : "auto"
                    }}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {backgroundColors.find(c => c.value === slide.backgroundColor)?.label || slide.backgroundColor}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {slide.imageUrl && (
                  <img 
                    src={slide.imageUrl} 
                    alt={slide.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => handleEdit(slide._id)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(slide._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* フォームモーダル */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingSlide ? "スライド編集" : "新規スライド追加"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明 *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  画像
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, imageFile: e.target.files?.[0] || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  リンクURL
                </label>
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  背景色
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {backgroundColors.map((color) => (
                    <label
                      key={color.value}
                      className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        formData.backgroundColor === color.value ? "border-blue-500 bg-blue-50" : "border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="backgroundColor"
                        value={color.value}
                        checked={formData.backgroundColor === color.value}
                        onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                        className="sr-only"
                      />
                      <div 
                        className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
                        style={{ 
                          backgroundColor: color.preview === "transparent" ? "transparent" : color.preview,
                          backgroundImage: color.preview === "transparent" ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)" : "none",
                          backgroundSize: color.preview === "transparent" ? "8px 8px" : "auto",
                          backgroundPosition: color.preview === "transparent" ? "0 0, 0 4px, 4px -4px, -4px 0px" : "auto"
                        }}
                      ></div>
                      <span className="text-sm">{color.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    表示順序
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    表示状態
                  </label>
                  <select
                    value={formData.isActive ? "true" : "false"}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "true" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">表示</option>
                    <option value="false">非表示</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
