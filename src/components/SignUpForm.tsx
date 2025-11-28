import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
  onShowTerms?: () => void;
}

export function SignUpForm({ onSuccess, onSwitchToSignIn, onShowTerms }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState("");
  const [region, setRegion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuthActions();
  const saveDemographics = useMutation(api.userDemographics.create);
  const sendVerificationEmail = useAction(api.emailActions.sendVerificationEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !name || !ageGroup || !gender || !region) {
      toast.error("すべての項目を入力してください");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("パスワードが一致しません");
      return;
    }

    if (password.length < 8) {
      toast.error("パスワードは8文字以上で入力してください");
      return;
    }

    setIsLoading(true);

    try {
      // FormDataを作成してConvex Authに渡す
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("name", name);
      formData.set("flow", "signUp");

      // Convex Authを使用してアカウント作成
      const result = await signIn("password", formData);
      console.log("SignIn result:", result);

      // 少し待ってからユーザー情報を取得し、処理を実行
      await new Promise(resolve => setTimeout(resolve, 1500));

      // アカウント作成成功後、属性情報を保存
      try {
        await saveDemographics({
          ageGroup: ageGroup as any,
          gender: gender as any,
          region: region as any,
        });
      } catch (demoError) {
        console.error("Demographics save error:", demoError);
        // 属性情報の保存に失敗してもアカウント作成は成功とする
      }

      // メール認証を送信
      try {
        await sendVerificationEmail({ email });
        toast.success("アカウントが作成されました！認証メールをご確認ください。");
      } catch (emailError) {
        console.error("Email verification error:", emailError);
        toast.success("アカウントが作成されました。");
        toast.warning("認証メールの送信に失敗しました。後でお試しください。");
      }

      onSuccess?.();
    } catch (error: any) {
      console.error("Sign up error:", error);
      
      // より詳細なエラーメッセージを表示
      if (error.message?.includes("already exists") || error.message?.includes("ACCOUNT_ALREADY_EXISTS")) {
        toast.error("このメールアドレスは既に使用されています");
      } else if (error.message?.includes("Invalid email")) {
        toast.error("メールアドレスの形式が正しくありません");
      } else if (error.message?.includes("Password")) {
        toast.error("パスワードの形式が正しくありません");
      } else if (error.message?.includes("Name")) {
        toast.error("名前の入力に問題があります");
      } else {
        // デバッグ用に詳細なエラーメッセージを表示
        console.error("Detailed error:", error);
        toast.error("アカウント作成中にエラーが発生しました。しばらく時間をおいて再度お試しください。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          新規アカウント作成
        </h2>
        <p className="text-gray-300 mt-2 text-sm">
          GIIIN/ギイーンへようこそ！アカウントを作成して議員活動を見える化しましょう。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 基本情報 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-yellow-400 amano-text-glow border-b border-purple-500 pb-2">
            基本情報
          </h3>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              表示名（ニックネーム等） <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input-field"
              placeholder="例：太郎、たろう、Taro など"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              メールアドレス <span className="text-red-400">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input-field"
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              パスワード <span className="text-red-400">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input-field"
              placeholder="8文字以上で入力"
              required
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              パスワード（確認） <span className="text-red-400">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input-field"
              placeholder="パスワードを再入力"
              required
            />
          </div>
        </div>

        {/* 属性情報 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-yellow-400 amano-text-glow border-b border-purple-500 pb-2">
            属性情報
          </h3>
          <p className="text-xs text-gray-400">
            ※ より良いサービス提供のため、統計情報として活用させていただきます
          </p>

          <div>
            <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-300 mb-2">
              年代 <span className="text-red-400">*</span>
            </label>
            <select
              id="ageGroup"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="auth-input-field"
              required
            >
              <option value="">年代を選択してください</option>
              <option value="10代">10代</option>
              <option value="20代">20代</option>
              <option value="30代">30代</option>
              <option value="40代">40代</option>
              <option value="50代">50代</option>
              <option value="60代">60代</option>
              <option value="70代以上">70代以上</option>
            </select>
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-2">
              性別 <span className="text-red-400">*</span>
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="auth-input-field"
              required
            >
              <option value="">性別を選択してください</option>
              <option value="男性">男性</option>
              <option value="女性">女性</option>
              <option value="その他">その他</option>
              <option value="回答しない">回答しない</option>
            </select>
          </div>

          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-300 mb-2">
              地域 <span className="text-red-400">*</span>
            </label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="auth-input-field"
              required
            >
              <option value="">地域を選択してください</option>
              <option value="三原市民">三原市民</option>
              <option value="その他市民">その他市民</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="auth-button"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>作成中...</span>
            </div>
          ) : (
            "アカウントを作成"
          )}
        </button>
      </form>

      <div className="text-center">
        <p className="text-gray-400 text-sm">
          すでにアカウントをお持ちですか？{" "}
          <button
            onClick={onSwitchToSignIn}
            className="text-cyan-400 hover:text-yellow-400 font-medium underline hover:no-underline transition-colors"
          >
            ログインはこちら
          </button>
        </p>
      </div>

      <div className="text-xs text-gray-500 space-y-2 border-t border-gray-600 pt-4">
        <p>
          アカウント作成により、
          <button
            onClick={() => onShowTerms?.()}
            className="text-cyan-400 hover:text-yellow-400 underline hover:no-underline transition-colors mx-1"
          >
            利用規約
          </button>
          および
          <button
            onClick={() => onShowTerms?.()}
            className="text-cyan-400 hover:text-yellow-400 underline hover:no-underline transition-colors mx-1"
          >
            プライバシーポリシー
          </button>
          に同意したものとみなします。
        </p>
      </div>
    </div>
  );
}
