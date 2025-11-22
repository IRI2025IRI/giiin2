import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { PasswordResetModal } from "./PasswordResetModal";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const requestEmailVerification = useAction(api.emailActions.sendVerificationEmail);

  if (!isOpen) return null;

  if (showPasswordReset) {
    return (
      <PasswordResetModal
        isOpen={true}
        onClose={() => setShowPasswordReset(false)}
      />
    );
  }

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
          
          {flow === "signUp" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm">
                📧 アカウント作成後、メールに送信される認証URLをクリックしてください。
              </p>
            </div>
          )}
          
          <form
            className="flex flex-col space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              const formData = new FormData(e.target as HTMLFormElement);
              const email = formData.get("email") as string;
              const name = formData.get("name") as string;
              
              formData.set("flow", flow);
              
              try {
                await signIn("password", formData);
                
                if (flow === "signUp") {
                  // 新規登録の場合、メール認証を送信
                  try {
                    await requestEmailVerification({
                      email,
                    });
                    toast.success("アカウントを作成しました！認証メールをご確認ください。");
                    onClose();
                  } catch (emailError) {
                    console.error("Email verification error:", emailError);
                    toast.success("アカウントを作成しました。");
                    toast.warning("認証メールの送信に失敗しました。後でお試しください。");
                    onClose();
                  }
                } else {
                  toast.success("ログイン完了");
                  setTimeout(() => {
                    onClose();
                  }, 500);
                }
              } catch (error: any) {
                console.error("Auth error:", error);
                let toastTitle = "";
                
                if (flow === "signUp") {
                  if (error.message.includes("already exists")) {
                    toastTitle = "このメールアドレスは既に登録されています";
                  } else {
                    toastTitle = "アカウント作成に失敗しました";
                  }
                } else {
                  if (error.message.includes("Invalid password")) {
                    toastTitle = "パスワードが正しくありません";
                  } else {
                    toastTitle = "ログインに失敗しました";
                  }
                }
                toast.error(toastTitle);
              } finally {
                setSubmitting(false);
              }
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
            
            {flow === "signIn" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  パスワードを忘れた方はこちら
                </button>
              </div>
            )}
            
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
