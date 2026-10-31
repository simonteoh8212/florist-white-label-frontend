"use client";

import React from "react";
import { SuccessCheck } from "@/components/SuccessCheck";
import { CelebrateAnimation } from "@/components/CelebrateAnimation";

export function OrderSuccess({
  message,
  waUrl,
  onBack,
}: {
  message: string;
  waUrl: string;
  onBack: () => void;
}) {
  return (
    <div className="order-success-screen">
      <SuccessCheck>
        <CelebrateAnimation loop pauseMs={2000} />
      </SuccessCheck>
      <p className="order-success-note">
        Keep your payment receipt ready to send in the chat.
      </p>
      <div className="order-success-bubble">{message}</div>
      <a
        className="order-success-wa"
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open WhatsApp again
      </a>
      <button type="button" className="order-success-back" onClick={onBack}>
        Back to catalog
      </button>
    </div>
  );
}
