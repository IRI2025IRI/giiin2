import { useState } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
}

export function SignUpForm({ onSuccess, onSwitchToSignIn }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState("");
  const [region, setRegion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: 基本情報, 2: 属性情報

  const signIn = useAction(api.auth.signIn);
  const saveDemographics = useMutation(api.userDemographics.saveDemographics);
  const checkAvailability = useQuery(
    api.auth.checkSignUpAvailability,
    email ? { email } : "skip"
  );

  const handleBasicInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError("すべての項目を入力してください");
      return;
    }

    // メールアドレスの可用性をチェック
    if (checkAvailability && !checkAvailability.available) {
      if (checkAvailability.reason === "auth_account_exists") {
        setError("このメールアドレスは認証システムに残っています。管理者にクリーンアップを依頼してください。");
      } else {
        setError("このメールアドレスは既に使用されています");
      }
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await signIn({ 
        provider: "password", 
        params: { email, password, name, flow: "signUp" }
      });
      setStep(2); // 属性情報入力ステップに進む
    } catch (err) {
      console.error("Sign up error:", err);
      let errorMessage = "アカウント作成に失敗しました";
      
      if (err instanceof Error) {
        if (err.message.includes("already exists") || err.message.includes("既に")) {
          errorMessage = "このメールアドレスは既に使用されています。管理者にお問い合わせください。";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemographicsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ageGroup || !gender || !region) {
      setError("すべての項目を選択してください");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await saveDemographics({
        ageGroup: ageGroup as any,
        gender: gender as any,
        region: region as any,
      });
      onSuccess?.();
    } catch (err) {
      console.error("Demographics save error:", err);
      setError(err instanceof Error ? err.message : "属性情報の保存に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
            新規アカウント作成
          </h2>
          <p className="text-gray-300 mt-2 text-sm">
            ステップ 1/2: 基本情報を入力してください
          </p>
        </div>

        <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              お名前 *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input-field"
              placeholder="お名前を入力してください"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              メールアドレス *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input-field"
              placeholder="メールアドレスを入力してください"
              required
            />
            {email && checkAvailability && !checkAvailability.available && (
              <p className="text-xs text-red-400 mt-1">
                {checkAvailability.reason === "auth_account_exists" 
                  ? "認証システムに残っています（管理者にクリーンアップを依頼）" 
                  : "このメールアドレスは既に使用されています"}
              </p>
            )}
            {email && checkAvailability && checkAvailability.available && (
              <p className="text-xs text-green-400 mt-1">
                このメールアドレスは使用可能です
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              パスワード *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input-field"
              placeholder="パスワードを入力してください"
              required
              minLength={6}
            />
            <p className="text-xs text-gray-400 mt-1">
              6文字以上で入力してください
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
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
                <span>作成中...</span>
              </div>
            ) : (
              "次へ"
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={onSwitchToSignIn}
            className="text-cyan-400 hover:text-yellow-400 text-sm underline hover:no-underline transition-colors"
          >
            既にアカウントをお持ちの方はこちら
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          属性情報の入力
        </h2>
        <p className="text-gray-300 mt-2 text-sm">
          ステップ 2/2: 統計データ作成のため、以下の情報をお聞かせください
        </p>
      </div>

      <form onSubmit={handleDemographicsSubmit} className="space-y-4">
        <div>
          <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-300 mb-2">
            年代 *
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
            性別 *
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
            地域 *
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

        <div className="bg-blue-500/20 border border-blue-500 text-blue-300 px-4 py-3 rounded-lg text-sm">
          <p className="font-medium mb-1">📊 統計データについて</p>
          <p>
            入力いただいた情報は、サイトの利用状況分析や改善のための統計データとして活用させていただきます。
            個人を特定する情報として使用されることはありません。
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex-1 py-3 rounded-lg font-medium border-2 border-gray-500 text-gray-300 hover:border-yellow-400 hover:text-yellow-400 transition-all duration-300"
          >
            戻る
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 auth-button"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>登録中...</span>
              </div>
            ) : (
              "登録完了"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
