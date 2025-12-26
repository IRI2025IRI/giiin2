import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function ImageManagement() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images = useQuery(api.imageManagement.listImages);
  const generateUploadUrl = useMutation(api.imageManagement.generateUploadUrl);
  const deleteImage = useMutation(api.imageManagement.deleteImage);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 画像ファイルかチェック
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください');
        return;
      }
      
      // ファイルサイズチェック（10MB制限）
      if (file.size > 10 * 1024 * 1024) {
        alert('ファイルサイズは10MB以下にしてください');
        return;
      }
      
      setSelectedImage(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // アップロードURL取得
      const uploadUrl = await generateUploadUrl();

      // ファイルアップロード
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedImage.type },
        body: selectedImage,
      });

      if (!result.ok) {
        throw new Error(`アップロードに失敗しました: ${result.statusText}`);
      }

      setUploadProgress(100);
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      alert('画像のアップロードが完了しました');
    } catch (error) {
      console.error('アップロードエラー:', error);
      alert('アップロードに失敗しました');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (imageId: Id<"_storage">) => {
    if (!confirm('この画像を削除しますか？')) return;

    try {
      await deleteImage({ imageId });
      alert('画像を削除しました');
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      alert('URLをクリップボードにコピーしました');
    }).catch(() => {
      alert('URLのコピーに失敗しました');
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-yellow-400 amano-text-glow">
          🖼️ 画像管理
        </h2>
      </div>

      {/* アップロードセクション */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h3 className="text-lg font-bold text-yellow-400 mb-4">画像アップロード</h3>
        
        <div className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="auth-input-field"
            />
            <p className="text-sm text-gray-400 mt-2">
              対応形式: JPG, PNG, GIF, WebP など（最大10MB）
            </p>
          </div>

          {selectedImage && (
            <div className="amano-bg-glass p-4 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-300">選択されたファイル:</p>
                  <p className="font-medium text-white">{selectedImage.name}</p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(selectedImage.size)} • {selectedImage.type}
                  </p>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="auth-button px-6 py-2 disabled:opacity-50"
                >
                  {isUploading ? 'アップロード中...' : 'アップロード'}
                </button>
              </div>

              {isUploading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-cyan-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 画像一覧 */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h3 className="text-lg font-bold text-yellow-400 mb-4">
          アップロード済み画像 ({images?.length || 0}件)
        </h3>

        {!images ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            アップロードされた画像がありません
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div key={image._id} className="amano-bg-glass rounded-lg p-4">
                <div className="aspect-video bg-gray-800 rounded-lg mb-3 overflow-hidden">
                  {image.url ? (
                    <img
                      src={image.url}
                      alt="アップロード画像"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      読み込み中...
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-gray-400">
                    ID: {image._id}
                  </div>
                  <div className="text-xs text-gray-400">
                    サイズ: {formatFileSize(image.size)}
                  </div>
                  <div className="text-xs text-gray-400">
                    形式: {image.contentType}
                  </div>
                  <div className="text-xs text-gray-400">
                    作成日: {new Date(image._creationTime).toLocaleString('ja-JP')}
                  </div>

                  {image.url && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-400">URL:</div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={image.url}
                          readOnly
                          className="flex-1 text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-300"
                        />
                        <button
                          onClick={() => copyToClipboard(image.url!)}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                          title="URLをコピー"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2">
                    {image.url && (
                      <a
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
                      >
                        表示
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(image._id)}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
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
    </div>
  );
}
