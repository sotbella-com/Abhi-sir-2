import { useRef, useEffect, useState } from "react";

/**
 * Scroll-linked scale hook.
 *
 * config:
 *  - mode: "symmetric" | "enter-only"
 *      "symmetric"  -> min -> max -> min across the viewport (original behavior)
 *      "enter-only" -> min -> max and HOLD at max (no zoom-out from bottom)
 *  - min: number (default 0.8)
 *  - max: number (default 1.0)
 */
export const useScrollScale = (config = {}) => {
  const ref = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);

  const mode = config.mode || "symmetric";
  const min = typeof config.min === "number" ? config.min : 0.8;
  const max = typeof config.max === "number" ? config.max : 1.0;
  const range = Math.max(0, max - min);

  useEffect(() => {
    // avoid SSR/hydration issues
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !ref.current) return;

    let rafId = null;

    const calcScale = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // 0..1 progress of the element traveling through the viewport+its height
      const scrollProgress = Math.max(
        0,
        Math.min(1, (windowHeight - rect.top) / (windowHeight + rect.height))
      );

      let newScale;

      if (mode === "enter-only") {
        // ramp from min -> max as it enters; hold at max afterward
        const enterPhase = Math.min(scrollProgress * 2, 1); // 0..1
        newScale = min + enterPhase * range;
      } else {
        // symmetric: min -> max -> min
        if (scrollProgress < 0.5) {
          newScale = min + (scrollProgress * 2) * range; // up to max
        } else {
          newScale = max - ((scrollProgress - 0.5) * 2) * range; // back to min
        }
      }

      setScale(newScale);
    };

    const onScroll = () => {
      // throttle with rAF for better perf
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        calcScale();
      });
    };

    // initial calc
    calcScale();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [mounted, mode, min, max, range]);

  return { ref, scale };
};
