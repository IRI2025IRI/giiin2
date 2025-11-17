"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full min-w-80 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">ログイン・新規登録</h3>
      <form
        className="flex flex-col space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData)
            .then(() => {
              toast.success(flow === "signIn" ? "ログインしました" : "アカウントを作成しました");
              setSubmitting(false);
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
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === "signIn"
              ? "アカウントをお持ちでない方は "
              : "既にアカウントをお持ちの方は "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "新規登録" : "ログイン"}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center my-3">
        <hr className="my-4 grow border-gray-200" />
        <span className="mx-4 text-secondary">または</span>
        <hr className="my-4 grow border-gray-200" />
      </div>
      <button 
        className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-lg font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-300" 
        onClick={() => {
          void signIn("anonymous")
            .then(() => {
              toast.success("匿名でログインしました");
            })
            .catch((error) => {
              toast.error("匿名ログインに失敗しました");
            });
        }}
      >
        匿名でログイン
      </button>
    </div>
  );
}
