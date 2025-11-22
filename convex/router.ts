import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// メール認証用のルート
http.route({
  path: "/verify-email",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    
    if (!token) {
      return new Response("認証トークンが見つかりません", { 
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    try {
      // トークンを使ってメール認証を実行
      const result = await ctx.runMutation(api.emailAuth.verifyEmailToken, { token });
      
      // アプリのベースURLを取得
      const appUrl = process.env.CONVEX_SITE_URL || `https://${process.env.CONVEX_CLOUD_URL?.replace('https://', '')}`;
      
      if (result.success) {
        // 認証成功時のHTMLレスポンス
        const successHtml = `
          <!DOCTYPE html>
          <html lang="ja">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>メール認証完了 - GIIIN/ギイーン</title>
            <style>
              body {
                font-family: 'Noto Sans JP', sans-serif;
                background: linear-gradient(135deg, #1a0b3d 0%, #4c1d95 25%, #1e3a8a 50%, #0891b2 75%, #f59e0b 100%);
                color: #f8fafc;
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .container {
                background: rgba(248, 250, 252, 0.05);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(248, 250, 252, 0.1);
                border-radius: 16px;
                padding: 40px;
                text-align: center;
                max-width: 500px;
                box-shadow: 0 25px 50px -12px rgba(245, 158, 11, 0.4);
              }
              .logo {
                width: 64px;
                height: 64px;
                margin: 0 auto 20px;
                border-radius: 50%;
                overflow: hidden;
              }
              .logo img {
                width: 100%;
                height: 100%;
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
              .success-icon {
                font-size: 4rem;
                color: #10b981;
                margin-bottom: 20px;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #4c1d95, #1e3a8a, #0891b2);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                margin-top: 20px;
                transition: all 0.3s ease;
                border: 1px solid #f59e0b;
              }
              .button:hover {
                background: linear-gradient(135deg, #f59e0b, #4c1d95, #1e3a8a);
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(245, 158, 11, 0.5);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">
                <img src="https://i.gyazo.com/b4bbdbe8695db5c6bfbc110001f0c855.png" alt="GIIIN/ギイーン ロゴ">
              </div>
              <div class="success-icon">✅</div>
              <h1>メール認証完了</h1>
              <p>メールアドレスの認証が完了しました。</p>
              <p>GIIIN/ギイーンをご利用いただき、ありがとうございます。</p>
              <a href="${appUrl}/" class="button">
                アプリに戻る
              </a>
            </div>
          </body>
          </html>
        `;
        
        return new Response(successHtml, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      } else {
        // 認証失敗時のHTMLレスポンス
        const errorHtml = `
          <!DOCTYPE html>
          <html lang="ja">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>認証エラー - GIIIN/ギイーン</title>
            <style>
              body {
                font-family: 'Noto Sans JP', sans-serif;
                background: linear-gradient(135deg, #1a0b3d 0%, #4c1d95 25%, #1e3a8a 50%, #0891b2 75%, #f59e0b 100%);
                color: #f8fafc;
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .container {
                background: rgba(248, 250, 252, 0.05);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(248, 250, 252, 0.1);
                border-radius: 16px;
                padding: 40px;
                text-align: center;
                max-width: 500px;
                box-shadow: 0 25px 50px -12px rgba(220, 38, 38, 0.4);
              }
              .logo {
                width: 64px;
                height: 64px;
                margin: 0 auto 20px;
                border-radius: 50%;
                overflow: hidden;
              }
              .logo img {
                width: 100%;
                height: 100%;
                object-fit: contain;
              }
              h1 {
                background: linear-gradient(to right, #dc2626, #f59e0b);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                font-size: 2rem;
                margin-bottom: 20px;
              }
              .error-icon {
                font-size: 4rem;
                color: #dc2626;
                margin-bottom: 20px;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #4c1d95, #1e3a8a, #0891b2);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                margin-top: 20px;
                transition: all 0.3s ease;
                border: 1px solid #f59e0b;
              }
              .button:hover {
                background: linear-gradient(135deg, #f59e0b, #4c1d95, #1e3a8a);
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(245, 158, 11, 0.5);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">
                <img src="https://i.gyazo.com/b4bbdbe8695db5c6bfbc110001f0c855.png" alt="GIIIN/ギイーン ロゴ">
              </div>
              <div class="error-icon">❌</div>
              <h1>認証エラー</h1>
              <p>${result.error || '認証に失敗しました。'}</p>
              <p>認証リンクが無効または期限切れの可能性があります。</p>
              <a href="${appUrl}/" class="button">
                アプリに戻る
              </a>
            </div>
          </body>
          </html>
        `;
        
        return new Response(errorHtml, {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      }
    } catch (error) {
      console.error("Email verification error:", error);
      
      const appUrl = process.env.CONVEX_SITE_URL || `https://${process.env.CONVEX_CLOUD_URL?.replace('https://', '')}`;
      
      const errorHtml = `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>システムエラー - GIIIN/ギイーン</title>
          <style>
            body {
              font-family: 'Noto Sans JP', sans-serif;
              background: linear-gradient(135deg, #1a0b3d 0%, #4c1d95 25%, #1e3a8a 50%, #0891b2 75%, #f59e0b 100%);
              color: #f8fafc;
              margin: 0;
              padding: 20px;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: rgba(248, 250, 252, 0.05);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(248, 250, 252, 0.1);
              border-radius: 16px;
              padding: 40px;
              text-align: center;
              max-width: 500px;
              box-shadow: 0 25px 50px -12px rgba(220, 38, 38, 0.4);
            }
            .logo {
              width: 64px;
              height: 64px;
              margin: 0 auto 20px;
              border-radius: 50%;
              overflow: hidden;
            }
            .logo img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            h1 {
              background: linear-gradient(to right, #dc2626, #f59e0b);
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
              font-size: 2rem;
              margin-bottom: 20px;
            }
            .error-icon {
              font-size: 4rem;
              color: #dc2626;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #4c1d95, #1e3a8a, #0891b2);
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              margin-top: 20px;
              transition: all 0.3s ease;
              border: 1px solid #f59e0b;
            }
            .button:hover {
              background: linear-gradient(135deg, #f59e0b, #4c1d95, #1e3a8a);
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(245, 158, 11, 0.5);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="https://i.gyazo.com/b4bbdbe8695db5c6bfbc110001f0c855.png" alt="GIIIN/ギイーン ロゴ">
            </div>
            <div class="error-icon">⚠️</div>
            <h1>システムエラー</h1>
            <p>認証処理中にエラーが発生しました。</p>
            <p>しばらく時間をおいてから再度お試しください。</p>
            <a href="${appUrl}/" class="button">
              アプリに戻る
            </a>
          </div>
        </body>
        </html>
      `;
      
      return new Response(errorHtml, {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
  }),
});

// パスワードリセット用のルート
http.route({
  path: "/reset-password",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    
    if (!token) {
      return new Response("リセットトークンが見つかりません", { 
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // パスワードリセットフォームのHTMLを返す
    const resetFormHtml = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>パスワードリセット - GIIIN/ギイーン</title>
        <style>
          body {
            font-family: 'Noto Sans JP', sans-serif;
            background: linear-gradient(135deg, #1a0b3d 0%, #4c1d95 25%, #1e3a8a 50%, #0891b2 75%, #f59e0b 100%);
            color: #f8fafc;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: rgba(248, 250, 252, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(248, 250, 252, 0.1);
            border-radius: 16px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 25px 50px -12px rgba(245, 158, 11, 0.4);
          }
          .logo {
            width: 64px;
            height: 64px;
            margin: 0 auto 20px;
            border-radius: 50%;
            overflow: hidden;
          }
          .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          h1 {
            background: linear-gradient(to right, #f59e0b, #a855f7, #06b6d4);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            font-size: 2rem;
            margin-bottom: 20px;
            text-align: center;
            text-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
          }
          .form-group {
            margin-bottom: 20px;
          }
          label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #f59e0b;
          }
          input[type="password"] {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #4c1d95;
            border-radius: 8px;
            background: rgba(248, 250, 252, 0.05);
            color: #f8fafc;
            font-size: 16px;
            backdrop-filter: blur(10px);
            box-sizing: border-box;
          }
          input[type="password"]:focus {
            outline: none;
            border-color: #f59e0b;
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
          }
          .button {
            width: 100%;
            background: linear-gradient(135deg, #4c1d95, #1e3a8a, #0891b2);
            color: white;
            padding: 12px 24px;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .button:hover {
            background: linear-gradient(135deg, #f59e0b, #4c1d95, #1e3a8a);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.5);
          }
          .button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }
          .error {
            color: #dc2626;
            margin-top: 10px;
            padding: 10px;
            background: rgba(220, 38, 38, 0.1);
            border-radius: 4px;
            border: 1px solid rgba(220, 38, 38, 0.3);
          }
          .success {
            color: #10b981;
            margin-top: 10px;
            padding: 10px;
            background: rgba(16, 185, 129, 0.1);
            border-radius: 4px;
            border: 1px solid rgba(16, 185, 129, 0.3);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <img src="https://i.gyazo.com/b4bbdbe8695db5c6bfbc110001f0c855.png" alt="GIIIN/ギイーン ロゴ">
          </div>
          <h1>パスワードリセット</h1>
          <form id="resetForm">
            <div class="form-group">
              <label for="password">新しいパスワード</label>
              <input type="password" id="password" name="password" required minlength="8">
            </div>
            <div class="form-group">
              <label for="confirmPassword">パスワード確認</label>
              <input type="password" id="confirmPassword" name="confirmPassword" required minlength="8">
            </div>
            <button type="submit" class="button" id="submitBtn">パスワードを更新</button>
          </form>
          <div id="message"></div>
        </div>
        
        <script>
          document.getElementById('resetForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const messageDiv = document.getElementById('message');
            const submitBtn = document.getElementById('submitBtn');
            
            if (password !== confirmPassword) {
              messageDiv.innerHTML = '<div class="error">パスワードが一致しません。</div>';
              return;
            }
            
            if (password.length < 8) {
              messageDiv.innerHTML = '<div class="error">パスワードは8文字以上で入力してください。</div>';
              return;
            }
            
            submitBtn.disabled = true;
            submitBtn.textContent = '更新中...';
            
            try {
              const response = await fetch('/reset-password', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  token: '${token}',
                  password: password
                })
              });
              
              const result = await response.json();
              
              if (result.success) {
                messageDiv.innerHTML = '<div class="success">パスワードが正常に更新されました。アプリに戻ってログインしてください。</div>';
                document.getElementById('resetForm').style.display = 'none';
              } else {
                messageDiv.innerHTML = '<div class="error">' + (result.error || 'パスワードの更新に失敗しました。') + '</div>';
              }
            } catch (error) {
              messageDiv.innerHTML = '<div class="error">エラーが発生しました。しばらく時間をおいてから再度お試しください。</div>';
            } finally {
              submitBtn.disabled = false;
              submitBtn.textContent = 'パスワードを更新';
            }
          });
        </script>
      </body>
      </html>
    `;
    
    return new Response(resetFormHtml, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }),
});

// パスワードリセット処理用のPOSTルート
http.route({
  path: "/reset-password",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { token, password } = body;
      
      if (!token || !password) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "トークンとパスワードが必要です。" 
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      const result = await ctx.runMutation(api.emailAuth.resetPassword, { 
        token, 
        newPassword: password 
      });
      
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Password reset error:", error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "パスワードリセット処理中にエラーが発生しました。" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }),
});

export default http;
