"use client";

import React, { useState } from "react";
import Image from "next/image";
import { floristConfig } from "@/config/florist.config";
import { ProductCard } from "@/components/ProductCard";
import { CheckoutDrawer } from "@/components/CheckoutDrawer";
import {
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    "All",
    ...Array.from(
      new Set(
        floristConfig.products
          .map((p) => p.category)
          .filter((c): c is string => Boolean(c))
      )
    ),
  ];

  const filteredProducts =
    selectedCategory === "All"
      ? floristConfig.products
      : floristConfig.products.filter((p) => p.category === selectedCategory);

  const cleanWhatsappNumber = floristConfig.whatsappNumber.replace(/\D/g, "");
  const generalInquiryUrl = `https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(
    `Hello ${floristConfig.storeName}! I have a quick question about your floral arrangements.`
  )}`;

  return (
    <div
      className="min-h-screen bg-[#faf8f5] text-stone-900"
      style={
        {
          "--brand-color": floristConfig.brandHexColor,
        } as React.CSSProperties
      }
    >
      {/* Mobile-first centered container */}
      <main className="mx-auto flex min-h-screen max-w-md flex-col bg-white shadow-xl shadow-stone-200/50 sm:rounded-3xl sm:my-6 sm:overflow-hidden sm:border sm:border-stone-200/60">
        {/* Top Announcement Bar */}
        <div
          className="flex items-center justify-center gap-1.5 py-2 px-4 text-center text-[11px] font-semibold text-white tracking-wide"
          style={{ backgroundColor: floristConfig.brandHexColor }}
        >
          <Sparkles className="h-3 w-3" />
          <span>Same-Day Delivery & Pickup Available Today</span>
        </div>

        {/* Brand Header */}
        <header className="relative flex items-center justify-between border-b border-stone-100 bg-white/80 px-4 py-3.5 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-stone-200 bg-stone-100 shadow-2xs">
              <Image
                src={floristConfig.logoUrl}
                alt={`${floristConfig.storeName} Logo`}
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-stone-900 leading-tight">
                {floristConfig.storeName}
              </h1>
              <p className="text-[11px] font-medium text-stone-500">
                {floristConfig.tagline}
              </p>
            </div>
          </div>

          <a
            href={generalInquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200/80 transition-all active:scale-95 hover:bg-emerald-100"
            aria-label="Chat on WhatsApp"
          >
            <MessageCircle className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
            <span>Chat</span>
          </a>
        </header>

        {/* Hero Banner / Studio Introduction */}
        <section className="relative px-4 pt-4 pb-2">
          <div className="rounded-2xl bg-gradient-to-br from-rose-50/70 via-stone-50 to-amber-50/50 p-4 border border-stone-200/60">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
              <span>Boutique Floral Collections</span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-stone-900 tracking-tight leading-snug">
              Curated Blooms For Life’s Most Beautiful Moments
            </h2>
            <p className="mt-1 text-xs text-stone-600 leading-relaxed">
              Select your arrangement, choose delivery or store pickup, and complete your order with Touch &apos;n Go instant payment verification.
            </p>

            {/* Micro Perks Strip */}
            <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-stone-200/60 pt-3 text-center">
              <div className="flex flex-col items-center gap-1">
                <Truck className="h-4 w-4 text-stone-700" />
                <span className="text-[10px] font-medium text-stone-600 leading-tight">
                  Doorstep Delivery
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Clock className="h-4 w-4 text-stone-700" />
                <span className="text-[10px] font-medium text-stone-600 leading-tight">
                  Scheduled Slots
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-[10px] font-medium text-stone-600 leading-tight">
                  TNG eWallet Proof
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Category Filter Pills */}
        <section className="px-4 py-2">
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "text-white shadow-2xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200/80"
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: floristConfig.brandHexColor }
                      : undefined
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* Catalog Grid */}
        <section className="flex-1 px-4 py-2">
          <div className="flex items-center justify-between pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Floral Catalog ({filteredProducts.length})
            </span>
            <span className="text-[11px] text-stone-500">
              Prices in {floristConfig.currency}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Store Pickup Notice */}
        {floristConfig.pickupAddress && (
          <section className="mx-4 my-3 rounded-2xl border border-stone-200/80 bg-stone-50/80 p-3.5 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 shrink-0 text-stone-700 mt-0.5" />
              <div>
                <p className="font-bold text-stone-900">Boutique Atelier Pickup</p>
                <p className="mt-0.5 text-stone-600 leading-relaxed text-[11px]">
                  {floristConfig.pickupAddress}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-auto border-t border-stone-200/80 bg-stone-50 px-4 py-6 text-center">
          <p className="text-xs font-bold text-stone-800">
            {floristConfig.storeName}
          </p>
          <p className="mt-1 text-[11px] text-stone-500">
            White-Label Mobile Catalog Template • WhatsApp & TNG Bridge
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs font-medium text-stone-600">
            <a
              href={generalInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-stone-900"
            >
              <Phone className="h-3 w-3" />
              <span>+{cleanWhatsappNumber}</span>
            </a>
          </div>
        </footer>

        {/* Root Level Mounted Checkout Drawer */}
        <CheckoutDrawer />
      </main>
    </div>
  );
}
