"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Product, StoreConfig } from "@/config/stores";
import { useCartStore } from "@/store/cartStore";
import { ProductCard } from "@/components/ProductCard";
import { CheckoutDrawer } from "@/components/CheckoutDrawer";
import { ProductImageModal } from "@/components/ProductImageModal";
import {
  ChevronDown,
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from "lucide-react";

interface StorefrontClientProps {
  store: StoreConfig;
}

export const StorefrontClient: React.FC<StorefrontClientProps> = ({ store }) => {
  const syncTenantStore = useCartStore((state) => state.syncTenantStore);
  const openCheckoutWithProduct = useCartStore(
    (state) => state.openCheckoutWithProduct
  );

  // Sync tenant on mount and ensure previous tenant's cart is wiped if different
  useEffect(() => {
    syncTenantStore(store);
  }, [store, syncTenantStore]);
  const DEFAULT_VISIBLE_COUNT = 6
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [visibleCount, setVisibleCount] = useState<number>(DEFAULT_VISIBLE_COUNT);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  const categories = [
    "All",
    ...Array.from(
      new Set(
        store.products
          .map((p) => p.category)
          .filter((c): c is string => Boolean(c))
      )
    ),
  ];

  // Filter products by selected category and instant search query
  const filteredProducts = useMemo(() => {
    let list = store.products;

    if (selectedCategory !== "All") {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        const catMatch = p.category?.toLowerCase().includes(q);
        const tagMatch = p.tag?.toLowerCase().includes(q);
        return nameMatch || descMatch || catMatch || tagMatch;
      });
    }

    return list;
  }, [store.products, selectedCategory, searchQuery]);

  // Reset pagination count whenever category or search query changes
  useEffect(() => {
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
  }, [selectedCategory, searchQuery]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const hasMore = visibleCount < filteredProducts.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + DEFAULT_VISIBLE_COUNT);
  };

  // Format clean numbers for link and display
  const digitsOnly = store.whatsapp.replace(/\D/g, "");
  const cleanWhatsappNumber = digitsOnly.startsWith("0")
    ? `6${digitsOnly}`
    : digitsOnly.startsWith("60")
      ? digitsOnly
      : `60${digitsOnly}`;

  // Display version strips +6 or 6 prefix (e.g. "+6012-542 0555" -> "012-542 0555")
  const displayWhatsappNumber = store.whatsapp.replace(/^\+?6/, "");

  const generalInquiryUrl = `https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(
    `Hello ${store.name}! I have a quick question regarding your arrangements.`
  )}`;

  // Google Maps redirection URL
  const mapsUrl =
    store.googleMapsUrl ||
    (store.pickupAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${store.name} ${store.pickupAddress}`
        )}`
      : "#");

  const currency = store.currency || "RM";

  return (
    <div
      className="min-h-screen bg-[#faf8f5] text-stone-900"
      style={
        {
          "--brand-color": store.primaryColor,
        } as React.CSSProperties
      }
    >
      {/* Mobile-first centered container */}
      <main className="mx-auto flex min-h-screen max-w-md flex-col bg-white shadow-xl shadow-stone-200/50 sm:rounded-3xl sm:my-6 sm:overflow-hidden sm:border sm:border-stone-200/60">
        {/* Top Announcement Bar */}
        <div
          className="flex items-center justify-center gap-1.5 py-2 px-4 text-center text-[11px] font-semibold text-white tracking-wide transition-colors"
          style={{ backgroundColor: store.primaryColor }}
        >
          <Sparkles className="h-3 w-3" />
          <span>Same-Day Delivery & Pickup Available</span>
        </div>

        {/* Brand Header */}
        <header className="relative flex items-center justify-between border-b border-stone-100 bg-white/80 px-4 py-3.5 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-stone-200 bg-stone-100 shadow-2xs">
              <Image
                src={store.logo}
                alt={`${store.name} Logo`}
                fill
                sizes="40px"
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-stone-900 leading-tight">
                {store.name}
              </h1>
              <p className="text-[11px] font-medium text-stone-500">
                {store.tagline || "Curated Artisanal Blooms"}
              </p>
            </div>
          </div>

          <a
            href={generalInquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200/80 transition-all active:scale-95 hover:bg-emerald-100"
            aria-label={`Chat with ${store.name} on WhatsApp`}
          >
            <MessageCircle className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
            <span>Chat</span>
          </a>
        </header>

        {/* Hero Banner / Studio Introduction */}
        <section className="relative px-4 pt-4 pb-2">
          <div className="rounded-2xl bg-gradient-to-br from-stone-50 via-white to-stone-50 p-4 border border-stone-200/60 shadow-2xs">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              <Heart
                className="h-3 w-3"
                style={{ color: store.primaryColor, fill: store.primaryColor }}
              />
              <span>Artisanal Collection</span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-stone-900 tracking-tight leading-snug">
              {store.tagline || "Curated Blooms For Life’s Most Beautiful Moments"}
            </h2>
            <p className="mt-1 text-xs text-stone-600 leading-relaxed">
              Order your floral arrangement, specify fulfillment details, and complete your order seamlessly with Touch &apos;n Go payment proof.
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
                  Selected Slots
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

        {/* Instant Search Bar */}
        <section className="px-4 pt-2.5 pb-1">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flowers, bouquets, balloons, roses..."
              className="w-full rounded-2xl border border-stone-200/90 bg-white py-2.5 pl-10 pr-9 text-xs text-stone-900 shadow-2xs placeholder:text-stone-400 focus:border-stone-400 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
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
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${isActive
                      ? "text-white shadow-2xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200/80"
                    }`}
                  style={
                    isActive
                      ? { backgroundColor: store.primaryColor }
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Floral Catalog ({filteredProducts.length})
              </span>
              {searchQuery && (
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                  Search: &ldquo;{searchQuery}&rdquo;
                </span>
              )}
            </div>
            <span className="text-[11px] text-stone-500">
              Prices in {currency}
            </span>
          </div>

          {/* Empty Search State */}
          {displayedProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 p-8 text-center my-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-stone-900">
                No arrangements found
              </h3>
              <p className="mt-1 text-xs text-stone-500 max-w-xs mx-auto">
                We couldn&apos;t find any flowers matching &ldquo;{searchQuery}&rdquo;. Try another keyword or browse our categories.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition-all cursor-pointer"
              >
                Clear Search &amp; Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  store={store}
                  onViewImage={(p) => setPreviewProduct(p)}
                />
              ))}
            </div>
          )}

          {/* Progressive "Show More" Button for Large Catalogs */}
          {hasMore && (
            <div className="mt-6 flex flex-col items-center gap-2 pb-2">
              <button
                type="button"
                onClick={handleLoadMore}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-3 text-xs font-bold text-stone-800 shadow-xs transition-all hover:border-stone-300 hover:bg-stone-50 hover:shadow-sm active:scale-98 cursor-pointer"
              >
                <span>Show More Arrangements</span>
                <ChevronDown className="h-4 w-4 text-stone-500" />
              </button>
              <span className="text-[11px] text-stone-400">
                Showing {displayedProducts.length} of {filteredProducts.length} items
              </span>
            </div>
          )}
        </section>

        {/* Store Pickup Notice (Click to open Google Maps) */}
        {store.pickupAddress && (
          <section className="mx-4 my-3">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open Google Maps for ${store.name} Atelier Pickup`}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-stone-200/80 bg-stone-50/80 p-3.5 text-xs transition-all duration-200 hover:border-stone-300 hover:bg-stone-100/90 hover:shadow-2xs active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-2xs border border-stone-200/60 transition-transform group-hover:scale-105">
                  <MapPin
                    className="h-4 w-4"
                    style={{ color: store.primaryColor }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-bold text-stone-900 group-hover:text-stone-950">
                      {store.name} Atelier Pickup
                    </p>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                      Google Maps ↗
                    </span>
                  </div>
                  <p className="mt-0.5 text-stone-600 leading-relaxed text-[11px] group-hover:text-stone-700">
                    {store.pickupAddress}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-stone-400 group-hover:text-stone-700 transition-colors pl-1">
                <ExternalLink className="h-4 w-4" />
              </div>
            </a>
          </section>
        )}

        {/* Tenant Footer */}
        <footer className="flex flex-col gap-1  mt-auto border-t border-stone-200/80 bg-stone-50 px-4 py-6 text-center">
          <p className="text-xs font-bold text-stone-800">
            {store.name}
          </p>

          <div className="flex items-center justify-center gap-4 text-xs font-medium text-stone-600">
            <a
              href={generalInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-stone-900"
            >
              <Phone className="h-3 w-3" />
              <span>{displayWhatsappNumber}</span>
            </a>
          </div>
          <p className="text-[11px] text-stone-500">
            Powered by flowerapp.my
          </p>
        </footer>

        {/* Full Picture Modal Lightbox */}
        <ProductImageModal
          isOpen={Boolean(previewProduct)}
          product={previewProduct}
          store={store}
          onClose={() => setPreviewProduct(null)}
          onOrderNow={(product) => openCheckoutWithProduct(product, store)}
        />

        {/* Root Level Mounted Checkout Drawer for this Store */}
        <CheckoutDrawer store={store} />
      </main>
    </div>
  );
};
