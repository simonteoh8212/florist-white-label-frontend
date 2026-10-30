"use client";

import React from "react";

export function SuccessCheck({ label = "Order sent" }: { label?: string } = {}) {
  return (
    <svg className="check" viewBox="0 0 80 80" role="img" aria-label={label}>
      <circle cx="40" cy="40" r="38" />
      <path d="M24 41l12 12 21-24" pathLength={50} />
    </svg>
  );
}
