"use client";

import React, { useEffect, useState } from "react";
import { StoreConfig } from "@/config/stores";
import {
  AlertCircle,
  Lock,
  RefreshCw,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { useTranslation } from "@/i18n/localeStore";
import { LanguageSelector } from "@/components/LanguageSelector";

interface StorePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: StoreConfig;
  initialTab?: "all" | "substitution" | "delivery" | "refund" | "privacy";
}

export const StorePolicyModal: React.FC<StorePolicyModalProps> = ({
  isOpen,
  onClose,
  store,
  initialTab = "all",
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Close on Escape key press and lock background scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const primaryColor = store.primaryColor || "#BE185D";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-policy-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl transition-all overflow-hidden border border-stone-200/80 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/80 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-2xs border border-stone-200/80"
              style={{ color: primaryColor }}
            >
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="store-policy-modal-title"
                className="text-sm font-bold text-stone-900 leading-tight"
              >
                {t("policyModalTitle")}
              </h2>
              <p className="text-[11px] text-stone-500">
                {store.name}
                {store.ssmNumber ? ` • ${t("ssmLabel", { ssm: store.ssmNumber })}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {store.enableLanguageSelector !== false && <LanguageSelector />}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-stone-400 hover:bg-stone-100 hover:text-stone-700 shadow-2xs transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs text-stone-600 leading-relaxed">
          {/* Policy Section 1: Flower Substitution */}
          <section className="rounded-2xl border border-stone-200/80 bg-stone-50/40 p-4">
            <div className="flex items-center gap-2 text-stone-900 font-bold mb-2">
              <RefreshCw className="h-4 w-4 text-rose-500" />
              <h3 className="text-xs uppercase tracking-wider">
                {t("sec1Title")}
              </h3>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              {t("sec1Desc")}
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-[11px] text-stone-600">
              <li>{t("sec1Bullet1")}</li>
              <li>{t("sec1Bullet2")}</li>
            </ul>
          </section>

          {/* Policy Section 2: Delivery & Fulfillment */}
          <section className="rounded-2xl border border-stone-200/80 bg-stone-50/40 p-4">
            <div className="flex items-center gap-2 text-stone-900 font-bold mb-2">
              <Truck className="h-4 w-4 text-sky-600" />
              <h3 className="text-xs uppercase tracking-wider">
                {t("sec2Title")}
              </h3>
            </div>
            <div className="space-y-2 text-[11px] text-stone-600">
              <p>{t("sec2Desc1")}</p>
              <p>{t("sec2Desc2")}</p>
              <p>{t("sec2Desc3")}</p>
            </div>
          </section>

          {/* Policy Section 3: Return, Refund & Perishable Goods */}
          <section className="rounded-2xl border border-stone-200/80 bg-stone-50/40 p-4">
            <div className="flex items-center gap-2 text-stone-900 font-bold mb-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <h3 className="text-xs uppercase tracking-wider">
                {t("sec3Title")}
              </h3>
            </div>
            <div className="space-y-2 text-[11px] text-stone-600">
              <p>{t("sec3Desc")}</p>
              <ul className="space-y-1 list-disc list-inside text-[11px]">
                <li>{t("sec3Bullet1")}</li>
                <li>{t("sec3Bullet2")}</li>
              </ul>
            </div>
          </section>

          {/* Policy Section 4: Personal Data Protection Act (PDPA 2010) */}
          <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-4">
            <div className="flex items-center gap-2 text-stone-900 font-bold mb-2">
              <Lock className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs uppercase tracking-wider text-emerald-950">
                {t("sec4Title")}
              </h3>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              {t("sec4Desc")}
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-[11px] text-stone-600">
              <li>{t("sec4Bullet1")}</li>
              <li>{t("sec4Bullet2")}</li>
              <li>{t("sec4Bullet3")}</li>
            </ul>
          </section>

          {/* Policy Section 5: Platform Intermediary & Software Disclaimer */}
          <section className="rounded-2xl border border-stone-200/80 bg-stone-100/60 p-4">
            <div className="flex items-center gap-2 text-stone-900 font-bold mb-2">
              <ShieldCheck className="h-4 w-4 text-stone-600" />
              <h3 className="text-xs uppercase tracking-wider text-stone-800">
                {t("sec5Title")}
              </h3>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              {t("sec5Desc")}
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-[11px] text-stone-600">
              <li>{t("sec5Bullet1", { store: store.name })}</li>
              <li>{t("sec5Bullet2", { store: store.name })}</li>
              <li>{t("sec5Bullet3")}</li>
            </ul>
          </section>

          {/* Business Entity Notice */}
          <div className="text-center text-[10px] text-stone-400 pt-1 space-y-0.5">
            {store.companyName && (
              <p>
                {t("operatedBy", { company: store.companyName })}
                {store.ssmNumber ? ` (${t("ssmLabel", { ssm: store.ssmNumber })})` : ""}
              </p>
            )}
            <p className="text-[9px] text-stone-400">
              Powered by flowerapp.my • White-Label Software Solutions
            </p>
          </div>
        </div>

        {/* Footer Action */}
        <div className="border-t border-stone-100 bg-stone-50/50 p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-2.5 px-4 text-xs font-bold text-white shadow-xs transition-all active:scale-98 hover:opacity-95 cursor-pointer text-center"
            style={{ backgroundColor: primaryColor }}
          >
            {t("iUnderstandAgree")}
          </button>
        </div>
      </div>
    </div>
  );
};
