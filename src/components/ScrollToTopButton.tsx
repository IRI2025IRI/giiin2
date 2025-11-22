import { useState, useEffect } from "react";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  // スクロール位置を監視
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white rounded-full shadow-lg hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-110 amano-crystal-border animate-amano-glow flex items-center justify-center"
      aria-label="ページトップに戻る"
    >
      <span className="text-xl font-bold">↑</span>
    </button>
  );
}
