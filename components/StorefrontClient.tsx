"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product, StoreConfig } from "@/config/stores";
import { useCartStore } from "@/store/cartStore";
import { ProductCard, ProductViewMode } from "@/components/ProductCard";
import { CheckoutDrawer } from "@/components/CheckoutDrawer";
import { ProductImageModal } from "@/components/ProductImageModal";
import { StorePolicyModal } from "@/components/StorePolicyModal";
import { StorePausedAnnouncementModal } from "@/components/StorePausedAnnouncementModal";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "@/i18n/localeStore";
import {
  AlertCircle,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  Heart,
  LayoutGrid,
  List,
  Lock,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { StoreEmergencyStatus } from "@/lib/storeStatus";

type SortOption = "none" | "price_high_low" | "price_low_high";

interface StorefrontClientProps {
  store: StoreConfig;
  initialStatus?: StoreEmergencyStatus;
}

export const StorefrontClient: React.FC<StorefrontClientProps> = ({
  store,
  initialStatus,
}) => {
  const { t, locale, getCategory } = useTranslation();
  const syncTenantStore = useCartStore((state) => state.syncTenantStore);
  const openCheckoutWithProduct = useCartStore(
    (state) => state.openCheckoutWithProduct
  );
  const isCheckoutDrawerOpen = useCartStore(
    (state) => state.isCheckoutDrawerOpen
  );

  // Store Emergency & Capacity Status
  const [storeStatus, setStoreStatus] = useState<StoreEmergencyStatus | undefined>(
    initialStatus
  );

  useEffect(() => {
    if (initialStatus) {
      setStoreStatus(initialStatus);
    }
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/store/status?slug=${encodeURIComponent(store.slug)}`);
        const data = await res.json();
        if (res.ok && data.success && data.status) {
          setStoreStatus(data.status);
        }
      } catch (e) {
        console.warn("Failed to fetch store status:", e);
      }
    };
    fetchStatus();
  }, [store.slug, initialStatus]);

  // Synchronize storefront products when checkout drawer closes
  const prevDrawerOpenRef = useRef(isCheckoutDrawerOpen);
  useEffect(() => {
    if (prevDrawerOpenRef.current && !isCheckoutDrawerOpen && store.slug) {
      fetch(`/api/store/status?slug=${encodeURIComponent(store.slug)}&t=${Date.now()}`, {
        cache: "no-store",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.status) {
            setStoreStatus(data.status);
          }
        })
        .catch((e) => console.warn("Failed to refresh status on drawer close:", e));
    }
    prevDrawerOpenRef.current = isCheckoutDrawerOpen;
  }, [isCheckoutDrawerOpen, store.slug]);

  // Dynamic staff orders link based on current domain:
  // If on subdomain (autarix.flowerapp.my or autarix.localhost), "/orders" goes to the order book.
  // If on bare localhost (localhost:3000/store/autarix), "/store/autarix/orders" goes to the order book.
  const [ordersHref, setOrdersHref] = useState(`/store/${store.slug}/orders`);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSubdomain =
        window.location.host.startsWith(`${store.slug}.`) ||
        !window.location.pathname.startsWith(`/store/${store.slug}`);
      if (isSubdomain) {
        setOrdersHref("/orders");
      }
    }
  }, [store.slug]);

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
  const [viewMode, setViewMode] = useState<ProductViewMode>("grid");
  const [hideSoldOut, setHideSoldOut] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("florist_catalog_view");
      if (saved === "grid" || saved === "list") {
        setViewMode(saved);
      }
      const savedHideSoldOut = localStorage.getItem("florist_hide_sold_out");
      if (savedHideSoldOut === "true") {
        setHideSoldOut(true);
      }
    } catch {}
  }, []);

  const handleToggleViewMode = (mode: ProductViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("florist_catalog_view", mode);
    } catch {}
  };

  const handleToggleHideSoldOut = () => {
    setHideSoldOut((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("florist_hide_sold_out", String(next));
      } catch {}
      return next;
    });
  };

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
        const nameMatch =
          p.name.toLowerCase().includes(q) ||
          Boolean(p.nameZh?.toLowerCase().includes(q));
        const descMatch =
          p.description?.toLowerCase().includes(q) ||
          Boolean(p.descriptionZh?.toLowerCase().includes(q));
        const catMatch = p.category?.toLowerCase().includes(q);
        const tagMatch =
          p.tag?.toLowerCase().includes(q) ||
          Boolean(p.tagZh?.toLowerCase().includes(q));
        return nameMatch || descMatch || catMatch || tagMatch;
      });
    }

    if (sortOrder === "price_high_low") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortOrder === "price_low_high") {
      list.sort((a, b) => a.price - b.price);
    }

    if (hideSoldOut) {
      list = list.filter((p) => {
        const isSoldOut = Boolean(
          p.inStock === false ||
          storeStatus?.outOfStockProductIds?.includes(p.id)
        );
        return !isSoldOut;
      });
    }

    return list;
  }, [store.products, selectedCategory, searchQuery, sortOrder, hideSoldOut, storeStatus?.outOfStockProductIds]);

  // Reset pagination count whenever category, search query, sort order, or hideSoldOut changes
  useEffect(() => {
    setVisibleCount(DEFAULT_VISIBLE_COUNT);
  }, [selectedCategory, searchQuery, sortOrder, hideSoldOut]);

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

  const generalInquiryUrl = `https://api.whatsapp.com/send?phone=${cleanWhatsappNumber}&text=${encodeURIComponent(
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
        {/* Top Announcement Bar / Emergency Banner */}
        {storeStatus?.emergencyNotice ? (
          <div className="flex items-center justify-center gap-1.5 py-2.5 px-4 text-center text-xs font-bold text-amber-950 bg-amber-100 border-b border-amber-300 sm:rounded-t-3xl shadow-xs">
            <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
            <span>{storeStatus.emergencyNotice}</span>
          </div>
        ) : storeStatus?.isTodayPaused ? (
          <div className="flex items-center justify-center gap-1.5 py-2.5 px-4 text-center text-xs font-bold text-rose-950 bg-rose-100 border-b border-rose-300 sm:rounded-t-3xl shadow-xs">
            <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />
            <span>Notice: Same-day deliveries for today are paused. Accepting deliveries for tomorrow onwards!</span>
          </div>
        ) : (
          <div
            className="flex items-center justify-center gap-1.5 py-2 px-4 text-center text-[11px] font-semibold text-white tracking-wide transition-colors sm:rounded-t-3xl"
            style={{ backgroundColor: store.primaryColor }}
          >
            <Sparkles className="h-3 w-3" />
            <span>{t("announcement")}</span>
          </div>
        )}

        {/* Brand Header (Sticky at top) */}
        <header className="relative flex h-16 items-center justify-between border-b border-stone-100 bg-white/95 px-3.5 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-stone-200 bg-stone-100 shadow-2xs">
              <Image
                src={store.logo}
                alt={`${store.name} Logo`}
                fill
                sizes="40px"
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-stone-900 leading-tight truncate">
                {store.name}
              </h1>
              <p className="text-[10px] sm:text-[11px] font-medium text-stone-500 truncate">
                {store.tagline || t("heroSubtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {store.enableLanguageSelector !== false && (
              <LanguageSelector primaryColor={store.primaryColor} />
            )}
            <a
              href={generalInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/80 transition-all active:scale-95 hover:bg-emerald-100 whitespace-nowrap shrink-0 shadow-2xs"
              aria-label={t("chatAria", { store: store.name })}
            >
              <Image
                src="/icons/whatsapp.svg"
                alt="WhatsApp"
                width={14}
                height={14}
                className="h-3.5 w-3.5 shrink-0"
                unoptimized
              />
              <span className="whitespace-nowrap">{t("chat")}</span>
            </a>
          </div>
        </header>

        {/* Hero Banner / Studio Introduction (Controlled by store.showHeroBanner, defaults to true) */}
        {store.showHeroBanner !== false && (
          <section className="relative px-4 pt-4 pb-2">
            <div className="rounded-2xl bg-gradient-to-br from-stone-50 via-white to-stone-50 p-4 border border-stone-200/60 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                <Heart
                  className="h-3 w-3"
                  style={{ color: store.primaryColor, fill: store.primaryColor }}
                />
                <span>{t("artisanalCollection")}</span>
              </div>
              <h2 className="mt-1 text-lg font-bold text-stone-900 tracking-tight leading-snug">
                {store.tagline || t("heroSubtitle")}
              </h2>
              <p className="mt-1 text-xs text-stone-600 leading-relaxed">
                {t("heroDesc")}
              </p>

              {/* Micro Perks Strip */}
              <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-stone-200/60 pt-3 text-center">
                <div className="flex flex-col items-center gap-1">
                  <Truck className="h-4 w-4 text-stone-700" />
                  <span className="text-[10px] font-medium text-stone-600 leading-tight">
                    {t("doorstepDelivery")}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Clock className="h-4 w-4 text-stone-700" />
                  <span className="text-[10px] font-medium text-stone-600 leading-tight">
                    {t("selectedSlots")}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-[10px] font-medium text-stone-600 leading-tight">
                    {t("tngProof")}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Instant Search Bar & Sorting (Sticky below header) */}
        <section className="sticky top-16 z-20 bg-white/95 px-4 py-2.5 backdrop-blur-md border-b border-stone-100/90 shadow-2xs transition-all">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-2xl border border-stone-200/90 bg-white py-2.5 pl-10 pr-9 text-xs text-stone-900 shadow-2xs placeholder:text-stone-400 focus:border-stone-400 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
                  aria-label={t("clearSearch")}
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
                aria-label={t("sortByPrice")}
                aria-haspopup="true"
                aria-expanded={isSortOpen}
                title={t("sortByPrice")}
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
                    {t("sortByPrice")}
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
                      <span>{t("priceHighLow")}</span>
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
                      <span>{t("priceLowHigh")}</span>
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
                        {t("resetDefault")}
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
                  {cat === "All" ? t("allCategories") : getCategory(cat)}
                </button>
              );
            })}
          </div>
        </section>

        {/* Catalog Grid */}
        <section id="catalog-section" className="flex-1 px-4 py-2">
          <div className="flex items-center justify-between pb-2.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                {t("floralCatalog")} ({filteredProducts.length})
              </span>
              {searchQuery && (
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                  {t("searchBadge")}: &ldquo;{searchQuery}&rdquo;
                </span>
              )}
              {sortOrder !== "none" && (
                <button
                  type="button"
                  onClick={() => setSortOrder("none")}
                  className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
                  title={t("removeSorting")}
                >
                  <span>
                    {sortOrder === "price_high_low"
                      ? t("priceHighLow")
                      : t("priceLowHigh")}
                  </span>
                  <X className="h-3 w-3 text-stone-400 hover:text-stone-700" />
                </button>
              )}
              {hideSoldOut && (
                <button
                  type="button"
                  onClick={handleToggleHideSoldOut}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/90 px-2 py-0.5 text-[10px] font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                  title={t("hideSoldOut")}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>{t("inStockOnly")}</span>
                  <X className="h-3 w-3 text-emerald-600 hover:text-emerald-900" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* In-Stock Only Filter Toggle */}
              <button
                type="button"
                onClick={handleToggleHideSoldOut}
                aria-pressed={hideSoldOut}
                title={hideSoldOut ? t("hideSoldOut") : t("inStockOnly")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer border ${
                  hideSoldOut
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs font-bold"
                    : "bg-white text-stone-600 border-stone-200/80 hover:bg-stone-50 hover:border-stone-300"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full transition-colors ${
                    hideSoldOut
                      ? "bg-emerald-500 ring-2 ring-emerald-200"
                      : "bg-stone-300"
                  }`}
                />
                <span className="whitespace-nowrap">{t("inStockOnly")}</span>
              </button>
              <span className="text-[11px] text-stone-500 hidden xs:inline">
                {t("pricesIn")} {currency}
              </span>

              {/* View Mode Toggle: Grid (2 in a row) vs List (1 in a row) */}
              <div className="flex items-center rounded-xl bg-stone-100 p-0.5 border border-stone-200/60 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleToggleViewMode("grid")}
                  aria-label={t("viewGrid")}
                  title={`${t("viewGrid")} (2 per row)`}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-stone-900 shadow-2xs font-bold"
                      : "text-stone-400 hover:text-stone-700"
                  }`}
                  style={viewMode === "grid" ? { color: store.primaryColor } : undefined}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t("viewGrid")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleViewMode("list")}
                  aria-label={t("viewList")}
                  title={t("viewList")}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                    viewMode === "list"
                      ? "bg-white text-stone-900 shadow-2xs font-bold"
                      : "text-stone-400 hover:text-stone-700"
                  }`}
                  style={viewMode === "list" ? { color: store.primaryColor } : undefined}
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t("viewList")}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Empty Search State */}
          {displayedProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 p-8 text-center my-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-stone-900">
                {t("noArrangements")}
              </h3>
              <p className="mt-1 text-xs text-stone-500 max-w-xs mx-auto">
                {hideSoldOut
                  ? (locale === "zh"
                      ? "当前筛选下所有花礼均已售罄。您可以关闭“仅看有货”查看全部花礼。"
                      : "All arrangements matching this view are currently sold out. Turn off 'In Stock' to view all items.")
                  : t("noArrangementsDesc", { query: searchQuery })}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                {hideSoldOut && (
                  <button
                    type="button"
                    onClick={handleToggleHideSoldOut}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition-all cursor-pointer"
                  >
                    {locale === "zh" ? "显示全部花礼" : "Show All Arrangements"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                    setSortOrder("none");
                    setHideSoldOut(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition-all cursor-pointer"
                >
                  {t("clearSearchFilters")}
                </button>
              </div>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 gap-2.5 sm:gap-4"
                  : "grid grid-cols-1 gap-3 sm:gap-3.5"
              }
            >
              {displayedProducts.map((product) => {
                const isSoldOut = Boolean(
                  product.inStock === false ||
                  storeStatus?.outOfStockProductIds?.includes(product.id)
                );
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    store={store}
                    isSoldOut={isSoldOut}
                    viewMode={viewMode}
                    onViewImage={(p) => setPreviewProduct(p)}
                  />
                );
              })}
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
                <span>{t("showMore")}</span>
                <ChevronDown className="h-4 w-4 text-stone-500" />
              </button>
              <span className="text-[11px] text-stone-400">
                {t("showingCount", {
                  count: displayedProducts.length,
                  total: filteredProducts.length,
                })}
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
                      {store.name} {t("atelierPickup")}
                    </p>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                      {t("googleMaps")}
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
              {t("storePolicyTerms")}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowPolicyModal(true)}
              className="hover:text-stone-800 underline underline-offset-2 transition-colors cursor-pointer"
            >
              {t("privacyNotice")}
            </button>
          </div>

          <div className="pt-1 space-y-0.5">
            <p className="text-[10px] text-stone-400">
              {t("poweredBy")}
            </p>
            <p className="text-[9px] text-stone-400 max-w-xs mx-auto leading-tight">
              {t("footerDisclaimer", { store: store.name })}
            </p>
          </div>

          {/* Discreet Staff Dispatch Desk & Order Book Access */}
          <div className="pt-2 border-t border-stone-200/50 mt-1">
            <Link
              href={ordersHref}
              className="inline-flex items-center gap-1 text-[10px] text-stone-400 hover:text-stone-600 transition-colors"
              title="Staff Dispatch Desk & Order Book"
            >
              <Lock className="h-2.5 w-2.5" />
              <span>Staff Dispatch &amp; POS</span>
            </Link>
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
          aria-label={t("scrollTop")}
          title={t("scrollTop")}
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
          isSoldOut={Boolean(
            previewProduct && (
              previewProduct.inStock === false ||
              storeStatus?.outOfStockProductIds?.includes(previewProduct.id)
            )
          )}
          onClose={() => setPreviewProduct(null)}
          onOrderNow={(product) => openCheckoutWithProduct(product, store)}
        />

        {/* Root Level Mounted Checkout Drawer for this Store */}
        <CheckoutDrawer
          store={store}
          storeStatus={storeStatus}
          onStatusChange={setStoreStatus}
        />

        {/* Store Paused & Non-Operating Announcement Pop-up Modal */}
        <StorePausedAnnouncementModal store={store} storeStatus={storeStatus} />
      </main>
    </div>
  );
};
