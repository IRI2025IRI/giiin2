import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PasswordResetModal({ isOpen, onClose }: PasswordResetModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);

  const requestPasswordReset = useAction(api.emailActions.sendPasswordResetEmail);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await requestPasswordReset({ email });
      setIsEmailSent(true);
      toast.success("パスワードリセット用のメールを送信しました");
    } catch (err) {
      setError("パスワードリセットの要求に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">メール送信完了</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="text-center">
              <div className="text-6xl mb-4">📧</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                パスワードリセット用のメールを送信しました
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                {email} にパスワードリセット用のリンクを送信しました。<br />
                メール内のリンクをクリックして、新しいパスワードを設定してください。
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  📧 メールが届かない場合は、迷惑メールフォルダもご確認ください。<br />
                  リンクは1時間有効です。
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">パスワード再設定</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 text-sm mb-4">
              登録されているメールアドレスを入力してください。
              パスワード再設定用のリンクをお送りします。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input-field"
                placeholder="your-email@example.com"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="auth-button"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>送信中...</span>
                </div>
              ) : (
                "リセット用リンクを送信"
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              ログイン画面に戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
