import { useEffect } from "react";

interface DocumentMetaOptions {
  title: string;
  description?: string;
  canonicalUrl?: string;
  structuredData?: Record<string, unknown>;
}

// 個別ページ（議員詳細など）でtitle/meta description/canonicalと構造化データ(JSON-LD)を
// 一時的に差し替える。画面を離れたら元の値に戻す（SEO対策）
export function useDocumentMeta({ title, description, canonicalUrl, structuredData }: DocumentMetaOptions) {
  const structuredDataJson = structuredData ? JSON.stringify(structuredData) : undefined;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const descriptionTag = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionTag?.getAttribute("content") ?? null;
    if (description && descriptionTag) {
      descriptionTag.setAttribute("content", description);
    }

    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    const previousOgTitle = ogTitleTag?.getAttribute("content") ?? null;
    if (ogTitleTag) {
      ogTitleTag.setAttribute("content", title);
    }

    const ogDescTag = document.querySelector('meta[property="og:description"]');
    const previousOgDesc = ogDescTag?.getAttribute("content") ?? null;
    if (description && ogDescTag) {
      ogDescTag.setAttribute("content", description);
    }

    const ogUrlTag = document.querySelector('meta[property="og:url"]');
    const previousOgUrl = ogUrlTag?.getAttribute("content") ?? null;
    if (canonicalUrl && ogUrlTag) {
      ogUrlTag.setAttribute("content", canonicalUrl);
    }

    const canonicalTag = document.querySelector('link[rel="canonical"]');
    const previousCanonical = canonicalTag?.getAttribute("href") ?? null;
    if (canonicalUrl && canonicalTag) {
      canonicalTag.setAttribute("href", canonicalUrl);
    }

    let structuredScript: HTMLScriptElement | null = null;
    if (structuredDataJson) {
      structuredScript = document.createElement("script");
      structuredScript.type = "application/ld+json";
      structuredScript.text = structuredDataJson;
      document.head.appendChild(structuredScript);
    }

    return () => {
      document.title = previousTitle;
      if (descriptionTag && previousDescription !== null) {
        descriptionTag.setAttribute("content", previousDescription);
      }
      if (ogTitleTag && previousOgTitle !== null) {
        ogTitleTag.setAttribute("content", previousOgTitle);
      }
      if (ogDescTag && previousOgDesc !== null) {
        ogDescTag.setAttribute("content", previousOgDesc);
      }
      if (ogUrlTag && previousOgUrl !== null) {
        ogUrlTag.setAttribute("content", previousOgUrl);
      }
      if (canonicalTag && previousCanonical !== null) {
        canonicalTag.setAttribute("href", previousCanonical);
      }
      structuredScript?.remove();
    };
  }, [title, description, canonicalUrl, structuredDataJson]);
}
