// ビルド前に議員一覧などをConvexから取得し、public/sitemap.xmlを生成する。
// 検索エンジンが議員個別ページ（?view=memberDetail&member=ID）を発見できるようにするため。
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { config as loadDotenv } from "dotenv";

// build:prod/build:devが明示的に設定した値を優先しつつ、素のbuildコマンド実行時は.env.localを補完的に読み込む
loadDotenv({ path: ".env.local" });

const SITE_URL = "https://giiin.info";

// ConvexHttpClient経由の匿名クエリは一部デプロイでServer Errorになることが確認できたため、
// 認証済みのConvex CLI（npx convex run）経由でデータを取得する
function runConvexQuery(functionName, args = {}) {
  const isWindows = process.platform === "win32";
  const cmd = isWindows ? "cmd" : "npx";
  const cmdArgs = isWindows
    ? ["/c", "npx", "convex", "run", functionName, JSON.stringify(args)]
    : ["convex", "run", functionName, JSON.stringify(args)];
  const output = execFileSync(cmd, cmdArgs, { encoding: "utf-8" });
  return JSON.parse(output);
}

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return char;
    }
  });
}

function urlEntry(loc, { changefreq = "weekly", priority = "0.5" } = {}) {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

async function main() {
  const entries = [
    urlEntry(`${SITE_URL}/`, { changefreq: "daily", priority: "1.0" }),
    urlEntry(`${SITE_URL}/?view=questions`, { changefreq: "daily", priority: "0.9" }),
    urlEntry(`${SITE_URL}/?view=members`, { changefreq: "weekly", priority: "0.9" }),
    urlEntry(`${SITE_URL}/?view=news`, { changefreq: "daily", priority: "0.7" }),
    urlEntry(`${SITE_URL}/?view=rankings`, { changefreq: "weekly", priority: "0.6" }),
    urlEntry(`${SITE_URL}/?view=faq`, { changefreq: "monthly", priority: "0.4" }),
  ];

  try {
    const members = runConvexQuery("councilMembers:list", {});
    for (const member of members) {
      entries.push(
        urlEntry(`${SITE_URL}/?view=memberDetail&member=${member._id}`, {
          changefreq: "weekly",
          priority: "0.8",
        })
      );
    }
    console.log(`[sitemap] 議員ページ ${members.length} 件を含めました。`);
  } catch (error) {
    console.warn("[sitemap] 議員一覧の取得に失敗したため、議員ページは含めずに生成します。", error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const publicDir = join(__dirname, "..", "public");
  mkdirSync(publicDir, { recursive: true });
  writeFileSync(join(publicDir, "sitemap.xml"), xml, "utf-8");
  console.log(`[sitemap] public/sitemap.xml を生成しました（合計${entries.length}件）。`);
}

main();
