"use client";

import React, { useRef, useEffect, useCallback } from "react";

export interface SlidingPillItem<T extends string = string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  activeColor?: string;
  activeTextColor?: string;
  ariaLabel?: string;
}

export interface SlidingPillTabsProps<T extends string = string> {
  items: SlidingPillItem<T>[];
  activeId: T;
  onChange: (id: T, e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "pills" | "segmented";
  prefix?: React.ReactNode;
  activeColor?: string;
  activeTextColor?: string;
  inactiveClassName?: string;
  className?: string;
  pillClassName?: string;
  chipClassName?: string;
  size?: "sm" | "md";
  autoCenter?: boolean;
}

export function SlidingPillTabs<T extends string = string>({
  items,
  activeId,
  onChange,
  variant = "pills",
  prefix,
  activeColor,
  activeTextColor,
  inactiveClassName,
  className = "",
  pillClassName = "",
  chipClassName = "",
  size = "md",
  autoCenter = true,
}: SlidingPillTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  const isSegmented = variant === "segmented";

  // Defaults based on variant
  const defaultActiveColor = isSegmented ? "#ffffff" : "#1c1917";
  const defaultActiveTextColor = isSegmented ? "#1c1917" : "#ffffff";
  const defaultInactiveClass = isSegmented
    ? "text-stone-600 hover:text-stone-900"
    : "bg-stone-100 text-stone-600 hover:bg-stone-200/80";

  const resolvedActiveColor = activeColor || defaultActiveColor;
  const resolvedActiveTextColor = activeTextColor || defaultActiveTextColor;
  const resolvedInactiveClass = inactiveClassName || defaultInactiveClass;

  const activeItem = items.find((item) => item.id === activeId);
  const currentActiveColor = activeItem?.activeColor || resolvedActiveColor;
  const currentActiveTextColor = activeItem?.activeTextColor || resolvedActiveTextColor;

  const movePill = useCallback(
    (smoothScroll: boolean = false) => {
      if (!containerRef.current || !pillRef.current) return;
      const activeChip = containerRef.current.querySelector<HTMLElement>(
        '.sliding-pill-chip[data-active="true"]'
      );
      if (!activeChip) return;

      const pill = pillRef.current;
      pill.style.transform = `translateX(${activeChip.offsetLeft}px)`;
      pill.style.width = `${activeChip.offsetWidth}px`;
      pill.style.top = `${activeChip.offsetTop}px`;
      pill.style.height = `${activeChip.offsetHeight}px`;
      pill.style.backgroundColor = currentActiveColor;
      pill.style.opacity = "1";

      if (smoothScroll && autoCenter && !isSegmented) {
        const prefersReducedMotion =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        activeChip.scrollIntoView({
          inline: "center",
          block: "nearest",
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      }
    },
    [currentActiveColor, autoCenter, isSegmented]
  );

  const handleChipClick = (
    item: SlidingPillItem<T>,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    onChange(item.id, e);

    const chip = e.currentTarget;
    if (pillRef.current) {
      pillRef.current.style.transform = `translateX(${chip.offsetLeft}px)`;
      pillRef.current.style.width = `${chip.offsetWidth}px`;
      pillRef.current.style.top = `${chip.offsetTop}px`;
      pillRef.current.style.height = `${chip.offsetHeight}px`;
      pillRef.current.style.backgroundColor = item.activeColor || resolvedActiveColor;
      pillRef.current.style.opacity = "1";
    }

    if (autoCenter && !isSegmented) {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      chip.scrollIntoView({
        inline: "center",
        block: "nearest",
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      movePill(false);
    }, 25);

    const handleResize = () => {
      movePill(false);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [movePill]);

  useEffect(() => {
    movePill(true);
  }, [activeId, movePill]);

  // Size styling for pills mode
  const sizeClasses =
    size === "sm"
      ? "px-2.5 py-1 text-xs gap-1"
      : "px-3.5 py-1.5 text-xs gap-1.5";

  // Segmented mode container
  if (isSegmented) {
    return (
      <div
        ref={containerRef}
        className={`relative flex items-center rounded-2xl bg-stone-200/70 p-1 text-xs font-semibold text-stone-600 w-full select-none ${className}`}
      >
        {/* Animated Spring Sliding Pill for Segmented View */}
        <div
          ref={pillRef}
          className={`sliding-pill-indicator pointer-events-none rounded-xl shadow-xs ${pillClassName}`}
          style={{
            backgroundColor: currentActiveColor,
            opacity: 0,
          }}
        />

        {items.map((item) => {
          const isActive = item.id === activeId;
          const badgeContent =
            typeof item.badge === "function" ? item.badge(isActive) : item.badge;

          return (
            <button
              key={item.id}
              type="button"
              data-active={isActive ? "true" : "false"}
              onClick={(e) => handleChipClick(item, e)}
              aria-label={
                item.ariaLabel ||
                (typeof item.label === "string" ? item.label : undefined)
              }
              className={`sliding-pill-chip flex-1 rounded-xl py-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 relative z-10 select-none text-xs ${chipClassName} ${
                isActive ? "is-active font-bold" : resolvedInactiveClass
              }`}
              style={{
                color: isActive ? currentActiveTextColor : undefined,
              }}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
              {badgeContent && <span className="shrink-0">{badgeContent}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  // Pills mode container
  return (
    <div className={`flex items-center gap-1.5 w-full ${className}`}>
      {prefix && <div className="shrink-0 select-none">{prefix}</div>}

      <div
        ref={containerRef}
        className="chips-row no-scrollbar relative flex-1 flex items-center gap-1.5 overflow-x-auto overflow-y-hidden whitespace-nowrap touch-pan-x overscroll-x-contain pb-0.5 select-none"
        style={{ touchAction: "pan-x" }}
      >
        {/* Animated Spring Sliding Pill */}
        <div
          ref={pillRef}
          className={`sliding-pill-indicator pointer-events-none rounded-full ${pillClassName}`}
          style={{
            backgroundColor: currentActiveColor,
            opacity: 0,
          }}
        />

        {items.map((item) => {
          const isActive = item.id === activeId;
          const badgeContent =
            typeof item.badge === "function" ? item.badge(isActive) : item.badge;

          return (
            <button
              key={item.id}
              type="button"
              data-active={isActive ? "true" : "false"}
              onClick={(e) => handleChipClick(item, e)}
              aria-label={
                item.ariaLabel ||
                (typeof item.label === "string" ? item.label : undefined)
              }
              className={`sliding-pill-chip shrink-0 rounded-full font-semibold whitespace-nowrap cursor-pointer touch-pan-x select-none inline-flex items-center justify-center transition-all ${sizeClasses} ${chipClassName} ${
                isActive ? "is-active font-bold shadow-2xs" : resolvedInactiveClass
              }`}
              style={{
                touchAction: "pan-x",
                color: isActive ? currentActiveTextColor : undefined,
              }}
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
              {badgeContent && <span className="shrink-0">{badgeContent}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
