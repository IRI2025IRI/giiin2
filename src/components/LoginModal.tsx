import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              {flow === "signIn" ? "ログイン" : "新規登録"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          <form
            className="flex flex-col space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitting(true);
              const formData = new FormData(e.target as HTMLFormElement);
              formData.set("flow", flow);
              void signIn("password", formData)
                .then(() => {
                  toast.success(flow === "signIn" ? "ログイン完了" : "アカウントを作成しました");
                  setSubmitting(false);
                  // ユーザー状態の更新を待つために少し遅延
                  setTimeout(() => {
                    onClose();
                  }, 500);
                })
                .catch((error) => {
                  let toastTitle = "";
                  if (error.message.includes("Invalid password")) {
                    toastTitle = "パスワードが正しくありません";
                  } else {
                    toastTitle =
                      flow === "signIn"
                        ? "ログインできませんでした。新規登録が必要ですか？"
                        : "アカウント作成できませんでした。既にアカウントをお持ちですか？";
                  }
                  toast.error(toastTitle);
                  setSubmitting(false);
                });
            }}
          >
            {flow === "signUp" && (
              <input
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                type="text"
                name="name"
                placeholder="お名前"
                required
              />
            )}
            <input
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
              type="email"
              name="email"
              placeholder="メールアドレス"
              required
            />
            <input
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
              type="password"
              name="password"
              placeholder="パスワード"
              required
            />
            <button 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" 
              type="submit" 
              disabled={submitting}
            >
              {submitting ? "処理中..." : (flow === "signIn" ? "ログイン" : "新規登録")}
            </button>
            <div className="text-center text-sm text-gray-600">
              <span>
                {flow === "signIn"
                  ? "アカウントをお持ちでない方は "
                  : "既にアカウントをお持ちの方は "}
              </span>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
              >
                {flow === "signIn" ? "新規登録" : "ログイン"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
