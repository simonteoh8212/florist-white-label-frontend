"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Locale,
  TranslationKey,
  translations,
  translateCategory,
} from "./translations";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (locale) => set({ locale }),
      toggleLocale: () =>
        set((state) => ({ locale: state.locale === "en" ? "zh" : "en" })),
    }),
    {
      name: "flowerapp_locale",
    }
  )
);

export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const toggleLocale = useLocaleStore((state) => state.toggleLocale);

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = translations[locale] || translations.en;
    let text: string = dict[key] || translations.en[key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(val));
      });
    }

    return text;
  };

  const getCategory = (cat: string): string => {
    return translateCategory(cat, locale);
  };

  return {
    locale,
    t,
    setLocale,
    toggleLocale,
    getCategory,
  };
}
