"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { StoreConfig, Product, getProductLocalized } from "@/config/stores";
import { useCartStore } from "@/store/cartStore";
import { useFavourites } from "@/components/FavouritesProvider";
import { useTranslation } from "@/i18n/localeStore";
import { StoreEmergencyStatus } from "@/lib/storeStatus";
import { X } from "lucide-react";

interface FavouritesDrawerProps {
  store: StoreConfig;
  storeStatus?: StoreEmergencyStatus;
}

export const FavouritesDrawer: React.FC<FavouritesDrawerProps> = ({
  store,
  storeStatus,
}) => {
  const { ids, remove, isFavouritesOpen, setIsFavouritesOpen, closeFavourites, showToast } =
    useFavourites();
  const { t, locale, getCategory } = useTranslation();
  const openCheckoutWithProduct = useCartStore(
    (state) => state.openCheckoutWithProduct
  );

  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());

  const primaryColor = store.primaryColor || "#BE185D";
  const currency = store.currency || "RM";

  // Lookup product data from live catalog by id; ignore ids that no longer exist
  const savedProducts = useMemo(() => {
    return ids
      .map((id) => store.products.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [ids, store.products]);

  const totalSavedPrice = useMemo(() => {
    return savedProducts.reduce((sum, p) => sum + p.price, 0);
  }, [savedProducts]);

  // WhatsApp Wishlist Share text & link
  const shareWishlistUrl = useMemo(() => {
    const lines = [
      `My wishlist from ${store.name} 🌸`,
      "",
      ...savedProducts.map(
        (p) => `♥ ${p.name} (${currency} ${p.price.toFixed(2)})`
      ),
    ];
    return `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
  }, [savedProducts, store.name, currency]);

  const isProductSoldOut = (p: Product) => {
    return Boolean(
      p.inStock === false ||
        storeStatus?.outOfStockProductIds?.includes(p.id)
    );
  };

  const handleNotifyMe = (p: Product) => {
    setNotifiedIds((prev) => new Set(prev).add(p.id));
    showToast(
      locale === "zh"
        ? "鲜花到货后我们将通知您 ✓"
        : "We'll notify you when back in stock ✓"
    );
  };

  const handleOrder = (p: Product) => {
    closeFavourites();
    openCheckoutWithProduct(p, store);
  };

  return (
    <Drawer
      open={isFavouritesOpen}
      onOpenChange={setIsFavouritesOpen}
      repositionInputs={false}
    >
      <DrawerContent className="max-w-md mx-auto overflow-hidden bg-[#FAF9F6] border-t border-stone-200 flex flex-col h-[92dvh] max-h-[92dvh]">
        {/* Header */}
        <DrawerHeader className="relative border-b border-stone-200/60 bg-white/70 px-5 pt-3 pb-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="text-base font-semibold text-stone-900 tracking-tight">
                My space
              </DrawerTitle>
              <DrawerDescription className="text-[12px] text-stone-500 mt-0.5">
                Saved bouquets and past orders
              </DrawerDescription>
            </div>
            <button
              type="button"
              onClick={closeFavourites}
              className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-stone-800"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tab Pills */}
          <div className="flex items-center gap-2 pt-2.5">
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border transition-colors"
              style={{
                backgroundColor: `${primaryColor}14`,
                borderColor: `${primaryColor}40`,
                color: primaryColor,
              }}
            >
              <span>♥ Favourites ({savedProducts.length})</span>
            </div>
          </div>
        </DrawerHeader>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3.5 space-y-2.5">
          {savedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-6 space-y-2">
              <span className="text-5xl select-none" aria-hidden="true">
                🤍
              </span>
              <h3 className="text-base font-bold text-stone-900 mt-2">
                No favourites yet
              </h3>
              <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                Tap the heart on any bouquet to save it here for later.
              </p>
              <button
                type="button"
                onClick={closeFavourites}
                className="mt-4 rounded-full px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95 cursor-pointer hover:opacity-95 focus-visible:outline-2 focus-visible:outline-stone-800"
                style={{ backgroundColor: primaryColor }}
              >
                Browse bouquets
              </button>
            </div>
          ) : (
            savedProducts.map((product, idx) => {
              const localized = getProductLocalized(product, locale);
              const soldOut = isProductSoldOut(product);
              const isNotified = notifiedIds.has(product.id);

              return (
                <div
                  key={product.id}
                  className="frow"
                  style={{ "--i": idx } as React.CSSProperties}
                >
                  {/* 56x56 Thumbnail */}
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-100 border border-stone-200/60">
                    <Image
                      src={product.image}
                      alt={localized.name}
                      fill
                      sizes="56px"
                      className={`object-cover ${soldOut ? "grayscale-35 opacity-75" : ""}`}
                    />
                  </div>

                  {/* Info Column */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                      {localized.name}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                      {getCategory(product.category)} |{" "}
                      {soldOut ? (
                        <span className="text-rose-600 font-medium">Sold out</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">In stock</span>
                      )}
                    </p>
                    <p
                      className="text-xs sm:text-sm font-bold mt-1"
                      style={{ color: primaryColor }}
                    >
                      {currency} {product.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Right Action Column */}
                  <div className="fa">
                    {soldOut ? (
                      <button
                        type="button"
                        disabled={isNotified}
                        onClick={() => handleNotifyMe(product)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-stone-800 ${
                          isNotified
                            ? "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed"
                            : "border bg-white text-stone-700 hover:bg-stone-50 active:scale-95 cursor-pointer shadow-2xs"
                        }`}
                        style={
                          !isNotified
                            ? {
                                borderColor: `${primaryColor}60`,
                                color: primaryColor,
                              }
                            : undefined
                        }
                      >
                        {isNotified ? "We'll notify you ✓" : "Notify me"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOrder(product)}
                        className="rounded-full px-4 py-1 text-xs font-bold text-white shadow-xs transition-all active:scale-95 hover:opacity-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-stone-800"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Order
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => remove(product.id)}
                      className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors cursor-pointer py-0.5 focus-visible:outline-1 focus-visible:outline-stone-500"
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {savedProducts.length > 0 && (
          <div
            className="border-t border-stone-200/80 bg-white px-5 py-3 space-y-2 shrink-0"
            style={{
              paddingBottom: "calc(14px + env(safe-area-inset-bottom, 0px))",
            }}
          >
            <p className="text-center text-xs text-stone-500 font-medium">
              {savedProducts.length} saved, {currency} {totalSavedPrice.toFixed(2)} together
            </p>
            <a
              href={shareWishlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1faa59] py-3 px-4 text-sm font-bold text-white shadow-md transition-all active:scale-98 hover:bg-[#1a944d] cursor-pointer no-underline focus-visible:outline-2 focus-visible:outline-stone-800"
            >
              Share wishlist on WhatsApp
            </a>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};
