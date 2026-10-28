"use client";

import React from "react";

interface QtyStepperProps {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}

export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 20,
}: QtyStepperProps) {
  const set = (n: number) => {
    onChange(Math.min(max, Math.max(min, n)));
    navigator.vibrate?.(10);
  };

  return (
    <div className="qty" role="group" aria-label="Quantity selector">
      <button
        type="button"
        aria-label="Fewer"
        disabled={value <= min}
        onClick={() => set(value - 1)}
        className="focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-800"
      >
        −
      </button>
      <output key={value} className="bump" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        aria-label="More"
        disabled={value >= max}
        onClick={() => set(value + 1)}
        className="focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-800"
      >
        +
      </button>
    </div>
  );
}
