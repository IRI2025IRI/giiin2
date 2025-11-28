import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export function EmailVerificationModal({ isOpen, onClose, userEmail }: EmailVerificationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const resendVerificationEmail = useAction(api.emailActions.resendVerificationEmail);
  const emailStatus = useQuery(api.emailAuth.getEmailVerificationStatus);

  if (!isOpen) return null;

  const handleResendEmail = async () => {
    setIsLoading(true);
    try {
      await resendVerificationEmail();
      toast.success("認証メールを再送信しました");
    } catch (error) {
      console.error("Resend email error:", error);
      toast.error("メール送信に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="amano-bg-card rounded-xl shadow-2xl max-w-md w-full amano-crystal-border">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">メール認証が必要です</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-yellow-400 text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>

          <div className="text-center">
            <div className="text-6xl mb-4">📧</div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-4 amano-text-glow">
              アカウントの有効化が必要です
            </h3>
            <p className="text-gray-300 text-sm mb-6">
              {userEmail || "ご登録のメールアドレス"} に送信された認証メールを確認し、
              <br />
              メール内のリンクをクリックしてアカウントを有効化してください。
            </p>
            
            <div className="amano-bg-glass border border-yellow-400 rounded-lg p-4 mb-6 amano-crystal-border">
              <p className="text-yellow-300 text-sm amano-text-glow">
                ⚠️ メール認証が完了するまで、一部の機能がご利用いただけません。<br />
                メールが届かない場合は、迷惑メールフォルダもご確認ください。
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={isLoading}
                className="w-full auth-button"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>送信中...</span>
                  </div>
                ) : (
                  "認証メールを再送信"
                )}
              </button>
              
              <button
                onClick={onClose}
                className="w-full amano-bg-glass text-gray-300 py-3 rounded-lg font-medium hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 hover:text-white transition-all duration-300 amano-crystal-border"
              >
                後で認証する
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
