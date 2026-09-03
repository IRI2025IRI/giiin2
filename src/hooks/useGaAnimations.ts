import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// 数字を0から目標値までなめらかにカウントアップする（新デザイン用）
export function useCountUp(target: number | undefined, delayMs = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === undefined) return;

    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }

    let raf = 0;
    const duration = 1400;
    const timer = setTimeout(() => {
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delayMs);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, delayMs]);

  return value;
}

// 画面内に入ったら .in-view を付与する（新デザインのスクロール出現演出用）
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(prefersReducedMotion());

  useEffect(() => {
    if (prefersReducedMotion() || !ref.current || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, className: inView ? "ga-reveal in-view" : "ga-reveal" };
}
