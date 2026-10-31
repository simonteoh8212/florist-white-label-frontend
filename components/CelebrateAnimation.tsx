"use client";

import React, { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";
import celebrateAnimationData from "@/public/animated/celebrate.json";

export interface CelebrateAnimationProps {
  loop?: boolean;
  pauseMs?: number;
  className?: string;
  size?: number;
}

export function CelebrateAnimation({
  loop = true,
  pauseMs = 2000,
  className = "",
  size = 280,
}: CelebrateAnimationProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let isCancelled = false;
    let anim: AnimationItem | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Dynamically import lottie-web on client only to ensure SSR safety
    import("lottie-web").then((lottieModule) => {
      if (isCancelled || !containerRef.current) return;
      const lottie = lottieModule.default || lottieModule;

      try {
        // Clone animationData so lottie-web's internal mutations don't touch frozen module objects
        const animData = JSON.parse(JSON.stringify(celebrateAnimationData));

        anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop: loop && pauseMs <= 0,
          autoplay: true,
          animationData: animData,
        });

        // Loop with a custom pause delay between iterations
        if (loop && pauseMs > 0) {
          anim.addEventListener("complete", () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
              if (!isCancelled && anim) {
                anim.goToAndPlay(0, true);
              }
            }, pauseMs);
          });
        }
      } catch (err) {
        console.error("Failed to initialize celebrate animation:", err);
      }
    });

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
      try {
        anim?.destroy();
      } catch {
        // Quietly handle unmount destroy
      }
    };
  }, [loop, pauseMs]);

  return (
    <div
      ref={containerRef}
      className={`absolute pointer-events-none overflow-visible z-20 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        left: "50%",
        top: "50%",
        // 50% X aligns with checkmark center.
        // 64% Y aligns with the origin of the celebrate.json particle cannon (t=0 at y=204.87 / 320)
        transform: "translate(-50%, -64%)",
      }}
      aria-hidden="true"
    />
  );
}

// Re-export as PetalBurst for seamless backward compatibility
export const PetalBurst = CelebrateAnimation;

