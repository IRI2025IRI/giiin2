import { useEffect, useRef, useState } from "react";

interface InfoTooltipProps {
  text: string;
  label?: string;
}

// 議会用語などを説明する常設ヘルプアイコン。タップ/クリックで開閉する（ホバー非依存でモバイルでも使える）
export function InfoTooltip({ text, label = "用語の説明" }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <span className="relative inline-flex items-center" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={label}
        aria-expanded={isOpen}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/15 text-[10px] leading-none text-gray-200 hover:bg-white/25 transition-colors ml-1 align-middle"
      >
        ?
      </button>
      {isOpen && (
        <span
          role="tooltip"
          className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-64 max-w-[80vw] rounded-lg bg-gray-900 border border-purple-500/50 text-xs text-gray-200 p-3 leading-relaxed shadow-xl"
        >
          {text}
        </span>
      )}
    </span>
  );
}
