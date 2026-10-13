"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  StoreConfig,
  STORES,
  DeliveryTimeSlot,
  getProductLocalized,
} from "@/config/stores";
import { useCartStore } from "@/store/cartStore";
import { TngPaymentView } from "@/components/TngPaymentView";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  Phone,
  Store,
  Truck,
  User,
  X,
  ZoomIn,
} from "lucide-react";
import { ProductImageModal } from "@/components/ProductImageModal";
import { StorePolicyModal } from "@/components/StorePolicyModal";
import { useTranslation } from "@/i18n/localeStore";
import { LanguageSelector } from "@/components/LanguageSelector";

interface CheckoutDrawerProps {
  store?: StoreConfig;
}

export const CheckoutDrawer: React.FC<CheckoutDrawerProps> = ({ store: storeProp }) => {
  const currentStore = useCartStore((state) => state.currentStore);
  const store = storeProp || currentStore || STORES.autarix;
  const { t, locale } = useTranslation();

  const isCheckoutDrawerOpen = useCartStore(
    (state) => state.isCheckoutDrawerOpen
  );
  const setCheckoutDrawerOpen = useCartStore(
    (state) => state.setCheckoutDrawerOpen
  );
  const checkoutStep = useCartStore((state) => state.checkoutStep);
  const setCheckoutStep = useCartStore((state) => state.setCheckoutStep);

  const selectedProduct = useCartStore((state) => state.selectedProduct);
  const selectedLocalized = selectedProduct
    ? getProductLocalized(selectedProduct, locale)
    : null;
  const fulfillmentMethod = useCartStore((state) => state.fulfillmentMethod);
  const setFulfillmentMethod = useCartStore(
    (state) => state.setFulfillmentMethod
  );
  const selectedDate = useCartStore((state) => state.selectedDate);
  const setSelectedDate = useCartStore((state) => state.setSelectedDate);
  const selectedTime = useCartStore((state) => state.selectedTime);
  const setSelectedTime = useCartStore((state) => state.setSelectedTime);
  const customerDetails = useCartStore((state) => state.customerDetails);
  const setCustomerDetails = useCartStore((state) => state.setCustomerDetails);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [showProductImageModal, setShowProductImageModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // iOS Safari / Chrome autofill & keyboard collapse recovery
  useEffect(() => {
    if (!isCheckoutDrawerOpen) return;

    const resetDrawerStyleOverrides = () => {
      const drawerEl = document.querySelector<HTMLElement>("[data-vaul-drawer]");
      if (!drawerEl) return;
      if (drawerEl.style.height) {
        drawerEl.style.removeProperty("height");
      }
      if (drawerEl.style.bottom) {
        drawerEl.style.removeProperty("bottom");
      }
    };

    const handleViewportOrFocusRecovery = () => {
      const vv = window.visualViewport;
      // When keyboard is dismissed or closing (visualViewport expands back near window.innerHeight)
      if (!vv || Math.abs(window.innerHeight - vv.height) < 150) {
        resetDrawerStyleOverrides();
      }
    };

    const vv = window.visualViewport;
    vv?.addEventListener("resize", handleViewportOrFocusRecovery);
    window.addEventListener("focusout", handleViewportOrFocusRecovery);

    return () => {
      vv?.removeEventListener("resize", handleViewportOrFocusRecovery);
      window.removeEventListener("focusout", handleViewportOrFocusRecovery);
    };
  }, [isCheckoutDrawerOpen]);

  const primaryColor = store.primaryColor || "#BE185D";
  const currency = store.currency || "RM";

  // Google Maps redirection URL
  const mapsUrl =
    store.googleMapsUrl ||
    (store.pickupAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${store.name} ${store.pickupAddress}`
        )}`
      : "#");

  // Time configuration from store
  const timeConfig = store.deliveryTimeConfig || { type: "range" };
  const isExactTimeMode = timeConfig.type === "exact";

  // Operating window for exact time mode
  const operatingStart = timeConfig.operatingHours?.start || "09:00";
  const operatingEnd = timeConfig.operatingHours?.end || "20:00";
  const leadHours = timeConfig.sameDayLeadHours ?? 2;

  // Local state for exact time input ("HH:MM")
  const [exactTimeInput, setExactTimeInput] = useState<string>("");

  // Helper: Format 24h string ("14:30") to 12h display ("2:30 PM")
  const formatTime12h = (time24: string): string => {
    if (!time24) return "";
    const [hStr, mStr] = time24.split(":");
    const h = parseInt(hStr, 10);
    if (isNaN(h)) return time24;
    const m = mStr || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m} ${ampm}`;
  };

  // Base configured slots for range mode (fallback to morning/afternoon/evening if empty)
  const defaultSlots: DeliveryTimeSlot[] = [
    { id: "morning", label: "Morning", hours: "10:00 AM – 1:00 PM", cutoffHour: 13, cutoffMinute: 0 },
    { id: "afternoon", label: "Afternoon", hours: "1:00 PM – 5:00 PM", cutoffHour: 17, cutoffMinute: 0 },
    { id: "evening", label: "Evening", hours: "5:00 PM – 8:00 PM", cutoffHour: 20, cutoffMinute: 0 },
  ];

  const configuredSlots: DeliveryTimeSlot[] = useMemo(() => {
    if (timeConfig.slots && timeConfig.slots.length > 0) {
      return timeConfig.slots;
    }
    return defaultSlots;
  }, [timeConfig.slots]);

  // Formatted date string helper (YYYY-MM-DD)
  const getDateString = (daysAhead: number = 0) => {
    const target = new Date();
    target.setDate(target.getDate() + daysAhead);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, "0");
    const dd = String(target.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getDateString(0);
  const tomorrowStr = getDateString(1);
  const isToday = selectedDate === todayStr;

  // Exact Time calculations
  const earliestExactTimeToday = useMemo(() => {
    const now = new Date();
    const targetHour = now.getHours() + leadHours;
    const targetMinute = now.getMinutes();
    const hStr = String(Math.min(23, targetHour)).padStart(2, "0");
    const mStr = String(targetMinute).padStart(2, "0");
    return `${hStr}:${mStr}`;
  }, [leadHours]);

  const minTimeForExactInput = useMemo(() => {
    if (!isToday) return operatingStart;
    return earliestExactTimeToday > operatingStart ? earliestExactTimeToday : operatingStart;
  }, [isToday, earliestExactTimeToday, operatingStart]);

  const areTodayExactDeliveriesClosed = useMemo(() => {
    if (!isToday) return false;
    return earliestExactTimeToday > operatingEnd;
  }, [isToday, earliestExactTimeToday, operatingEnd]);

  // Range Mode calculations
  const availableTimeSlots = useMemo(() => {
    if (!isToday) {
      return configuredSlots;
    }
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return configuredSlots.filter((slot) => {
      if (currentHour > slot.cutoffHour) return false;
      if (currentHour === slot.cutoffHour && currentMinute >= (slot.cutoffMinute ?? 0)) return false;
      return true;
    });
  }, [isToday, configuredSlots]);

  const areTodayRangeSlotsClosed = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const lastSlot = configuredSlots[configuredSlots.length - 1];
    if (!lastSlot) return true;
    return (
      currentHour > lastSlot.cutoffHour ||
      (currentHour === lastSlot.cutoffHour && currentMinute >= (lastSlot.cutoffMinute ?? 0))
    );
  }, [configuredSlots]);

  const areTodayDeliveriesClosed = isExactTimeMode
    ? areTodayExactDeliveriesClosed
    : areTodayRangeSlotsClosed;

  // Reset selected time if date switched to today and current selection is expired
  useEffect(() => {
    if (isToday) {
      if (isExactTimeMode) {
        if (exactTimeInput && exactTimeInput < minTimeForExactInput) {
          setExactTimeInput("");
          setSelectedTime("");
        }
      } else {
        if (selectedTime) {
          const isSlotValid = availableTimeSlots.some((slot) => {
            const slotString = slot.hours ? `${slot.label} (${slot.hours})` : slot.label;
            return slotString === selectedTime;
          });
          if (!isSlotValid) {
            setSelectedTime("");
          }
        }
      }
    }
  }, [
    selectedDate,
    isToday,
    isExactTimeMode,
    exactTimeInput,
    minTimeForExactInput,
    availableTimeSlots,
    selectedTime,
    setSelectedTime,
  ]);

  // Set default initial date when drawer opens
  useEffect(() => {
    if (!selectedDate && isCheckoutDrawerOpen) {
      if (areTodayDeliveriesClosed) {
        setSelectedDate(tomorrowStr);
      } else {
        setSelectedDate(todayStr);
      }
    }
  }, [selectedDate, isCheckoutDrawerOpen, areTodayDeliveriesClosed, todayStr, tomorrowStr, setSelectedDate]);

  const setQuickDate = (daysAhead: number) => {
    setSelectedDate(getDateString(daysAhead));
  };

  const handleExactTimeChange = (timeVal: string) => {
    setExactTimeInput(timeVal);
    if (timeVal) {
      setSelectedTime(`${formatTime12h(timeVal)} (Exact Delivery)`);
    } else {
      setSelectedTime("");
    }
  };

  // Quick preset time suggestions for exact mode
  const quickTimePresets = useMemo(() => {
    const presets = ["11:00", "13:00", "15:00", "17:00", "19:00"];
    return presets.filter(
      (timeStr) => timeStr >= minTimeForExactInput && timeStr <= operatingEnd
    );
  }, [minTimeForExactInput, operatingEnd]);

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!customerDetails.name.trim()) {
      setValidationError(t("validationName"));
      return;
    }
    if (!customerDetails.phone.trim()) {
      setValidationError(t("validationPhone"));
      return;
    }
    if (!selectedDate) {
      setValidationError(t("validationDate"));
      return;
    }
    if (isExactTimeMode) {
      if (!exactTimeInput) {
        setValidationError(t("validationExactTime"));
        return;
      }
      if (isToday && exactTimeInput < minTimeForExactInput) {
        setValidationError(
          t("validationExactTimeAdvance", {
            hours: leadHours,
            time: formatTime12h(minTimeForExactInput),
          })
        );
        return;
      }
      if (exactTimeInput < operatingStart || exactTimeInput > operatingEnd) {
        setValidationError(
          t("validationExactTimeHours", {
            start: formatTime12h(operatingStart),
            end: formatTime12h(operatingEnd),
          })
        );
        return;
      }
    } else {
      if (!selectedTime) {
        setValidationError(t("validationTimeSlot"));
        return;
      }
    }
    if (fulfillmentMethod === "delivery" && !customerDetails.deliveryAddress.trim()) {
      setValidationError(t("validationAddress"));
      return;
    }

    setCheckoutStep(2);
  };

  return (
    <Drawer
      open={isCheckoutDrawerOpen}
      onOpenChange={setCheckoutDrawerOpen}
      repositionInputs={false}
    >
      <DrawerContent className="max-w-md mx-auto overflow-hidden bg-[#FAF9F6] border-t border-stone-200 flex flex-col h-[88vh] h-[88svh] max-h-[88vh] max-h-[88svh]">
        {/* Drawer Header */}
        <DrawerHeader className="relative border-b border-stone-200/60 bg-white/60 px-5 pt-3 pb-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                {checkoutStep}
              </span>
              <DrawerTitle className="text-base font-semibold text-stone-900 tracking-tight">
                {checkoutStep === 1
                  ? t("fulfillmentAndDetails")
                  : t("touchNGoPayment")}
              </DrawerTitle>
            </div>
            <div className="flex items-center gap-1.5">
              {store.enableLanguageSelector !== false && <LanguageSelector />}
              <button
                type="button"
                onClick={() => setCheckoutDrawerOpen(false)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
                aria-label={t("closeDrawer")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <DrawerDescription className="text-[12px] text-stone-500 mt-0.5">
            {checkoutStep === 1
              ? t("drawerOrderFor", { store: store.name })
              : t("drawerTngSubtitle")}
          </DrawerDescription>
        </DrawerHeader>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4">
          {checkoutStep === 1 ? (
            <form onSubmit={handleProceedToPayment} className="space-y-4 pb-6">
              {/* Selected Product Strip */}
              {selectedProduct && (
                <div className="flex items-center gap-3.5 rounded-2xl border border-stone-200/80 bg-white p-3 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setShowProductImageModal(true)}
                    aria-label={`View full picture of ${selectedLocalized?.name || selectedProduct.name}`}
                    className="group/thumb relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100 border border-stone-200/60 cursor-pointer focus:outline-none"
                  >
                    <Image
                      src={selectedProduct.image}
                      alt={selectedLocalized?.name || selectedProduct.name}
                      fill
                      sizes="64px"
                      className="object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                      <ZoomIn className="h-4 w-4 text-white" />
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                      {t("selectedArrangement")}
                    </span>
                    <h4 className="truncate text-sm font-semibold text-stone-900 leading-snug">
                      {selectedLocalized?.name || selectedProduct.name}
                    </h4>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span
                        className="text-sm font-bold"
                        style={{ color: primaryColor }}
                      >
                        {currency} {selectedProduct.price.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-stone-400">• {t("qty")}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Fulfillment Method Switcher */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  {t("fulfillmentAndDetails")}
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-200/60 p-1">
                  <button
                    type="button"
                    onClick={() => setFulfillmentMethod("delivery")}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      fulfillmentMethod === "delivery"
                        ? "bg-white text-stone-900 shadow-xs"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <Truck
                      className="h-4 w-4"
                      style={{
                        color: fulfillmentMethod === "delivery" ? primaryColor : "#A8A29E",
                      }}
                    />
                    <span>{t("doorstepDelivery")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillmentMethod("pickup")}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      fulfillmentMethod === "pickup"
                        ? "bg-white text-stone-900 shadow-xs"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <Store
                      className="h-4 w-4"
                      style={{
                        color: fulfillmentMethod === "pickup" ? primaryColor : "#A8A29E",
                      }}
                    />
                    <span>{t("storePickup")}</span>
                  </button>
                </div>

                {fulfillmentMethod === "pickup" && store.pickupAddress && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open Google Maps for ${store.name} Pickup Address`}
                    className="mt-2.5 flex items-start justify-between gap-2 rounded-xl border border-stone-200/70 bg-white p-3 text-xs text-stone-600 shadow-2xs hover:bg-stone-50 hover:border-stone-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <MapPin
                        className="h-4 w-4 shrink-0 mt-0.5"
                        style={{ color: primaryColor }}
                      />
                      <div className="min-w-0">
                        <span className="font-semibold text-stone-900 group-hover:text-stone-950 flex items-center gap-1.5 flex-wrap">
                          <span>{t("storePickupAddress", { store: store.name })}</span>
                          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 border border-emerald-200/60">
                            {t("maps")}
                          </span>
                        </span>
                        <p className="mt-0.5 text-[11px] text-stone-600 leading-relaxed group-hover:text-stone-700">
                          {store.pickupAddress}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-stone-400 group-hover:text-stone-700 shrink-0 mt-0.5 transition-colors" />
                  </a>
                )}
              </div>

              {/* Date & Time Selection Card */}
              <div className="rounded-2xl border border-stone-200/80 bg-white p-3.5 shadow-xs space-y-3.5 overflow-hidden">
                {/* Date Input */}
                <div className="w-full min-w-0">
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-stone-500" />
                      <span>{t("fulfillmentDate")}</span>
                    </label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQuickDate(0)}
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-medium transition-all cursor-pointer ${
                          isToday
                            ? "font-bold shadow-2xs"
                            : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                        }`}
                        style={
                          isToday
                            ? {
                                borderColor: primaryColor,
                                backgroundColor: `${primaryColor}14`,
                                color: primaryColor,
                              }
                            : undefined
                        }
                      >
                        {areTodayDeliveriesClosed ? t("todayClosed") : t("today")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDate(1)}
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-medium transition-all cursor-pointer ${
                          selectedDate === tomorrowStr
                            ? "font-bold shadow-2xs"
                            : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                        }`}
                        style={
                          selectedDate === tomorrowStr
                            ? {
                                borderColor: primaryColor,
                                backgroundColor: `${primaryColor}14`,
                                color: primaryColor,
                              }
                            : undefined
                        }
                      >
                        {t("tomorrow")}
                      </button>
                    </div>
                  </div>
                  <div className="relative w-full min-w-0">
                    <input
                      type="date"
                      min={todayStr}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      required
                      className="block w-full max-w-full min-w-0 box-border appearance-none rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2.5 text-xs text-stone-900 shadow-2xs focus:border-stone-400 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Time picker section (Exact Time vs Time Range) */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-stone-500" />
                      <span>{isExactTimeMode ? t("exactDeliveryTime") : t("preferredTimeSlot")}</span>
                    </label>

                    {!isExactTimeMode && isToday && availableTimeSlots.length < configuredSlots.length && (
                      <span className="text-[10px] font-medium text-amber-600">
                        {t("pastSlotsHidden")}
                      </span>
                    )}

                    {isExactTimeMode && (
                      <span className="text-[10px] text-stone-500">
                        {formatTime12h(operatingStart)} – {formatTime12h(operatingEnd)}
                      </span>
                    )}
                  </div>

                  {/* If all deliveries for today are closed */}
                  {areTodayDeliveriesClosed ? (
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-950">{t("sameDayClosed")}</p>
                        <p className="mt-0.5 text-[11px] text-amber-800 leading-relaxed">
                          {isExactTimeMode
                            ? t("sameDayClosedExact", { hours: leadHours, end: formatTime12h(operatingEnd) })
                            : t("sameDayClosedRange")}
                        </p>
                        <button
                          type="button"
                          onClick={() => setQuickDate(1)}
                          className="mt-1.5 inline-flex items-center text-[11px] font-bold text-amber-950 underline underline-offset-2"
                        >
                          {t("switchToTomorrow")}
                        </button>
                      </div>
                    </div>
                  ) : isExactTimeMode ? (
                    /* EXACT TIME MODE UI */
                    <div className="space-y-2">
                      <div className="relative w-full min-w-0">
                        <input
                          type="time"
                          min={minTimeForExactInput}
                          max={operatingEnd}
                          value={exactTimeInput}
                          onChange={(e) => handleExactTimeChange(e.target.value)}
                          required
                          className="block w-full max-w-full min-w-0 box-border appearance-none rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2.5 text-xs text-stone-900 shadow-2xs focus:border-stone-400 focus:bg-white focus:outline-none transition-all"
                        />
                      </div>

                      {/* Quick preset suggestions */}
                      {quickTimePresets.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-stone-400 uppercase font-semibold">
                            {t("quickSelect")}
                          </span>
                          {quickTimePresets.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleExactTimeChange(preset)}
                              className={`rounded-lg border px-2 py-1 text-[10px] font-medium transition-all cursor-pointer ${
                                exactTimeInput === preset
                                  ? "font-bold shadow-2xs"
                                  : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                              }`}
                              style={
                                exactTimeInput === preset
                                  ? {
                                      borderColor: primaryColor,
                                      backgroundColor: `${primaryColor}14`,
                                      color: primaryColor,
                                    }
                                  : undefined
                              }
                            >
                              {formatTime12h(preset)}
                            </button>
                          ))}
                        </div>
                      )}

                      {isToday && (
                        <p className="text-[10px] text-stone-500">
                          {t("minPreparationNotice", {
                            hours: leadHours,
                            time: formatTime12h(minTimeForExactInput),
                          })}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* RANGE MODE UI (1-column if <=4 slots, compact 2-column grid if >4 slots) */
                    <div
                      className={
                        configuredSlots.length > 4
                          ? "grid grid-cols-2 gap-2"
                          : "grid grid-cols-1 gap-1.5"
                      }
                    >
                      {availableTimeSlots.map((slot) => {
                        const slotString = slot.hours
                          ? `${slot.label} (${slot.hours})`
                          : slot.label;
                        const isSelected = selectedTime === slotString;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedTime(slotString)}
                            className={`flex items-center justify-between rounded-xl border p-2.5 text-xs text-left transition-all cursor-pointer ${
                              isSelected
                                ? "font-semibold shadow-2xs text-stone-900"
                                : "border-stone-200/70 bg-stone-50/40 text-stone-700 hover:bg-stone-50 hover:border-stone-300"
                            }`}
                            style={
                              isSelected
                                ? { borderColor: primaryColor, backgroundColor: `${primaryColor}14` }
                                : undefined
                            }
                          >
                            <div className="min-w-0 pr-1">
                              <span className="font-semibold block truncate text-[11px] sm:text-xs">
                                {slot.label}
                              </span>
                              {slot.hours && (
                                <span className="text-[10px] text-stone-500 block truncate">
                                  {slot.hours}
                                </span>
                              )}
                            </div>
                            <div
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                                isSelected ? "text-white" : "border-stone-300 bg-white"
                              }`}
                              style={
                                isSelected
                                  ? { backgroundColor: primaryColor, borderColor: primaryColor }
                                  : undefined
                              }
                            >
                              {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Details Section */}
              <div className="rounded-2xl border border-stone-200/80 bg-white p-3.5 shadow-xs space-y-3 overflow-hidden">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  {t("recipientContactDetails")}
                </label>

                {/* Name */}
                <div className="relative">
                  <User className="absolute top-2.5 left-3 h-4 w-4 text-stone-400 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder={t("recipientNamePlaceholder")}
                    value={customerDetails.name}
                    onChange={(e) =>
                      setCustomerDetails({ name: e.target.value })
                    }
                    required
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pr-3 pl-9 text-xs text-stone-900 placeholder:text-stone-400 shadow-2xs focus:border-stone-400 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                {/* Phone */}
                <div className="relative">
                  <Phone className="absolute top-2.5 left-3 h-4 w-4 text-stone-400 pointer-events-none" />
                  <input
                    type="tel"
                    name="tel"
                    autoComplete="tel"
                    placeholder={t("phonePlaceholder")}
                    value={customerDetails.phone}
                    onChange={(e) =>
                      setCustomerDetails({ phone: e.target.value })
                    }
                    required
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pr-3 pl-9 text-xs text-stone-900 placeholder:text-stone-400 shadow-2xs focus:border-stone-400 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                {/* Delivery Address (only when Delivery is selected) */}
                {fulfillmentMethod === "delivery" && (
                  <div className="relative">
                    <MapPin className="absolute top-2.5 left-3 h-4 w-4 text-stone-400 pointer-events-none" />
                    <textarea
                      name="street-address"
                      autoComplete="street-address"
                      placeholder={t("addressPlaceholder")}
                      rows={2}
                      value={customerDetails.deliveryAddress}
                      onChange={(e) =>
                        setCustomerDetails({ deliveryAddress: e.target.value })
                      }
                      required
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pr-3 pl-9 text-xs text-stone-900 placeholder:text-stone-400 shadow-2xs focus:border-stone-400 focus:bg-white focus:outline-none transition-all resize-none"
                    />
                  </div>
                )}

                {/* Complimentary Card Message */}
                <div className="relative">
                  <Heart className="absolute top-2.5 left-3 h-4 w-4 text-stone-400 pointer-events-none" />
                  <textarea
                    placeholder={t("cardMessagePlaceholder")}
                    rows={2}
                    value={customerDetails.cardMessage}
                    onChange={(e) =>
                      setCustomerDetails({ cardMessage: e.target.value })
                    }
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pr-3 pl-9 text-xs text-stone-900 placeholder:text-stone-400 shadow-2xs focus:border-stone-400 focus:bg-white focus:outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Inline Validation Alert */}
              {validationError && (
                <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200/80 animate-in fade-in duration-200">
                  {validationError}
                </div>
              )}

              {/* Proceed to Payment Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  className="flex w-full items-center justify-between rounded-xl py-3 px-4 text-sm font-semibold text-white shadow-md transition-all active:scale-98 hover:opacity-95 cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="font-medium text-white/90">
                    {t("proceedToPayment")}
                  </span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>
                      {selectedProduct
                        ? `${currency} ${selectedProduct.price.toFixed(2)}`
                        : ""}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>

                {/* Legal & Policy Disclaimer */}
                <p className="mt-2.5 text-center text-[10px] text-stone-400 leading-relaxed">
                  {t("orderConsentNotice")}{" "}
                  <button
                    type="button"
                    onClick={() => setShowPolicyModal(true)}
                    className="underline underline-offset-2 text-stone-600 hover:text-stone-900 cursor-pointer font-medium"
                  >
                    {t("substitutionStorePolicy")}
                  </button>{" "}
                  {t("and")}{" "}
                  <button
                    type="button"
                    onClick={() => setShowPolicyModal(true)}
                    className="underline underline-offset-2 text-stone-600 hover:text-stone-900 cursor-pointer font-medium"
                  >
                    {t("privacyNoticePdpa")}
                  </button>
                  .
                </p>
              </div>
            </form>
          ) : (
            /* Step 2: TNG Payment View */
            <TngPaymentView store={store} />
          )}
        </div>
      </DrawerContent>

      {/* Store Policy & Privacy Notice Modal */}
      <StorePolicyModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        store={store}
      />

      {/* Full Picture Modal Lightbox */}
      <ProductImageModal
        isOpen={showProductImageModal}
        product={selectedProduct}
        store={store}
        onClose={() => setShowProductImageModal(false)}
      />
    </Drawer>
  );
};
