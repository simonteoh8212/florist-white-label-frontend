"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useCountUp
 * Smoothly animates a numeric value from the currently displayed value
 * to the new target value using requestAnimationFrame.
 * Respects prefers-reduced-motion by updating immediately.
 */
export function useCountUp(target: number, ms = 280): number {
  const [v, setV] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      from.current = target;
      setV(target);
      return;
    }

    const start = performance.now();
    const f = from.current;
    let raf = 0;

    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      const val = f + (target - f) * k;
      from.current = val;
      setV(val);
      if (k < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);

  return v;
}
