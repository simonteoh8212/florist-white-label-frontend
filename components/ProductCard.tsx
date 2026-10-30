"use client";

import React from "react";
import Image from "next/image";
import { Product, StoreConfig, getProductLocalized } from "@/config/stores";
import { useCartStore } from "@/store/cartStore";
import { useTranslation } from "@/i18n/localeStore";
import { ShoppingBag, Sparkles, ZoomIn, Ban, Heart } from "lucide-react";
import { useFavourites } from "@/components/FavouritesProvider";

function BagPlusIcon({ className = "h-4.5 w-4.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 7V6a4 4 0 0 1 8 0v1" />
      <rect x="4" y="7" width="16" height="14" rx="2.5" />
      <path d="M12 11v6" />
      <path d="M9 14h6" />
    </svg>
  );
}

export type ProductViewMode = "grid" | "list";

interface ProductCardProps {
  product: Product;
  store?: StoreConfig;
  isSoldOut?: boolean;
  viewMode?: ProductViewMode;
  onViewImage?: (product: Product) => void;
  cardIndex?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  store,
  isSoldOut = false,
  viewMode = "grid",
  onViewImage,
  cardIndex = 0,
}) => {
  const { t, locale, getCategory } = useTranslation();
  const localized = getProductLocalized(product, locale);
  const currentStore = useCartStore((state) => state.currentStore);
  const activeStore = store || currentStore;

  const openCheckoutWithProduct = useCartStore(
    (state) => state.openCheckoutWithProduct
  );

  const { has, toggle } = useFavourites();
  const isSaved = has(product.id);

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
        style={{ "--i": cardIndex } as React.CSSProperties}
        className={`catalog-stagger-card group relative flex flex-row overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-2.5 sm:p-3.5 shadow-xs transition-all duration-300 ${
          isSoldOut ? "opacity-85" : "hover:shadow-md hover:-translate-y-0.5"
        }`}
      >
        {/* Product Image on Left (Click to view full picture) */}
        <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-stone-100">
          <button
            type="button"
            onClick={handleImageClick}
            aria-label={`View full picture of ${localized.name}`}
            className="absolute inset-0 w-full h-full text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2"
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

          {/* 32px Heart Button in Bottom-Right Corner */}
          <button
            type="button"
            className={`heart ${isSaved ? "on" : ""}`}
            aria-pressed={isSaved}
            aria-label={isSaved ? "Remove from favourites" : "Save to favourites"}
            onClick={(e) => {
              e.stopPropagation();
              navigator.vibrate?.(10);
              toggle(product.id);
            }}
          >
            <Heart className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} strokeWidth={2} />
          </button>
        </div>

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
  const badge = localized.tag || (product as any).badge;

  return (
    <article
      style={
        {
          "--i": cardIndex,
          "--brand": primaryColor,
        } as React.CSSProperties
      }
      className="catalog-stagger-card card cursor-pointer"
      onClick={handleBuy}
    >
      {/* Photo as an inset rounded tile */}
      <div
        className="ph"
        onClick={(e) => {
          e.stopPropagation();
          handleImageClick();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleImageClick();
          }
        }}
        aria-label={`View photo of ${localized.name}`}
      >
        <Image
          src={product.image}
          alt={localized.name}
          fill
          sizes="(max-width: 480px) 50vw, 240px"
          className="img"
          priority={false}
        />

        {/* Badge as a small solid pill, e.g. ✦ Best Seller */}
        {badge && <span className="tag">✦ {badge}</span>}

        {/* 32px Round Favourite (Heart) Button */}
        <button
          type="button"
          className={`heart ${isSaved ? "on" : ""}`}
          aria-pressed={isSaved}
          aria-label={isSaved ? "Remove from favourites" : "Save to favourites"}
          onClick={(e) => {
            e.stopPropagation();
            navigator.vibrate?.(10);
            toggle(product.id);
          }}
        >
          <Heart className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} strokeWidth={2} />
        </button>
      </div>

      {/* Name - Bold 800, 14px, line-clamp 2 */}
      <h3>{localized.name}</h3>

      {/* Footer Row - pinned to bottom */}
      <div className="ft">
        <b className="price">
          {currency} {product.price.toFixed(2)}
        </b>
        <button
          type="button"
          className="btn"
          disabled={isSoldOut}
          onClick={(e) => {
            e.stopPropagation();
            handleBuy();
          }}
          aria-label={
            isSoldOut
              ? `${locale === "zh" ? "已售罄" : "Sold out"} - ${localized.name}`
              : `${t("orderNow")} - ${localized.name}`
          }
          title={isSoldOut ? (locale === "zh" ? "已售罄" : "Sold out") : t("orderNow")}
        >
          {isSoldOut ? (
            <Ban className="h-4 w-4" />
          ) : (
            <BagPlusIcon className="h-4.5 w-4.5" />
          )}
        </button>
      </div>
    </article>
  );
};
