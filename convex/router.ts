import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// 画像ストレージのURL取得エンドポイント
http.route({
  path: "/api/storage/{storageId}",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const storageId = pathParts[pathParts.length - 1];
    
    try {
      const url = await ctx.storage.getUrl(storageId as any);
      if (!url) {
        return new Response("Image not found", { status: 404 });
      }
      
      // リダイレクトレスポンスを返す
      return new Response(null, {
        status: 302,
        headers: {
          Location: url,
        },
      });
    } catch (error) {
      return new Response("Invalid storage ID", { status: 400 });
    }
  }),
});

export default http;
