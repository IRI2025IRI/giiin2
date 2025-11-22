import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Slideshow() {
  const slides = useQuery(api.slideshow.listActive) || [];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (slides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) {
    return null;
  }

  const currentSlideData = slides[currentSlide];

  return (
    <div className="relative w-full h-64 sm:h-80 lg:h-96 rounded-xl overflow-hidden shadow-lg mb-6 sm:mb-8">
      {/* スライド画像 */}
      {currentSlideData.imageUrl && (
        <img
          src={currentSlideData.imageUrl}
          alt={currentSlideData.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      
      {/* 背景色オーバーレイ（透明でない場合のみ） */}
      {currentSlideData.backgroundColor !== "transparent" && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: currentSlideData.backgroundColor }}
        />
      )}
      
      {/* コンテンツオーバーレイ（背景色が設定されている場合） */}
      {currentSlideData.backgroundColor !== "transparent" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white p-4 sm:p-6 max-w-4xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 drop-shadow-lg">
              {currentSlideData.title}
            </h2>
            <p className="text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 drop-shadow-lg">
              {currentSlideData.description}
            </p>
            {currentSlideData.linkUrl && (
              <a
                href={currentSlideData.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-gray-800 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-lg relative z-10"
              >
                詳細を見る
              </a>
            )}
          </div>
        </div>
      )}
      
      {/* 背景色が透明の場合のテキストオーバーレイ（画像の下部に配置） */}
      {currentSlideData.backgroundColor === "transparent" && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 sm:p-6">
          <div className="text-center text-white max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 drop-shadow-lg">
              {currentSlideData.title}
            </h2>
            <p className="text-sm sm:text-base mb-3 sm:mb-4 drop-shadow-lg">
              {currentSlideData.description}
            </p>
            {currentSlideData.linkUrl && (
              <a
                href={currentSlideData.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-gray-800 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-lg text-sm sm:text-base relative z-10"
              >
                詳細を見る
              </a>
            )}
          </div>
        </div>
      )}



      {/* ナビゲーションボタン */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
            className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 sm:p-2 rounded-full hover:bg-opacity-70 transition-colors"
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
            className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 sm:p-2 rounded-full hover:bg-opacity-70 transition-colors"
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
