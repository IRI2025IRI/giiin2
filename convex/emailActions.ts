"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Resend } from "resend";
import crypto from "crypto";
import { api, internal } from "./_generated/api";

// メール認証トークンを生成して送信
export const sendVerificationEmail = action({
  args: { 
    email: v.string(),
    userId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    try {
      // トークンを生成
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24時間後

      // トークンをデータベースに保存
      await ctx.runMutation(internal.emailAuth.createVerificationToken, {
        email: args.email,
        token,
        type: "verification" as const,
        expiresAt,
        userId: args.userId
      });

      // 認証URLを生成（Convexのデプロイメントドメインを使用）
      const baseUrl = process.env.CONVEX_SITE_URL || `https://${process.env.CONVEX_CLOUD_URL?.replace('https://', '')}`;
      const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

      // メール送信
      const resend = new Resend(process.env.CONVEX_RESEND_API_KEY);
      
      const { data, error } = await resend.emails.send({
        from: "GIIIN/ギイーン <noreply@giiin.info>",
        to: args.email,
        subject: "【GIIIN/ギイーン】メールアドレス認証のお願い",
        html: `
          <!DOCTYPE html>
          <html lang="ja">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>メールアドレス認証</title>
            <style>
              body {
                font-family: 'Noto Sans JP', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
              }
              .container {
                background: linear-gradient(135deg, #1a0b3d 0%, #4c1d95 25%, #1e3a8a 50%, #0891b2 75%, #f59e0b 100%);
                border-radius: 16px;
                padding: 40px;
                color: white;
                text-align: center;
                box-shadow: 0 25px 50px -12px rgba(245, 158, 11, 0.4);
              }
              .logo {
                width: 80px;
                height: 80px;
                margin: 0 auto 20px;
                border-radius: 50%;
                overflow: hidden;
                background: rgba(248, 250, 252, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .logo img {
                width: 60px;
                height: 60px;
                object-fit: contain;
              }
              h1 {
                background: linear-gradient(to right, #f59e0b, #a855f7, #06b6d4);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                font-size: 2rem;
                margin-bottom: 20px;
                text-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
              }
              .content {
                background: rgba(248, 250, 252, 0.05);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                padding: 30px;
                margin: 20px 0;
                border: 1px solid rgba(248, 250, 252, 0.1);
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #10b981, #06b6d4);
                color: white;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 12px;
                font-weight: 600;
                font-size: 18px;
                margin: 20px 0;
                border: 2px solid #f59e0b;
                transition: all 0.3s ease;
              }
              .button:hover {
                background: linear-gradient(135deg, #f59e0b, #10b981);
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(245, 158, 11, 0.5);
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid rgba(248, 250, 252, 0.2);
                font-size: 14px;
                color: rgba(248, 250, 252, 0.8);
              }
              .warning {
                background: rgba(220, 38, 38, 0.1);
                border: 1px solid rgba(220, 38, 38, 0.3);
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                color: #fca5a5;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">
                <img src="https://i.gyazo.com/b4bbdbe8695db5c6bfbc110001f0c855.png" alt="GIIIN/ギイーン ロゴ">
              </div>
              <h1>GIIIN/ギイーン</h1>
              
              <div class="content">
                <h2 style="color: #f59e0b; margin-bottom: 20px;">メールアドレス認証のお願い</h2>
                <p>GIIIN/ギイーンにご登録いただき、ありがとうございます。</p>
                <p>アカウントの有効化のため、下記のボタンをクリックしてメールアドレスの認証を完了してください。</p>
                
                <a href="${verificationUrl}" class="button">
                  メールアドレスを認証する
                </a>
                
                <div class="warning">
                  <strong>⚠️ 重要</strong><br>
                  このリンクは24時間で期限切れとなります。<br>
                  期限切れの場合は、再度認証メールをリクエストしてください。
                </div>
                
                <p style="font-size: 14px; color: rgba(248, 250, 252, 0.8); margin-top: 20px;">
                  ボタンがクリックできない場合は、下記URLをコピーしてブラウザのアドレスバーに貼り付けてください：<br>
                  <span style="word-break: break-all; background: rgba(248, 250, 252, 0.1); padding: 8px; border-radius: 4px; display: inline-block; margin-top: 8px;">
                    ${verificationUrl}
                  </span>
                </p>
              </div>
              
              <div class="footer">
                <p>このメールに心当たりがない場合は、このメールを無視してください。</p>
                <p>お問い合わせ：info@giiin.info</p>
                <p>© 2025 GIIIN/ギイーン 議員活動可視化システム</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error("Email sending error:", error);
        throw new Error("メール送信に失敗しました");
      }

      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error("Send verification email error:", error);
      throw new Error("認証メール送信中にエラーが発生しました");
    }
  },
});

// パスワードリセットメールを送信
export const sendPasswordResetEmail = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    try {
      // ユーザーが存在するかチェック
      const user = await ctx.runQuery(internal.emailAuth.getUserByEmail, { 
        email: args.email 
      });
      
      if (!user) {
        // セキュリティのため、ユーザーが存在しない場合でも成功を返す
        return { success: true };
      }

      // トークンを生成
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1時間後

      // トークンをデータベースに保存
      await ctx.runMutation(internal.emailAuth.createVerificationToken, {
        email: args.email,
        token,
        type: "password_reset" as const,
        expiresAt,
        userId: user._id
      });

      // リセットURLを生成
      const baseUrl = process.env.CONVEX_SITE_URL || `https://${process.env.CONVEX_CLOUD_URL?.replace('https://', '')}`;
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      // メール送信
      const resend = new Resend(process.env.CONVEX_RESEND_API_KEY);
      
      const { data, error } = await resend.emails.send({
        from: "GIIIN/ギイーン <noreply@giiin.info>",
        to: args.email,
        subject: "【GIIIN/ギイーン】パスワードリセットのご案内",
        html: `
          <!DOCTYPE html>
          <html lang="ja">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>パスワードリセット</title>
            <style>
              body {
                font-family: 'Noto Sans JP', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
              }
              .container {
                background: linear-gradient(135deg, #1a0b3d 0%, #4c1d95 25%, #1e3a8a 50%, #0891b2 75%, #f59e0b 100%);
                border-radius: 16px;
                padding: 40px;
                color: white;
                text-align: center;
                box-shadow: 0 25px 50px -12px rgba(245, 158, 11, 0.4);
              }
              .logo {
                width: 80px;
                height: 80px;
                margin: 0 auto 20px;
                border-radius: 50%;
                overflow: hidden;
                background: rgba(248, 250, 252, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .logo img {
                width: 60px;
                height: 60px;
                object-fit: contain;
              }
              h1 {
                background: linear-gradient(to right, #f59e0b, #a855f7, #06b6d4);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                font-size: 2rem;
                margin-bottom: 20px;
                text-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
              }
              .content {
                background: rgba(248, 250, 252, 0.05);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                padding: 30px;
                margin: 20px 0;
                border: 1px solid rgba(248, 250, 252, 0.1);
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #dc2626, #f59e0b);
                color: white;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 12px;
                font-weight: 600;
                font-size: 18px;
                margin: 20px 0;
                border: 2px solid #fca5a5;
                transition: all 0.3s ease;
              }
              .button:hover {
                background: linear-gradient(135deg, #f59e0b, #dc2626);
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(245, 158, 11, 0.5);
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid rgba(248, 250, 252, 0.2);
                font-size: 14px;
                color: rgba(248, 250, 252, 0.8);
              }
              .warning {
                background: rgba(220, 38, 38, 0.1);
                border: 1px solid rgba(220, 38, 38, 0.3);
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                color: #fca5a5;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">
                <img src="https://i.gyazo.com/b4bbdbe8695db5c6bfbc110001f0c855.png" alt="GIIIN/ギイーン ロゴ">
              </div>
              <h1>GIIIN/ギイーン</h1>
              
              <div class="content">
                <h2 style="color: #f59e0b; margin-bottom: 20px;">パスワードリセットのご案内</h2>
                <p>パスワードリセットのリクエストを受け付けました。</p>
                <p>下記のボタンをクリックして、新しいパスワードを設定してください。</p>
                
                <a href="${resetUrl}" class="button">
                  パスワードをリセットする
                </a>
                
                <div class="warning">
                  <strong>⚠️ 重要</strong><br>
                  このリンクは1時間で期限切れとなります。<br>
                  心当たりがない場合は、このメールを無視してください。
                </div>
                
                <p style="font-size: 14px; color: rgba(248, 250, 252, 0.8); margin-top: 20px;">
                  ボタンがクリックできない場合は、下記URLをコピーしてブラウザのアドレスバーに貼り付けてください：<br>
                  <span style="word-break: break-all; background: rgba(248, 250, 252, 0.1); padding: 8px; border-radius: 4px; display: inline-block; margin-top: 8px;">
                    ${resetUrl}
                  </span>
                </p>
              </div>
              
              <div class="footer">
                <p>このメールに心当たりがない場合は、このメールを無視してください。</p>
                <p>お問い合わせ：info@giiin.info</p>
                <p>© 2025 GIIIN/ギイーン 議員活動可視化システム</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error("Password reset email error:", error);
        throw new Error("メール送信に失敗しました");
      }

      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error("Send password reset email error:", error);
      throw new Error("パスワードリセットメール送信中にエラーが発生しました");
    }
  },
});

// 認証メールを再送信
export const resendVerificationEmail = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; messageId?: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("ログインが必要です");
    }

    const user: any = await ctx.runQuery(api.auth.loggedInUser);
    if (!user?.email) {
      throw new Error("メールアドレスが設定されていません");
    }

    return await ctx.runAction(api.emailActions.sendVerificationEmail, {
      email: user.email,
      userId: userId
    });
  },
});
