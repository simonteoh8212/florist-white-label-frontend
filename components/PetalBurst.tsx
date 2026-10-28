"use client";

import React, { useEffect, useState } from "react";

type Petal = { id: number; ch: string; x: number; y: number; r: number; d: number };

const make = (): Petal[] =>
  Array.from({ length: 28 }, (_, i) => {
    const a = Math.random() * Math.PI * 2;
    const dist = 90 + Math.random() * 170;
    return {
      id: i,
      ch: ["🌸", "🌺", "💮"][i % 3],
      x: Math.cos(a) * dist,
      y: Math.sin(a) * dist + 120,
      r: Math.random() * 540 - 270,
      d: Math.random() * 0.15,
    };
  });

export function PetalBurst() {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    setPetals(make());
    navigator.vibrate?.(10);
    const t = setTimeout(() => setPetals([]), 1900);
    return () => clearTimeout(t);
  }, []);

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
