"use client";

import React from "react";
import Image from "next/image";
import { Product, StoreConfig } from "@/config/stores";
import { useCartStore } from "@/store/cartStore";
import { ShoppingBag, Sparkles, ZoomIn } from "lucide-react";

interface ProductCardProps {
  product: Product;
  store?: StoreConfig;
  onViewImage?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  store,
  onViewImage,
}) => {
  const currentStore = useCartStore((state) => state.currentStore);
  const activeStore = store || currentStore;

  const openCheckoutWithProduct = useCartStore(
    (state) => state.openCheckoutWithProduct
  );

  const primaryColor = activeStore?.primaryColor || "#BE185D";
  const currency = activeStore?.currency || "RM";

  const handleBuy = () => {
    openCheckoutWithProduct(product, activeStore || undefined);
  };

  const handleImageClick = () => {
    if (onViewImage) {
      onViewImage(product);
    }
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      {/* Product Image (Click to view full picture) */}
      <button
        type="button"
        onClick={handleImageClick}
        aria-label={`View full picture of ${product.name}`}
        className="relative aspect-4/3 w-full overflow-hidden bg-stone-100 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ focusRingColor: primaryColor } as React.CSSProperties}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          priority={false}
        />

        {/* Zoom Hint Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/25 backdrop-blur-[1px]">
          <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-stone-900 shadow-md backdrop-blur-md transition-transform scale-95 group-hover:scale-100">
            <ZoomIn className="h-3.5 w-3.5" style={{ color: primaryColor }} />
            <span>View Full Photo</span>
          </span>
        </div>

        {/* Tag / Badge */}
        {product.tag && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-stone-800 shadow-xs backdrop-blur-xs">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>{product.tag}</span>
          </div>
        )}

        {/* Category Pill */}
        {product.category && (
          <div className="absolute top-3 right-3 z-10 rounded-full bg-stone-900/60 px-2.5 py-0.5 text-[10px] font-medium tracking-wider text-white uppercase backdrop-blur-xs">
            {product.category}
          </div>
        )}
      </button>

      {/* Product Details */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-stone-900 leading-snug tracking-tight">
            {product.name}
          </h3>
          <span
            className="shrink-0 text-base font-bold"
            style={{ color: primaryColor }}
          >
            {currency} {product.price.toFixed(2)}
          </span>
        </div>

        <p className="line-clamp-2 text-xs text-stone-500 leading-relaxed">
          {product.description}
        </p>

        {/* Buy Button */}
        <div className="mt-4 pt-2">
          <button
            type="button"
            onClick={handleBuy}
            aria-label={`Buy ${product.name}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-semibold text-white shadow-xs transition-all duration-200 active:scale-98 hover:opacity-95 cursor-pointer"
            style={{
              backgroundColor: primaryColor,
            }}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Order Now</span>
          </button>
        </div>
      </div>
    </article>
  );
};
