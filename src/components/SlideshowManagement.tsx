import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

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
  const slides = useQuery(api.slideshow.listAll) || [];
  const createSlide = useMutation(api.slideshow.create);
  const updateSlide = useMutation(api.slideshow.update);
  const deleteSlide = useMutation(api.slideshow.remove);
  const generateUploadUrl = useMutation(api.slideshow.generateUploadUrl);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Id<"slideshowSlides"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<SlideFormData>({
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    backgroundColor: "#1a0b3d",
    order: 1,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // バリデーション
    if (!formData.title.trim()) {
      setSaveMessage("タイトルを入力してください。");
      return;
    }
    if (!formData.description.trim()) {
      setSaveMessage("説明を入力してください。");
      return;
    }

    setIsSubmitting(true);
    setSaveMessage("");
    
    try {
      // データを整形（空文字列をundefinedに変換）
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim() || undefined,
        linkUrl: formData.linkUrl.trim() || undefined,
        backgroundColor: formData.backgroundColor,
        order: formData.order,
        isActive: formData.isActive,
      };

      console.log("送信データ:", submitData);

      if (editingSlide) {
        console.log("更新中:", editingSlide);
        await updateSlide({
          slideId: editingSlide,
          ...submitData,
        });
        setSaveMessage("スライドを更新しました！");
      } else {
        console.log("新規作成中");
        await createSlide(submitData);
        setSaveMessage("スライドを作成しました！");
      }
      
      // 成功時は少し待ってからフォームをリセット
      setTimeout(() => {
        resetForm();
        setSaveMessage("");
      }, 2000);
      
    } catch (error) {
      console.error("スライドの保存に失敗しました:", error);
      const errorMessage = error instanceof Error ? error.message : "保存に失敗しました。もう一度お試しください。";
      setSaveMessage(`エラー: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 画像ファイルかチェック
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください。');
      return;
    }

    // ファイルサイズチェック（5MB制限）
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください。');
      return;
    }

    setUploadingImage(true);
    try {
      // アップロードURLを取得
      const postUrl = await generateUploadUrl();
      
      // ファイルをアップロード
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      const json = await result.json();
      if (!result.ok) {
        throw new Error(`Upload failed: ${JSON.stringify(json)}`);
      }
      
      const { storageId } = json;
      
      // Convex storageのURLを使用
      const imageUrl = `/api/storage/${storageId}`;
      
      setFormData(prev => ({ ...prev, imageUrl }));
      
    } catch (error) {
      console.error("画像のアップロードに失敗しました:", error);
      alert("画像のアップロードに失敗しました。もう一度お試しください。");
    } finally {
      setUploadingImage(false);
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      backgroundColor: "#1a0b3d",
      order: Math.max(1, (slides?.length || 0) + 1), // 自動で次の順序を設定
      isActive: true,
    });
    setEditingSlide(null);
    setIsFormOpen(false);
    setSaveMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (slide: any) => {
    setFormData({
      title: slide.title,
      description: slide.description,
      imageUrl: slide.imageUrl || "",
      linkUrl: slide.linkUrl || "",
      backgroundColor: slide.backgroundColor,
      order: slide.order,
      isActive: slide.isActive,
    });
    setEditingSlide(slide._id);
    setIsFormOpen(true);
    setSaveMessage("");
  };

  const handleDelete = async (slideId: Id<"slideshowSlides">) => {
    if (confirm("このスライドを削除しますか？")) {
      try {
        await deleteSlide({ slideId });
      } catch (error) {
        console.error("スライドの削除に失敗しました:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-yellow-400 amano-text-glow">
          🎭 スライドショー管理
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
      <div className="grid gap-4">
        {slides.map((slide) => (
          <div
            key={slide._id}
            className="amano-bg-card rounded-xl p-6 amano-crystal-border"
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
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-bold text-yellow-400">
                    {slide.title}
                  </h3>
                  <span className="text-sm text-gray-400">順序: {slide.order}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      slide.isActive
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {slide.isActive ? "表示中" : "非表示"}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-2">{slide.description}</p>
                {slide.linkUrl && (
                  <a
                    href={slide.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-yellow-400 text-sm transition-colors"
                  >
                    リンク先を確認 ↗
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

      {/* フォームモーダル */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="amano-bg-card rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto amano-crystal-border">
            <h3 className="text-xl font-bold text-yellow-400 mb-6 amano-text-glow">
              {editingSlide ? "スライド編集" : "新規スライド作成"}
            </h3>

            {/* 保存メッセージ */}
            {saveMessage && (
              <div className={`mb-4 p-3 rounded-lg ${
                saveMessage.includes("失敗") || saveMessage.includes("入力")
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-green-500/20 text-green-400 border border-green-500/30"
              }`}>
                {saveMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  タイトル *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="auth-input-field h-24 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  画像URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  className="auth-input-field"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  または画像をアップロード
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingImage ? "アップロード中..." : "画像を選択"}
                  </button>
                  <span className="text-sm text-gray-400">
                    JPG, PNG, GIF (最大5MB)
                  </span>
                </div>
                {formData.imageUrl && (
                  <div className="mt-3">
                    <img
                      src={formData.imageUrl}
                      alt="プレビュー"
                      className="w-32 h-20 object-cover rounded-lg border border-purple-500/30"
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
                  onChange={(e) =>
                    setFormData({ ...formData, linkUrl: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, backgroundColor: e.target.value })
                  }
                  className="w-full h-12 rounded-lg border-2 border-purple-500/30 bg-transparent cursor-pointer"
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
                    onChange={(e) =>
                      setFormData({ ...formData, order: parseInt(e.target.value) })
                    }
                    className="auth-input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    表示状態
                  </label>
                  <select
                    value={formData.isActive ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.value === "true" })
                    }
                    className="auth-input-field"
                  >
                    <option value="true">表示</option>
                    <option value="false">非表示</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || uploadingImage}
                  className="flex-1 auth-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "保存中..." : editingSlide ? "更新" : "作成"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-500/10 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
