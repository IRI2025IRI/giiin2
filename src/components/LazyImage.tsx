import { memo, useCallback } from 'react';

// 遅延ローディング用のコンポーネント
export const LazyImage = memo(({ src, alt, className, ...props }: {
  src?: string;
  alt: string;
  className?: string;
  [key: string]: any;
}) => {
  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.opacity = '1';
  }, []);

  if (!src) {
    return (
      <div className={`bg-gradient-to-r from-yellow-400 to-purple-600 flex items-center justify-center ${className}`}>
        <span className="text-white text-xl font-bold">
          {alt.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onLoad={handleLoad}
      style={{ opacity: 0, transition: 'opacity 0.3s' }}
      {...props}
    />
  );
});

LazyImage.displayName = 'LazyImage';
