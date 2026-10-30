"use client";

import React, { useEffect, useState } from "react";

type Petal = { id: number; ch: string; x: number; y: number; r: number; d: number };

const BURST_DURATION_MS = 1900;

const make = (wave: number): Petal[] =>
  Array.from({ length: 28 }, (_, i) => {
    const a = Math.random() * Math.PI * 2;
    const dist = 90 + Math.random() * 170;
    return {
      id: wave * 100 + i,
      ch: ["🌸", "🌺", "💮"][i % 3],
      x: Math.cos(a) * dist,
      y: Math.sin(a) * dist + 120,
      r: Math.random() * 540 - 270,
      d: Math.random() * 0.15,
    };
  });

export interface PetalBurstProps {
  loop?: boolean;
  pauseMs?: number;
}

export function PetalBurst({ loop = true, pauseMs = 2000 }: PetalBurstProps = {}) {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let cancelled = false;
    let wave = 0;
    let clearTimer: ReturnType<typeof setTimeout> | undefined;
    let nextTimer: ReturnType<typeof setTimeout> | undefined;

    const triggerBurst = (isFirst: boolean) => {
      if (cancelled) return;
      setPetals(make(wave++));
      if (isFirst) {
        navigator.vibrate?.(10);
      }

      clearTimer = setTimeout(() => {
        if (cancelled) return;
        setPetals([]);

        if (loop) {
          nextTimer = setTimeout(() => {
            triggerBurst(false);
          }, pauseMs);
        }
      }, BURST_DURATION_MS);
    };

    triggerBurst(true);

    return () => {
      cancelled = true;
      if (clearTimer) clearTimeout(clearTimer);
      if (nextTimer) clearTimeout(nextTimer);
    };
  }, [loop, pauseMs]);

  return (
    <>
      {petals.map((p) => (
        <span
          key={p.id}
          className="petal"
          aria-hidden="true"
          style={
            {
              "--x": `${p.x}px`,
              "--y": `${p.y}px`,
              "--r": `${p.r}deg`,
              animationDelay: `${p.d}s`,
            } as React.CSSProperties
          }
        >
          {p.ch}
        </span>
      ))}
    </>
  );
}
