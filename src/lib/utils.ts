import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// YouTube URLから動画IDを抽出する（watch/short-url/embed形式に対応）
export const getYouTubeVideoId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    let videoId: string | null = null;

    if (parsed.hostname.includes("youtu.be")) {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v");
      } else if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.replace("/embed/", "");
      } else if (parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.replace("/shorts/", "");
      }
    }

    return videoId?.split(/[?&]/)[0] || null;
  } catch {
    return null;
  }
};

// YouTube URLから埋め込み再生用のURLを生成する
export const getYouTubeEmbedUrl = (url: string): string | null => {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

// YouTube URLからサムネイル画像URLを生成する
export const getYouTubeThumbnailUrl = (url: string): string | null => {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
};

// LINE browser detection and compatibility
export const isLINEBrowser = () => {
  if (typeof navigator === 'undefined') return false;
  return /Line/i.test(navigator.userAgent);
};

// Safe scrollTo function for LINE browser
export const safeScrollTo = (options: ScrollToOptions | number, y?: number) => {
  if (typeof window === 'undefined') return;
  
  try {
    if (typeof options === 'object') {
      if (window.scrollTo) {
        window.scrollTo(options);
      } else {
        window.scroll(options.left || 0, options.top || 0);
      }
    } else {
      if (window.scrollTo) {
        window.scrollTo(options, y || 0);
      } else {
        window.scroll(options, y || 0);
      }
    }
  } catch (error) {
    console.warn('ScrollTo not supported:', error);
  }
};
