"use client";

import React, { useState, useRef, useEffect, useId, useMemo } from "react";
import { ChevronDown, Check, MapPin, Search, Sparkles } from "lucide-react";
import type { DeliveryZone } from "@/config/stores";

export interface DeliveryZoneDropdownProps {
  zones?: DeliveryZone[];
  selectedZoneId?: string | null;
  onSelectZone: (zoneId: string) => void;
  isFreeDelivery: boolean;
  currency: string;
  locale: string;
  placeholder?: string;
  autoDetected?: boolean;
  hasError?: boolean;
  className?: string;
}

export function DeliveryZoneDropdown({
  zones = [],
  selectedZoneId,
  onSelectZone,
  isFreeDelivery,
  currency,
  locale,
  placeholder,
  autoDetected = false,
  hasError = false,
  className = "",
}: DeliveryZoneDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listboxId = useId();

  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  // Smooth open with enter animation
  const openDropdown = () => {
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    setIsMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsOpen(true);
      });
    });
  };

  // Smooth close with exit animation
  const closeDropdown = () => {
    setIsOpen(false);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => {
      setIsMounted(false);
    }, 180);
  };

  const toggleDropdown = () => {
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  // Cleanup exit timer on unmount
  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  // Filter zones by search query
  const filteredZones = useMemo(() => {
    if (!searchQuery.trim()) return zones;
    const q = searchQuery.toLowerCase().trim();
    return zones.filter((z) => {
      const nameMatch = z.name.toLowerCase().includes(q);
      const nameZhMatch = z.nameZh ? z.nameZh.toLowerCase().includes(q) : false;
      return nameMatch || nameZhMatch;
    });
  }, [zones, searchQuery]);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input on open if search is rendered
  useEffect(() => {
    if (isOpen && zones.length > 3) {
      const t = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(t);
    } else if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen, zones.length]);

  const handleSelect = (zoneId: string) => {
    onSelectZone(zoneId);
    closeDropdown();
  };

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      {/* Interactive Trigger Box (matching Dribbble design) */}
      <button
        type="button"
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border transition-all text-left cursor-pointer h-11 px-3.5 text-xs shadow-2xs ${
          isOpen
            ? "border-stone-400 bg-white ring-2 ring-stone-200/60"
            : hasError
            ? "border-red-400 bg-white ring-2 ring-red-100 text-stone-900"
            : selectedZone
            ? "border-stone-200 bg-white hover:border-stone-300"
            : "border-stone-200 bg-stone-50/50 hover:bg-stone-50 text-stone-400"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MapPin
            className={`h-4 w-4 shrink-0 ${
              selectedZone ? "text-stone-700" : "text-stone-400"
            }`}
          />
          {selectedZone ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="truncate font-medium text-stone-900 text-xs">
                {locale === "zh"
                  ? selectedZone.nameZh || selectedZone.name
                  : selectedZone.name}
              </span>
              <span
                className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isFreeDelivery
                    ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60 font-bold"
                    : "text-stone-600 bg-stone-100 border border-stone-200/60"
                }`}
              >
                {isFreeDelivery ? "FREE" : `+${currency} ${selectedZone.fee.toFixed(2)}`}
              </span>
            </div>
          ) : (
            <span className="text-stone-400 truncate text-xs">
              {placeholder || (locale === "zh" ? "选择配送区域..." : "Select delivery area...")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedZone && autoDetected && !isOpen && (
            <span
              title={locale === "zh" ? "已根据送花地址自动识别" : "Auto-detected from address"}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-600 bg-stone-100 border border-stone-200/80 px-2 py-0.5 rounded-full"
            >
              <Sparkles className="h-2.5 w-2.5 text-stone-500" />
              <span>{locale === "zh" ? "自动识别" : "Auto-detected"}</span>
            </span>
          )}
          {selectedZone && !isOpen && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <Check className="h-3 w-3 stroke-[2.5]" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-stone-400 transition-transform duration-200 ease-out ${
              isOpen ? "rotate-180 text-stone-700" : "rotate-0"
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu Card (with smooth Enter & Exit animation) */}
      {isMounted && (
        <div
          id={listboxId}
          role="listbox"
          className={`absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border border-stone-200/90 bg-white p-1.5 shadow-xl shadow-stone-900/10 max-h-64 overflow-y-auto overscroll-contain origin-top transition-all duration-200 ${
            isOpen
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto ease-out"
              : "opacity-0 scale-95 -translate-y-2 pointer-events-none ease-in duration-150"
          }`}
        >
          {/* Optional search input when multiple zones */}
          {zones.length > 3 && (
            <div className="px-1 pt-1 pb-1.5 border-b border-stone-100 mb-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === "zh" ? "搜索区域..." : "Search delivery area..."}
                  className="w-full rounded-xl bg-stone-50 border border-stone-200 pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-400"
                />
              </div>
            </div>
          )}

          {/* List of Zones */}
          <div className="space-y-0.5">
            {filteredZones.map((zone, index) => {
              const isSelected = zone.id === selectedZoneId;
              const zoneName =
                locale === "zh" ? zone.nameZh || zone.name : zone.name;
              const feeDisplay = isFreeDelivery
                ? "FREE"
                : `+${currency} ${zone.fee.toFixed(2)}`;

              return (
                <button
                  key={`${zone.id}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(zone.id)}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-stone-100/90 text-stone-950 font-semibold"
                      : "text-stone-700 hover:bg-stone-50 active:bg-stone-100 font-normal"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="truncate">{zoneName}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isFreeDelivery
                          ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60 font-bold"
                          : "text-stone-600 bg-stone-100 border border-stone-200/60"
                      }`}
                    >
                      {feeDisplay}
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-stone-800 stroke-[2.5]" />
                    )}
                  </div>
                </button>
              );
            })}

            {filteredZones.length === 0 && (
              <div className="py-4 text-center text-xs text-stone-400">
                {locale === "zh" ? "未找到匹配区域" : "No matching delivery areas"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
