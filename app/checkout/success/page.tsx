"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { floristConfig } from "@/config/florist.config";
import { CheckCircle2, Home, Sparkles } from "lucide-react";
import { useTranslation } from "@/i18n/localeStore";
import { LanguageSelector } from "@/components/LanguageSelector";

function SuccessContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const orderRef =
    searchParams.get("ref") ||
    `REF-${Math.floor(100000 + Math.random() * 900000)}`;

  const cleanWhatsappNumber = floristConfig.whatsappNumber.replace(/\D/g, "");
  const followUpUrl = `https://api.whatsapp.com/send?phone=${cleanWhatsappNumber}&text=${encodeURIComponent(
    `Hello ${floristConfig.storeName}! I just completed payment for order #${orderRef}. Could you confirm my order status?`
  )}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F6] px-4 py-12">
      <div className="relative w-full max-w-md rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-200/50 text-center">
        {/* Language selector in top-right */}
        <div className="absolute top-4 right-4 z-10">
          <LanguageSelector />
        </div>

        {/* Animated / styled check badge */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mt-2">
          <CheckCircle2 className="h-10 w-10 stroke-[2.2]" />
        </div>

        <div className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 mb-2">
          <Sparkles className="h-3 w-3 text-rose-500" />
          <span>{t("paymentAuthorized")}</span>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-stone-900">
          {t("thankYouOrder")}
        </h1>

        <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">
          {t("successDesc", { store: floristConfig.storeName })}
        </p>

        {/* Order Reference Box */}
        <div className="mt-5 rounded-2xl bg-stone-50 border border-stone-200/80 p-3.5 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            {t("orderReference")}
          </span>
          <div className="mt-0.5 text-base font-extrabold text-stone-800 tracking-wider">
            #{orderRef}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-2.5">
          <a
            href={followUpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 px-4 text-xs font-bold text-white shadow-xs hover:bg-[#20ba59] active:scale-98 transition-all"
          >
            <Image
              src="/icons/whatsapp.svg"
              alt="WhatsApp"
              width={16}
              height={16}
              className="h-4 w-4 brightness-0 invert shrink-0"
              unoptimized
            />
            <span>{t("notifyWhatsApp")}</span>
          </a>

          <Link
            href="/"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white py-3 px-4 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <Home className="h-4 w-4 text-stone-500" />
            <span>{t("returnToCatalog")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-xs text-stone-500">
          Loading order status...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
