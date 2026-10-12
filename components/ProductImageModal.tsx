"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { X, ShoppingBag, Sparkles, ZoomIn } from "lucide-react";
import { Product, StoreConfig } from "@/config/stores";

interface ProductImageModalProps {
  product: Product | null;
  store?: StoreConfig;
  isOpen: boolean;
  onClose: () => void;
  onOrderNow?: (product: Product) => void;
}

export const ProductImageModal: React.FC<ProductImageModalProps> = ({
  product,
  store,
  isOpen,
  onClose,
  onOrderNow,
}) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Lock body scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const primaryColor = store?.primaryColor || "#BE185D";
  const currency = store?.currency || "RM";

  const handleOrder = () => {
    onClose();
    if (onOrderNow) {
      onOrderNow(product);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        className="relative flex flex-col w-full max-w-xl max-h-[92vh] overflow-hidden rounded-3xl bg-stone-900/95 border border-white/15 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close full picture"
          className="absolute top-3.5 right-3.5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white/90 border border-white/20 backdrop-blur-md transition-all hover:bg-black/80 hover:text-white hover:scale-105 active:scale-95 cursor-pointer shadow-md"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Full Image Container */}
        <div className="relative flex-1 min-h-[300px] max-h-[62vh] sm:max-h-[68vh] w-full bg-stone-950/70 flex items-center justify-center overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 680px"
            className="object-contain p-1 sm:p-2 select-none"
            priority
          />

          {/* Floating Badges */}
          <div className="absolute top-3.5 left-3.5 z-10 flex flex-wrap gap-2">
            {product.tag && (
              <span className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white border border-white/15 backdrop-blur-md shadow-xs">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>{product.tag}</span>
              </span>
            )}
            {product.category && (
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white border border-white/10 backdrop-blur-md">
                {product.category}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Details & Action Bar */}
        <div className="flex flex-col gap-3.5 border-t border-white/10 bg-stone-900/95 p-4 sm:p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3
                id="modal-product-title"
                className="text-base sm:text-lg font-bold tracking-tight text-white leading-snug truncate"
              >
                {product.name}
              </h3>
              <p className="mt-1 text-xs text-stone-300 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span
                className="text-base sm:text-lg font-extrabold block"
                style={{ color: primaryColor }}
              >
                {currency} {product.price.toFixed(2)}
              </span>
              <span className="text-[10px] text-stone-400 font-medium">Fresh Arrangement</span>
            </div>
          </div>

          {/* Direct Order Now Action */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleOrder}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-200 hover:opacity-95 active:scale-98 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Order Now • {currency} {product.price.toFixed(2)}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 bg-white/5 py-3 px-4 text-xs sm:text-sm font-semibold text-stone-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
