import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { Toaster } from "sonner";
import "./index.css";
import App from "./App";
import { isLINEBrowser } from "./lib/utils";

// Global error handler for LINE browser
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

async function bootstrap() {
  // LINEアプリ内ブラウザなど古いWebViewのみポリフィルを読み込む（他のユーザーの初期バンドルを軽量化）
  if (isLINEBrowser()) {
    await import("core-js/stable");
  }

  try {
    createRoot(rootElement!).render(
      <ConvexAuthProvider client={convex}>
        <App />
        <Toaster position="bottom-right" richColors />
      </ConvexAuthProvider>,
    );
  } catch (error) {
    console.error('Failed to render app:', error);
  }
}

bootstrap();
