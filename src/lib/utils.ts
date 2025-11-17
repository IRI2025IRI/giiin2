import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
