import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { PasswordResetModal } from "./PasswordResetModal";
import { SignUpForm } from "./SignUpForm";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowTerms?: () => void;
}

export function LoginModal({ isOpen, onClose, onShowTerms }: LoginModalProps) {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

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
      <div className="amano-bg-card rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto amano-crystal-border">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
              {flow === "signIn" ? "ログイン" : "新規登録"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-yellow-400 text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
          
          {flow === "signUp" ? (
            <SignUpForm 
              onSuccess={onClose}
              onSwitchToSignIn={() => setFlow("signIn")}
              onShowTerms={onShowTerms}
            />
          ) : (
            <form
              className="flex flex-col space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmitting(true);
                const formData = new FormData(e.target as HTMLFormElement);
                
                formData.set("flow", flow);
                
                try {
                  await signIn("password", formData);
                  toast.success("ログイン完了");
                  setTimeout(() => {
                    onClose();
                  }, 500);
                } catch (error: any) {
                  console.error("Auth error:", error);
                  let toastTitle = "";
                  
                  if (error.message.includes("Invalid password")) {
                    toastTitle = "パスワードが正しくありません";
                  } else {
                    toastTitle = "ログインに失敗しました";
                  }
                  toast.error(toastTitle);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <input
                className="auth-input-field"
                type="email"
                name="email"
                placeholder="メールアドレス"
                required
              />
              <input
                className="auth-input-field"
                type="password"
                name="password"
                placeholder="パスワード"
                required
              />
              <button 
                className="auth-button" 
                type="submit" 
                disabled={submitting}
              >
                {submitting ? "処理中..." : "ログイン"}
              </button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-cyan-400 hover:text-yellow-400 text-sm font-medium transition-colors"
                >
                  パスワードを忘れた方はこちら
                </button>
              </div>
              
              <div className="text-center text-sm text-gray-300">
                <span>アカウントをお持ちでない方は </span>
                <button
                  type="button"
                  className="text-cyan-400 hover:text-yellow-400 hover:underline font-medium cursor-pointer transition-colors"
                  onClick={() => setFlow("signUp")}
                >
                  新規登録
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
