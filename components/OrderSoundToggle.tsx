"use client";

import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { unlockAudioContext, playOrderAlertSound } from "@/lib/sound";

export interface OrderSoundToggleProps {
  enabled: boolean;
  onToggle: (nextState: boolean) => void;
  variant?: "pill" | "menuitem" | "icon";
  className?: string;
}

export function OrderSoundToggle({
  enabled,
  onToggle,
  variant = "pill",
  className = "",
}: OrderSoundToggleProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    unlockAudioContext();
    const next = !enabled;
    onToggle(next);
    if (next) {
      // Play a preview chime so the florist confirms sound volume is on
      playOrderAlertSound("standard");
    }
  };

  if (variant === "menuitem") {
    return (
      <button
        type="button"
        role="menuitem"
        onClick={handleClick}
        className={`flex items-center justify-between w-full px-3 py-2.5 text-xs font-semibold rounded-xl text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer ${className}`}
      >
        <div className="flex items-center gap-2">
          {enabled ? (
            <Volume2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <VolumeX className="h-4 w-4 text-stone-400 shrink-0" />
          )}
          <span>Order chime</span>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            enabled
              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
              : "bg-stone-100 text-stone-500 border-stone-200"
          }`}
        >
          {enabled ? "ON" : "OFF"}
        </span>
      </button>
    );
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={handleClick}
        title={enabled ? "Chime sound enabled (click to mute)" : "Chime sound muted (click to enable)"}
        className={`inline-flex items-center justify-center h-9 w-9 rounded-full border bg-white shadow-2xs hover:bg-stone-50 active:scale-95 transition-all cursor-pointer ${
          enabled
            ? "border-emerald-300 text-emerald-700"
            : "border-stone-200/90 text-stone-400 hover:text-stone-700"
        } ${className}`}
      >
        {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </button>
    );
  }

  // Default "pill" variant
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={handleClick}
      title={enabled ? "Chime sound alert is ON" : "Chime sound alert is OFF"}
      className={`inline-flex items-center gap-1.5 font-semibold text-xs border rounded-lg px-2.5 py-1 min-h-[34px] shadow-2xs active:scale-95 transition-all cursor-pointer ${
        enabled
          ? "bg-emerald-50/60 text-emerald-800 border-emerald-200/80 hover:bg-emerald-50"
          : "bg-white text-stone-600 border-stone-200/90 hover:bg-stone-50 hover:text-stone-800"
      } ${className}`}
    >
      {enabled ? (
        <Volume2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
      ) : (
        <VolumeX className="h-3.5 w-3.5 text-stone-400 shrink-0" />
      )}
      <span>{enabled ? "Chime on" : "Chime off"}</span>
    </button>
  );
}

