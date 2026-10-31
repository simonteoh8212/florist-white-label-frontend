"use client";

import React from "react";

export interface SuccessCheckProps {
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SuccessCheck({
  label = "Order sent",
  className = "",
  children,
}: SuccessCheckProps = {}) {
  return (
    <div
      className={`relative inline-flex items-center justify-center mx-auto my-1.5 ${className}`}
    >
      <svg
        className="check relative z-10"
        viewBox="0 0 80 80"
        role="img"
        aria-label={label}
      >
        <circle cx="40" cy="40" r="38" />
        <path d="M24 41l12 12 21-24" pathLength={50} />
      </svg>
      {children}
    </div>
  );
}
