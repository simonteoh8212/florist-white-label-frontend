"use client";

import React from "react";
import Image from "next/image";
import { Product, StoreConfig, getProductLocalized } from "@/config/stores";
import { useCartStore } from "@/store/cartStore";
import { useTranslation } from "@/i18n/localeStore";
import { ShoppingBag, Sparkles, ZoomIn, Ban } from "lucide-react";

export type ProductViewMode = "grid" | "list";

interface ProductCardProps {
  product: Product;
  store?: StoreConfig;
  isSoldOut?: boolean;
  viewMode?: ProductViewMode;
  onViewImage?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  store,
  isSoldOut = false,
  viewMode = "grid",
  onViewImage,
}) => {
  const { t, locale, getCategory } = useTranslation();
  const localized = getProductLocalized(product, locale);
  const currentStore = useCartStore((state) => state.currentStore);
  const activeStore = store || currentStore;

  const openCheckoutWithProduct = useCartStore(
    (state) => state.openCheckoutWithProduct
  );

  const primaryColor = activeStore?.primaryColor || "#BE185D";
  const currency = activeStore?.currency || "RM";

  const handleBuy = () => {
    if (isSoldOut) return;
    openCheckoutWithProduct(product, activeStore || undefined);
  };

  const handleImageClick = () => {
    if (onViewImage) {
      onViewImage(product);
    }
  };

  // --- Horizontal List Layout (1 in a row) ---
  if (viewMode === "list") {
    return (
      <article
        className={`group relative flex flex-row overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-2.5 sm:p-3.5 shadow-xs transition-all duration-300 ${
          isSoldOut ? "opacity-85" : "hover:shadow-md hover:-translate-y-0.5"
        }`}
      >
        {/* Product Image on Left (Click to view full picture) */}
        <button
          type="button"
          onClick={handleImageClick}
          aria-label={`View full picture of ${localized.name}`}
          className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-stone-100 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ focusRingColor: primaryColor } as React.CSSProperties}
        >
          <Image
            src={product.image}
            alt={localized.name}
            fill
            sizes="112px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            priority={false}
          />

          {/* Sold Out Visual Overlay */}
          {isSoldOut && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-stone-950/65 backdrop-blur-[2px] p-1 text-center">
              <span className="rounded-full bg-rose-600 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-white shadow-md flex items-center gap-0.5">
                <Ban className="h-2.5 w-2.5 stroke-[2.5]" />
                <span>{locale === "zh" ? "已售罄" : "Sold Out"}</span>
              </span>
            </div>
          )}

          {/* Tag / Badge */}
          {!isSoldOut && localized.tag && (
            <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-0.5 rounded-full bg-white/95 px-1.5 py-0.2 text-[9px] font-semibold text-stone-800 shadow-xs backdrop-blur-xs">
              <Sparkles className="h-2.5 w-2.5 text-amber-500" />
              <span>{localized.tag}</span>
            </div>
          )}

          {/* Zoom Hint */}
          {!isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/25">
              <ZoomIn className="h-4 w-4 text-white" />
            </div>
          )}
        </button>

        {/* Product Details on Right */}
        <div className="flex flex-1 flex-col justify-between pl-3 sm:pl-4 min-w-0 py-0.5">
          <div>
            <div className="flex items-start justify-between gap-1.5">
              <h3
                className={`text-sm sm:text-base font-semibold leading-snug tracking-tight truncate ${
                  isSoldOut
                    ? "text-stone-500 line-through decoration-stone-300"
                    : "text-stone-900"
                }`}
              >
                {localized.name}
              </h3>
              {product.category && (
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-medium tracking-wider text-stone-600 uppercase shrink-0">
                  {getCategory(product.category)}
                </span>
              )}
            </div>

            <p className="line-clamp-2 text-[11px] sm:text-xs text-stone-500 mt-1 leading-relaxed">
              {localized.description}
            </p>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-stone-100/80">
            <span
              className={`text-sm sm:text-base font-bold ${
                isSoldOut ? "text-stone-400" : ""
              }`}
              style={!isSoldOut ? { color: primaryColor } : undefined}
            >
              {currency} {product.price.toFixed(2)}
            </span>

            {isSoldOut ? (
              <button
                type="button"
                disabled
                className="flex items-center gap-1 rounded-xl py-1.5 px-3 text-[11px] font-bold bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200/60 shadow-none shrink-0"
              >
                <Ban className="h-3 w-3 text-stone-400" />
                <span>{locale === "zh" ? "今日已售罄" : "Sold Out Today"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBuy}
                aria-label={`${t("orderNow")} ${localized.name}`}
                className="flex items-center gap-1.5 rounded-xl py-1.5 px-3.5 text-xs font-semibold text-white shadow-xs transition-all duration-200 active:scale-98 hover:opacity-95 cursor-pointer shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{t("orderNow")}</span>
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  // --- Vertical Grid Layout (2 in a row) ---
  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xs transition-all duration-300 ${
        isSoldOut ? "opacity-85" : "hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {/* Product Image (Click to view full picture) */}
      <button
        type="button"
        onClick={handleImageClick}
        aria-label={`View full picture of ${localized.name}`}
        className="relative aspect-square sm:aspect-4/3 w-full overflow-hidden bg-stone-100 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ focusRingColor: primaryColor } as React.CSSProperties}
      >
        <Image
          src={product.image}
          alt={localized.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          priority={false}
        />

        {/* Zoom Hint Overlay (hidden if sold out) */}
        {!isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/25 backdrop-blur-[1px]">
            <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-stone-900 shadow-md backdrop-blur-md transition-transform scale-95 group-hover:scale-100">
              <ZoomIn className="h-3 w-3" style={{ color: primaryColor }} />
              <span>{t("viewPhoto")}</span>
            </span>
          </div>
        )}

        {/* Sold Out Visual Overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-stone-950/65 backdrop-blur-[2px] p-2 text-center">
            <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white shadow-md flex items-center gap-1">
              <Ban className="h-3 w-3 stroke-[2.5]" />
              <span>{locale === "zh" ? "今日已售罄" : "Sold Out Today"}</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-white/90 mt-0.5 font-medium">
              {locale === "zh" ? "鲜花供应已满" : "Daily capacity reached"}
            </span>
          </div>
        )}

        {/* Tag / Badge */}
        {!isSoldOut && localized.tag && (
          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-stone-800 shadow-xs backdrop-blur-xs">
            <Sparkles className="h-2.5 w-2.5 text-amber-500" />
            <span>{localized.tag}</span>
          </div>
        )}

        {/* Category Pill */}
        {product.category && (
          <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 rounded-full bg-stone-900/60 px-2 py-0.5 text-[9px] sm:text-[10px] font-medium tracking-wider text-white uppercase backdrop-blur-xs">
            {getCategory(product.category)}
          </div>
        )}
      </button>

      {/* Product Details */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3.5">
        <div className="mb-1">
          <h3
            className={`text-xs sm:text-sm font-semibold leading-snug tracking-tight truncate ${
              isSoldOut
                ? "text-stone-500 line-through decoration-stone-300"
                : "text-stone-900"
            }`}
          >
            {localized.name}
          </h3>
        </div>

        <div className="flex items-baseline justify-between gap-1">
          <span
            className={`text-xs sm:text-sm font-bold ${
              isSoldOut ? "text-stone-400" : ""
            }`}
            style={!isSoldOut ? { color: primaryColor } : undefined}
          >
            {currency} {product.price.toFixed(2)}
          </span>
        </div>

        <p className="line-clamp-1 text-[10px] sm:text-[11px] text-stone-500 leading-relaxed mt-0.5 hidden sm:block">
          {localized.description}
        </p>

        {/* Buy Button */}
        <div className="mt-2.5 sm:mt-3 pt-1 border-t border-stone-100/60">
          {isSoldOut ? (
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-1 rounded-xl py-1.5 sm:py-2 px-1 text-[10px] sm:text-xs font-bold bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200/60 shadow-none"
            >
              <Ban className="h-3 w-3 text-stone-400" />
              <span>{locale === "zh" ? "今日已售罄" : "Sold Out Today"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBuy}
              aria-label={`${t("orderNow")} ${localized.name}`}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-1.5 sm:py-2 px-2 text-xs font-semibold text-white shadow-xs transition-all duration-200 active:scale-98 hover:opacity-95 cursor-pointer"
              style={{
                backgroundColor: primaryColor,
              }}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>{t("orderNow")}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
