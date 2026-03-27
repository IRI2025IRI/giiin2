import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface NewsFormProps {
  news?: any;
  onClose: () => void;
}

// タイムスタンプ → datetime-local 入力値 (YYYY-MM-DDTHH:MM)
function toDatetimeLocal(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// datetime-local 入力値 → タイムスタンプ
function fromDatetimeLocal(value: string): number {
  return new Date(value).getTime();
}

type PublishMode = "immediate" | "scheduled" | "draft";

function getInitialMode(news: any): PublishMode {
  if (!news) return "immediate";
  if (!news.isPublished) return "draft";
  if (news.scheduledPublishDate && news.scheduledPublishDate > Date.now()) return "scheduled";
  return "immediate";
}

export function NewsForm({ news, onClose }: NewsFormProps) {
  const [title, setTitle] = useState(news?.title || "");
  const [content, setContent] = useState(news?.content || "");
  const [category, setCategory] = useState(news?.category || "重要なお知らせ");
  const [publishMode, setPublishMode] = useState<PublishMode>(getInitialMode(news));
  const [scheduledDatetime, setScheduledDatetime] = useState<string>(
    news?.scheduledPublishDate
      ? toDatetimeLocal(news.scheduledPublishDate)
      : toDatetimeLocal(Date.now() + 60 * 60 * 1000) // デフォルト1時間後
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(news?.thumbnailUrl || "");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createNews = useMutation(api.news.create);
  const updateNews = useMutation(api.news.update);
  const deleteNews = useMutation(api.news.remove);
  const generateUploadUrl = useMutation(api.news.generateThumbnailUploadUrl);

  const categories = [
    "重要なお知らせ",
    "システム更新",
    "イベント情報",
    "メンテナンス",
    "その他",
  ];

  const handleThumbnailUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("アップロードに失敗しました");
      const { storageId } = await result.json();
      return storageId;
    } catch (error) {
      console.error("Thumbnail upload error:", error);
      alert("画像のアップロードに失敗しました");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (publishMode === "scheduled") {
      const ts = fromDatetimeLocal(scheduledDatetime);
      if (isNaN(ts) || ts <= Date.now()) {
        alert("予約日時は現在より未来の日時を指定してください。");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let thumbnailId = news?.thumbnailId || null;
      if (thumbnailFile) {
        thumbnailId = await handleThumbnailUpload(thumbnailFile);
        if (!thumbnailId) {
          setIsSubmitting(false);
          return;
        }
      }

      const isPublished = publishMode !== "draft";
      const scheduledPublishDate =
        publishMode === "scheduled"
          ? fromDatetimeLocal(scheduledDatetime)
          : undefined;

      const newsData = {
        title: title.trim(),
        content: content.trim(),
        category,
        isPublished,
        scheduledPublishDate,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        thumbnailId: thumbnailId || undefined,
      };

      if (news) {
        await updateNews({ id: news._id, ...newsData });
      } else {
        await createNews({ ...newsData, publishDate: Date.now() });
      }
      onClose();
    } catch (error) {
      console.error("Error saving news:", error);
      alert("保存に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!news) return;
    if (confirm("このお知らせを削除してもよろしいですか？")) {
      setIsSubmitting(true);
      try {
        await deleteNews({ id: news._id });
        onClose();
      } catch (error) {
        console.error("Error deleting news:", error);
        alert("削除に失敗しました。もう一度お試しください。");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("ファイルサイズは5MB以下にしてください");
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("画像ファイルを選択してください");
        return;
      }
      setThumbnailFile(file);
      setThumbnailUrl("");
    }
  };

  const clearThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="amano-bg-card rounded-xl p-6 shadow-2xl border border-purple-500/30 amano-crystal-border max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* ヘッダー */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-yellow-400 amano-text-glow">
                {news ? "お知らせを編集" : "新しいお知らせを作成"}
              </h1>
              <p className="text-gray-300 mt-2">
                {news ? "お知らせの内容を編集できます" : "新しいお知らせを投稿します"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-yellow-400 transition-colors text-2xl"
            >
              ✕
            </button>
          </div>

          {/* フォーム */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              {/* タイトル */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                  タイトル <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="auth-input-field"
                  placeholder="お知らせのタイトルを入力してください"
                  required
                />
              </div>

              {/* カテゴリ */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                  カテゴリ <span className="text-red-400">*</span>
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="auth-input-field"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* サムネイル画像 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  サムネイル画像
                </label>

                {(news?.thumbnailUrl || thumbnailUrl || thumbnailFile) && (
                  <div className="mb-4">
                    <div className="relative inline-block">
                      {thumbnailFile ? (
                        <img
                          src={URL.createObjectURL(thumbnailFile)}
                          alt="サムネイルプレビュー"
                          className="w-48 h-32 object-cover rounded-lg border border-purple-500/30"
                        />
                      ) : (
                        <img
                          src={news?.thumbnailUrl || thumbnailUrl}
                          alt="現在のサムネイル"
                          className="w-48 h-32 object-cover rounded-lg border border-purple-500/30"
                        />
                      )}
                      <button
                        type="button"
                        onClick={clearThumbnail}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      画像ファイルをアップロード（推奨: 横長、5MB以下）
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="auth-input-field"
                      disabled={isUploading}
                    />
                  </div>

                  <div className="text-center text-gray-500">または</div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      画像URLを入力
                    </label>
                    <input
                      type="url"
                      value={thumbnailUrl}
                      onChange={(e) => {
                        setThumbnailUrl(e.target.value);
                        setThumbnailFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="auth-input-field"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
              </div>

              {/* 内容 */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
                  内容 <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="auth-input-field resize-vertical"
                  placeholder="お知らせの内容を入力してください&#10;&#10;改行やマークダウン記法も使用できます。"
                  required
                />
                <p className="text-sm text-gray-400 mt-2">
                  現在の文字数: {content.length}文字
                </p>
              </div>

              {/* 公開設定 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  公開設定 <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 即時公開 */}
                  <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    publishMode === "immediate"
                      ? "border-green-500/70 bg-green-500/10"
                      : "border-gray-500/30 hover:border-gray-400/50"
                  }`}>
                    <input
                      type="radio"
                      name="publishMode"
                      value="immediate"
                      checked={publishMode === "immediate"}
                      onChange={() => setPublishMode("immediate")}
                      className="accent-green-400"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-200">即時公開</div>
                      <div className="text-xs text-gray-400">保存後すぐに公開</div>
                    </div>
                  </label>

                  {/* 予約投稿 */}
                  <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    publishMode === "scheduled"
                      ? "border-yellow-500/70 bg-yellow-500/10"
                      : "border-gray-500/30 hover:border-gray-400/50"
                  }`}>
                    <input
                      type="radio"
                      name="publishMode"
                      value="scheduled"
                      checked={publishMode === "scheduled"}
                      onChange={() => setPublishMode("scheduled")}
                      className="accent-yellow-400"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-200">予約投稿</div>
                      <div className="text-xs text-gray-400">指定日時に自動公開</div>
                    </div>
                  </label>

                  {/* 下書き */}
                  <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    publishMode === "draft"
                      ? "border-gray-400/70 bg-gray-400/10"
                      : "border-gray-500/30 hover:border-gray-400/50"
                  }`}>
                    <input
                      type="radio"
                      name="publishMode"
                      value="draft"
                      checked={publishMode === "draft"}
                      onChange={() => setPublishMode("draft")}
                      className="accent-gray-400"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-200">下書き</div>
                      <div className="text-xs text-gray-400">非公開で保存</div>
                    </div>
                  </label>
                </div>

                {/* 予約日時入力 */}
                {publishMode === "scheduled" && (
                  <div className="mt-4">
                    <label htmlFor="scheduledDatetime" className="block text-sm font-medium text-gray-300 mb-2">
                      公開日時 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="scheduledDatetime"
                      value={scheduledDatetime}
                      onChange={(e) => setScheduledDatetime(e.target.value)}
                      className="auth-input-field"
                      required
                    />
                    <p className="text-xs text-yellow-300 mt-2">
                      ⏰ 指定した日時になると自動的に公開されます。
                    </p>
                  </div>
                )}

                {publishMode === "draft" && (
                  <div className="mt-3 amano-bg-glass border border-gray-500/30 rounded-lg p-3">
                    <p className="text-sm text-gray-400">
                      💾 下書きとして保存されます。公開されません。
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 pt-6 border-t border-purple-500/30">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-500 text-gray-300 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  disabled={isSubmitting || isUploading}
                >
                  キャンセル
                </button>
                {news && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    disabled={isSubmitting || isUploading}
                  >
                    削除
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isUploading || !title.trim() || !content.trim()}
                className="auth-button px-8 py-3"
              >
                {isSubmitting || isUploading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isUploading ? "アップロード中..." : "保存中..."}</span>
                  </div>
                ) : (
                  news ? "更新" : "投稿"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
