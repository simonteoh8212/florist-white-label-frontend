"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Product, StoreConfig } from "@/config/stores";
import { useCartStore } from "@/store/cartStore";
import { ProductCard } from "@/components/ProductCard";
import { CheckoutDrawer } from "@/components/CheckoutDrawer";
import { ProductImageModal } from "@/components/ProductImageModal";
import { StorePolicyModal } from "@/components/StorePolicyModal";
import {
  ArrowUp,
  ArrowUpDown,
  Check,
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

type SortOption = "none" | "price_high_low" | "price_low_high";

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
  const DEFAULT_VISIBLE_COUNT = 6;
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<SortOption>("none");
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number>(DEFAULT_VISIBLE_COUNT);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [showPolicyModal, setShowPolicyModal] = useState<boolean>(false);

  // Listen to window scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Click outside to close sort dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    if (isSortOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSortOpen]);

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

  // Filter products by selected category, instant search query, and sort order
  const filteredProducts = useMemo(() => {
    let list = [...store.products];

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

    if (sortOrder === "price_high_low") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortOrder === "price_low_high") {
      list.sort((a, b) => a.price - b.price);
    }

    return list;
  }, [store.products, selectedCategory, searchQuery, sortOrder]);

  // Reset pagination count whenever category, search query, or sort order changes
  useEffect(() => {
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
  }, [selectedCategory, searchQuery, sortOrder]);

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
      <main className="mx-auto flex min-h-screen max-w-md flex-col bg-white shadow-xl shadow-stone-200/50 sm:rounded-3xl sm:my-6 sm:border sm:border-stone-200/60">
        {/* Top Announcement Bar */}
        <div
          className="flex items-center justify-center gap-1.5 py-2 px-4 text-center text-[11px] font-semibold text-white tracking-wide transition-colors sm:rounded-t-3xl"
          style={{ backgroundColor: store.primaryColor }}
        >
          <Sparkles className="h-3 w-3" />
          <span>Same-Day Delivery & Pickup Available</span>
        </div>

        {/* Brand Header (Sticky at top) */}
        <header className="relative flex h-16 items-center justify-between border-b border-stone-100 bg-white/95 px-4 backdrop-blur-md sticky top-0 z-30">
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

        {/* Instant Search Bar & Sorting (Sticky below header) */}
        <section className="sticky top-16 z-20 bg-white/95 px-4 py-2.5 backdrop-blur-md border-b border-stone-100/90 shadow-2xs transition-all">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
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

            {/* Sorting Dropdown Menu */}
            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => setIsSortOpen((prev) => !prev)}
                className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all cursor-pointer ${
                  sortOrder !== "none"
                    ? "border-stone-400 bg-stone-50 text-stone-900 shadow-2xs"
                    : "border-stone-200/90 bg-white text-stone-500 shadow-2xs hover:border-stone-300 hover:text-stone-800 hover:bg-stone-50"
                }`}
                style={
                  sortOrder !== "none"
                    ? {
                        borderColor: store.primaryColor,
                        color: store.primaryColor,
                        backgroundColor: `${store.primaryColor}12`,
                      }
                    : undefined
                }
                aria-label="Sort options"
                aria-haspopup="true"
                aria-expanded={isSortOpen}
                title="Sort arrangements"
              >
                <ArrowUpDown className="h-4 w-4" />
                {sortOrder !== "none" && (
                  <span
                    className="absolute top-2 right-2 h-2 w-2 rounded-full ring-2 ring-white"
                    style={{ backgroundColor: store.primaryColor }}
                  />
                )}
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-full mt-2 z-40 w-48 rounded-2xl border border-stone-200/90 bg-white p-1.5 shadow-xl shadow-stone-900/10 backdrop-blur-lg animate-in fade-in">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Sort By Price
                  </div>
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSortOrder((prev) =>
                          prev === "price_high_low" ? "none" : "price_high_low"
                        );
                        setIsSortOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                        sortOrder === "price_high_low"
                          ? "bg-stone-100 text-stone-900 font-bold"
                          : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                      }`}
                      style={
                        sortOrder === "price_high_low"
                          ? { color: store.primaryColor }
                          : undefined
                      }
                    >
                      <span>Price: High to Low</span>
                      {sortOrder === "price_high_low" && (
                        <Check
                          className="h-3.5 w-3.5"
                          style={{ color: store.primaryColor }}
                        />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortOrder((prev) =>
                          prev === "price_low_high" ? "none" : "price_low_high"
                        );
                        setIsSortOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                        sortOrder === "price_low_high"
                          ? "bg-stone-100 text-stone-900 font-bold"
                          : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                      }`}
                      style={
                        sortOrder === "price_low_high"
                          ? { color: store.primaryColor }
                          : undefined
                      }
                    >
                      <span>Price: Low to High</span>
                      {sortOrder === "price_low_high" && (
                        <Check
                          className="h-3.5 w-3.5"
                          style={{ color: store.primaryColor }}
                        />
                      )}
                    </button>
                  </div>

                  {sortOrder !== "none" && (
                    <div className="mt-1 border-t border-stone-100 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSortOrder("none");
                          setIsSortOpen(false);
                        }}
                        className="flex w-full items-center justify-center rounded-xl px-3 py-1.5 text-[11px] font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition-colors cursor-pointer"
                      >
                        Reset to default
                      </button>
                    </div>
                  )}
                </div>
              )}
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
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Floral Catalog ({filteredProducts.length})
              </span>
              {searchQuery && (
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                  Search: &ldquo;{searchQuery}&rdquo;
                </span>
              )}
              {sortOrder !== "none" && (
                <button
                  type="button"
                  onClick={() => setSortOrder("none")}
                  className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
                  title="Remove sorting"
                >
                  <span>
                    {sortOrder === "price_high_low"
                      ? "Price: High to Low"
                      : "Price: Low to High"}
                  </span>
                  <X className="h-3 w-3 text-stone-400 hover:text-stone-700" />
                </button>
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
                  setSortOrder("none");
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
        <footer className="flex flex-col gap-1.5 mt-auto border-t border-stone-200/80 bg-stone-50 px-4 py-6 text-center sm:rounded-b-3xl">
          <p className="text-xs font-bold text-stone-800">
            {store.name}
          </p>

          {/* Registered Entity & SSM Number (if configured) */}
          {(store.companyName || store.ssmNumber) && (
            <p className="text-[11px] font-medium text-stone-500">
              {store.companyName}
              {store.companyName && store.ssmNumber ? " • " : ""}
              {store.ssmNumber ? `SSM: ${store.ssmNumber}` : ""}
            </p>
          )}

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

          {/* Store Policy & PDPA Privacy Notice links */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500 pt-0.5">
            <button
              type="button"
              onClick={() => setShowPolicyModal(true)}
              className="hover:text-stone-800 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Store Policy &amp; Terms
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowPolicyModal(true)}
              className="hover:text-stone-800 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Privacy Notice (PDPA)
            </button>
          </div>

          <div className="pt-1 space-y-0.5">
            <p className="text-[10px] text-stone-400">
              Powered by <span className="font-semibold text-stone-500">flowerapp.my</span> • Platform Provider
            </p>
            <p className="text-[9px] text-stone-400 max-w-xs mx-auto leading-tight">
              All orders, payments, fulfillment, and inquiries are handled directly by {store.name}.
            </p>
          </div>
        </footer>

        {/* Scroll to Top Floating Button */}
        <button
          type="button"
          onClick={scrollToTop}
          className={`fixed bottom-6 right-5 sm:right-8 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-stone-200/90 bg-white/95 text-stone-700 shadow-lg shadow-stone-900/10 backdrop-blur-md transition-all duration-300 hover:border-stone-300 hover:text-stone-950 hover:shadow-xl active:scale-90 cursor-pointer ${
            showScrollTop
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
          aria-label="Scroll to top of page"
          title="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>

        {/* Store Policy & Privacy Notice Modal */}
        <StorePolicyModal
          isOpen={showPolicyModal}
          onClose={() => setShowPolicyModal(false)}
          store={store}
        />

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
