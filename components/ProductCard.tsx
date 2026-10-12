"use client";

import React from "react";
import Image from "next/image";
import { Product, floristConfig } from "@/config/florist.config";
import { useCartStore } from "@/store/cartStore";
import { ShoppingBag, Sparkles } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const openCheckoutWithProduct = useCartStore(
    (state) => state.openCheckoutWithProduct
  );

  const handleBuy = () => {
    openCheckoutWithProduct(product);
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      {/* Product Image */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          priority={false}
        />

        {/* Tag / Badge */}
        {product.tag && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-stone-800 shadow-xs backdrop-blur-xs">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>{product.tag}</span>
          </div>
        )}

        {/* Category Pill */}
        {product.category && (
          <div className="absolute top-3 right-3 rounded-full bg-stone-900/60 px-2.5 py-0.5 text-[10px] font-medium tracking-wider text-white uppercase backdrop-blur-xs">
            {product.category}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-stone-900 leading-snug tracking-tight">
            {product.name}
          </h3>
          <span
            className="shrink-0 text-base font-bold"
            style={{ color: floristConfig.brandHexColor }}
          >
            {floristConfig.currency} {product.price.toFixed(2)}
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
              backgroundColor: floristConfig.brandHexColor,
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
