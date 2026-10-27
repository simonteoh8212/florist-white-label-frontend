"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLocaleStore } from "@/i18n/localeStore";
import { Locale } from "@/i18n/translations";
import { Check, ChevronDown } from "lucide-react";

interface LanguageSelectorProps {
  variant?: "header" | "compact";
  primaryColor?: string;
}

function UkFlag() {
  return (
    <svg
      className="h-4 w-4 shrink-0 rounded-full shadow-2xs"
      viewBox="0 0 60 60"
      aria-hidden="true"
    >
      <clipPath id="uk-flag-clip">
        <circle cx="30" cy="30" r="30" />
      </clipPath>
      <g clipPath="url(#uk-flag-clip)">
        <path fill="#012169" d="M0 0h60v60H0z" />
        <path stroke="#fff" strokeWidth="12" d="M0 0l60 60M60 0L0 60" />
        <path stroke="#C8102E" strokeWidth="6" d="M0 0l60 60M60 0L0 60" />
        <path stroke="#fff" strokeWidth="18" d="M30 0v60M0 30h60" />
        <path stroke="#C8102E" strokeWidth="10" d="M30 0v60M0 30h60" />
      </g>
    </svg>
  );
}

function ChinaFlag() {
  return (
    <svg
      className="h-4 w-4 shrink-0 rounded-full shadow-2xs"
      viewBox="0 0 60 60"
      aria-hidden="true"
    >
      <clipPath id="china-flag-clip">
        <circle cx="30" cy="30" r="30" />
      </clipPath>
      <g clipPath="url(#china-flag-clip)">
        <rect width="60" height="60" fill="#DE2910" />
        <polygon
          fill="#FFDE00"
          points="15,6 18,15 27,15 20,20 22.5,29 15,23 7.5,29 10,20 3,15 12,15"
        />
        <polygon
          fill="#FFDE00"
          points="28,8 29.5,11.5 33,11.5 30,13.5 31,17 28,15 25,17 26,13.5 23,11.5 26.5,11.5"
        />
        <polygon
          fill="#FFDE00"
          points="34,14 35.5,17.5 39,17.5 36,19.5 37,23 34,21 31,23 32,19.5 29,17.5 32.5,17.5"
        />
        <polygon
          fill="#FFDE00"
          points="34,23 35.5,26.5 39,26.5 36,28.5 37,32 34,30 31,32 32,28.5 29,26.5 32.5,26.5"
        />
        <polygon
          fill="#FFDE00"
          points="28,29 29.5,32.5 33,32.5 30,34.5 31,38 28,36 25,38 26,34.5 23,32.5 26.5,32.5"
        />
      </g>
    </svg>
  );
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  primaryColor = "#BE185D",
}) => {
  const { locale, setLocale } = useLocaleStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const languages: {
    code: Locale;
    label: string;
    short: string;
    renderFlag: () => React.ReactNode;
  }[] = [
    {
      code: "en",
      label: "English",
      short: "EN",
      renderFlag: () => <UkFlag />,
    },
    {
      code: "zh",
      label: "\u7B80\u4F53\u4E2D\u6587",
      short: "\u4E2D\u6587",
      renderFlag: () => <ChinaFlag />,
    },
  ];

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  return (
    <div className="relative inline-block text-left shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-stone-200/90 bg-stone-50/90 hover:bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700 shadow-2xs transition-all active:scale-95 cursor-pointer hover:border-stone-300 whitespace-nowrap shrink-0"
        aria-label={`Current language: ${currentLang.label}. Click to switch language.`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {currentLang.renderFlag()}
        <span className="text-[11px] font-bold text-stone-800 whitespace-nowrap">
          {currentLang.short}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-stone-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Language Selection Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-36 rounded-2xl border border-stone-200/90 bg-white p-1 shadow-xl shadow-stone-900/10 backdrop-blur-lg animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 whitespace-nowrap">
            Language
          </div>
          <div className="space-y-0.5">
            {languages.map((lang) => {
              const isActive = locale === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLocale(lang.code);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-stone-100 text-stone-900 font-bold"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  }`}
                  style={isActive ? { color: primaryColor } : undefined}
                >
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    {lang.renderFlag()}
                    <span>{lang.label}</span>
                  </div>
                  {isActive && (
                    <Check
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: primaryColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
