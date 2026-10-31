"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { OrderSuccess } from "@/components/OrderSuccess";
import { generateWhatsAppMessage, getWhatsAppUrl } from "@/utils/whatsapp";
import { QtyStepper } from "@/components/QtyStepper";
import { DeliveryZoneDropdown } from "@/components/DeliveryZoneDropdown";
import { useCountUp } from "@/lib/useCountUp";
import { detectDeliveryZone } from "@/lib/addressZoneDetector";
import toast from "react-hot-toast";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Ban,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  Heart,
  Loader2,
  MapPin,
  Phone,
  Sparkles,
  Store,
  Truck,
  User,
  X,
  Zap,
  ZoomIn,
} from "lucide-react";
import { ProductImageModal } from "@/components/ProductImageModal";
import { StorePolicyModal } from "@/components/StorePolicyModal";
import { useTranslation } from "@/i18n/localeStore";
import { LanguageSelector } from "@/components/LanguageSelector";
import { StoreEmergencyStatus } from "@/lib/storeStatus";
import {
  getHolidayRuleForDate,
  calculateHolidaySurcharge,
  isHolidayPricingInclusive,
  getEffectiveProductPrice,
  getHolidayLineItemSurcharge,
  convertPeakSlotsToDeliveryTimeSlots,
} from "@/lib/holidayPricing";

export type ValidationErrorField =
  | "name"
  | "phone"
  | "date"
  | "time"
  | "deliveryZone"
  | "deliveryAddress"
  | "general";

export interface ValidationErrorState {
  field: ValidationErrorField;
  message: string;
}

interface CheckoutDrawerProps {
  store?: StoreConfig;
  storeStatus?: StoreEmergencyStatus;
  onStatusChange?: (status: StoreEmergencyStatus) => void;
}

export const CheckoutDrawer: React.FC<CheckoutDrawerProps> = ({
  store: storeProp,
  storeStatus: storeStatusProp,
  onStatusChange,
}) => {
  const currentStore = useCartStore((state) => state.currentStore);
  const store = storeProp || currentStore || STORES.autarix;
  const { t, locale } = useTranslation();

  // Real-time Emergency Status
  const [liveStatus, setLiveStatus] = useState<StoreEmergencyStatus | undefined>(
    storeStatusProp
  );

  useEffect(() => {
    if (storeStatusProp) {
      setLiveStatus(storeStatusProp);
    }
  }, [storeStatusProp]);

  const isTodayPaused = Boolean(liveStatus?.isTodayPaused);
  const isTomorrowBlocked = Boolean(liveStatus?.isTomorrowBlocked);

  const isCheckoutDrawerOpen = useCartStore(
    (state) => state.isCheckoutDrawerOpen
  );
  const setCheckoutDrawerOpen = useCartStore(
    (state) => state.setCheckoutDrawerOpen
  );
  const checkoutStep = useCartStore((state) => state.checkoutStep);
  const setCheckoutStep = useCartStore((state) => state.setCheckoutStep);
  const resetCheckout = useCartStore((state) => state.resetCheckout);
  const quantity = useCartStore((state) => state.quantity);
  const setQuantity = useCartStore((state) => state.setQuantity);

  const selectedProduct = useCartStore((state) => state.selectedProduct);
  const selectedLocalized = selectedProduct
    ? getProductLocalized(selectedProduct, locale)
    : null;
  const fulfillmentMethod = useCartStore((state) => state.fulfillmentMethod);
  const setFulfillmentMethod = useCartStore(
    (state) => state.setFulfillmentMethod
  );
  const selectedAddonIds = useCartStore((state) => state.selectedAddonIds);
  const toggleAddon = useCartStore((state) => state.toggleAddon);
  const selectedDeliveryZoneId = useCartStore(
    (state) => state.selectedDeliveryZoneId
  );
  const setSelectedDeliveryZoneId = useCartStore(
    (state) => state.setSelectedDeliveryZoneId
  );
  const selectedDate = useCartStore((state) => state.selectedDate);
  const setSelectedDate = useCartStore((state) => state.setSelectedDate);
  const selectedTime = useCartStore((state) => state.selectedTime);
  const setSelectedTime = useCartStore((state) => state.setSelectedTime);
  const customerDetails = useCartStore((state) => state.customerDetails);
  const setCustomerDetails = useCartStore((state) => state.setCustomerDetails);

  const [validationError, setValidationError] = useState<ValidationErrorState | null>(null);
  const [showProductImageModal, setShowProductImageModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [autoDetectedZoneId, setAutoDetectedZoneId] = useState<string | null>(null);
  const hasUserManuallySelectedZoneRef = useRef<boolean>(false);

  const handleClose = () => {
    if (checkoutStep === 3) {
      resetCheckout();
      hasUserManuallySelectedZoneRef.current = false;
      setAutoDetectedZoneId(null);
    } else {
      setCheckoutDrawerOpen(false);
    }
  };

  const whatsappMessage = useMemo(() => {
    return generateWhatsAppMessage(store, liveStatus?.holidayPricingDisplay);
  }, [
    store,
    liveStatus?.holidayPricingDisplay,
    selectedProduct,
    quantity,
    selectedAddonIds,
    fulfillmentMethod,
    selectedDeliveryZoneId,
    selectedDate,
    selectedTime,
    customerDetails,
    locale,
  ]);

  const whatsappUrl = useMemo(() => {
    return getWhatsAppUrl(store, liveStatus?.holidayPricingDisplay);
  }, [
    store,
    liveStatus?.holidayPricingDisplay,
    selectedProduct,
    quantity,
    selectedAddonIds,
    fulfillmentMethod,
    selectedDeliveryZoneId,
    selectedDate,
    selectedTime,
    customerDetails,
    locale,
  ]);

  // Fetch latest store emergency status whenever checkout drawer opens
  useEffect(() => {
    if (isCheckoutDrawerOpen && store.slug) {
      fetch(`/api/store/status?slug=${encodeURIComponent(store.slug)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.status) {
            setLiveStatus(data.status);
            onStatusChange?.(data.status);
          }
        })
        .catch((err) => console.warn("Failed to fetch store status in drawer:", err));
    }
  }, [isCheckoutDrawerOpen, store.slug, onStatusChange]);

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

  // Matching holiday peak rule for currently selected date
  const holidayRule = useMemo(() => {
    return getHolidayRuleForDate(store, selectedDate);
  }, [store, selectedDate]);

  // Real-time capacity check for peak holiday dates
  const [capacityOrdersCount, setCapacityOrdersCount] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedDate || !store.slug) {
      setCapacityOrdersCount(null);
      return;
    }

    let isMounted = true;
    fetch(`/api/store/capacity?slug=${encodeURIComponent(store.slug)}&date=${encodeURIComponent(selectedDate)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && typeof data.ordersCount === "number") {
          setCapacityOrdersCount(data.ordersCount);
        }
      })
      .catch((err) => {
        console.warn("Failed to check date capacity:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, store.slug]);

  const isHolidaySoldOut = Boolean(
    holidayRule &&
    holidayRule.maxDailyOrders &&
    capacityOrdersCount !== null &&
    capacityOrdersCount >= holidayRule.maxDailyOrders
  );

  // Check if current selected product is sold out (either in catalog or via live status)
  const isProductSoldOut = Boolean(
    selectedProduct &&
      (selectedProduct.inStock === false ||
        liveStatus?.outOfStockProductIds?.includes(selectedProduct.id))
  );

  const [isCheckingStock, setIsCheckingStock] = useState(false);

  // Broad holiday delivery windows switch when holiday rule specifies peakSlots
  const configuredSlots: DeliveryTimeSlot[] = useMemo(() => {
    if (holidayRule?.peakSlots && holidayRule.peakSlots.length > 0) {
      return convertPeakSlotsToDeliveryTimeSlots(holidayRule.peakSlots);
    }
    if (timeConfig.slots && timeConfig.slots.length > 0) {
      return timeConfig.slots;
    }
    return defaultSlots;
  }, [holidayRule, timeConfig.slots]);

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
    return earliestExactTimeToday > operatingEnd;
  }, [earliestExactTimeToday, operatingEnd]);

  // Rush Order Strategy & Range Mode calculations
  const rushStrategy = timeConfig.rushStrategy || "rush_with_warning";

  const availableTimeSlots = useMemo(() => {
    if (!isToday) {
      return configuredSlots;
    }
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const leadHours = timeConfig.sameDayLeadHours || 0;

    return configuredSlots.filter((slot) => {
      // Strategy 1: strict_cutoff - closes when slot starts (or leadHours before start)
      if (rushStrategy === "strict_cutoff") {
        const slotStartHour = slot.cutoffHour - 1 - leadHours;
        if (currentHour > slotStartHour) return false;
        if (currentHour === slotStartHour && currentMinute > 0) return false;
        return true;
      }

      // Strategy 2: rush_with_warning & flexible - closes at the end of the slot window
      if (currentHour > slot.cutoffHour) return false;
      if (currentHour === slot.cutoffHour && currentMinute >= (slot.cutoffMinute ?? 0)) return false;
      return true;
    });
  }, [isToday, configuredSlots, rushStrategy, timeConfig.sameDayLeadHours]);

  const areTodayRangeSlotsClosed = useMemo(() => {
    return availableTimeSlots.length === 0;
  }, [availableTimeSlots]);

  // Strategy 2: Dynamic Rush Slot Detection
  const isSelectedSlotRush = useMemo(() => {
    if (!isToday || !selectedTime) return false;
    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const threshold = timeConfig.rushThresholdMinutes ?? 45;

    // Check exact time mode
    if (isExactTimeMode && exactTimeInput) {
      const [h, m] = exactTimeInput.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        const targetMins = h * 60 + m;
        if (targetMins - currentTotalMinutes <= threshold && targetMins >= currentTotalMinutes) {
          return true;
        }
      }
    }

    // Check range slot
    const matchingSlot = configuredSlots.find((slot) => {
      const slotString = slot.hours ? `${slot.label} (${slot.hours})` : slot.label;
      return slotString === selectedTime || slot.label === selectedTime;
    });

    if (matchingSlot) {
      const slotStartHour = matchingSlot.cutoffHour - 1;
      const slotStartMinutes = slotStartHour * 60;
      const slotEndMinutes = matchingSlot.cutoffHour * 60 + (matchingSlot.cutoffMinute ?? 0);

      // Already within the slot (e.g. 10:28 AM inside 10:00 - 11:00 AM)
      if (currentTotalMinutes >= slotStartMinutes && currentTotalMinutes < slotEndMinutes) {
        return true;
      }
      // Or starting within rushThresholdMinutes
      if (slotStartMinutes - currentTotalMinutes <= threshold && slotStartMinutes > currentTotalMinutes) {
        return true;
      }
    }

    return false;
  }, [isToday, selectedTime, configuredSlots, isExactTimeMode, exactTimeInput, timeConfig.rushThresholdMinutes]);

  // Closed Days, Holiday Blackout & Emergency Status helper
  const getDateClosedInfo = (dateStr: string) => {
    if (!dateStr) return { isClosed: false, reason: "" };
    if (dateStr < todayStr) {
      return { isClosed: true, reason: t("validationPastDate") };
    }
    if (dateStr === todayStr && isTodayPaused) {
      return { isClosed: true, reason: t("emergencyPauseNotice") };
    }
    if (dateStr === tomorrowStr && isTomorrowBlocked) {
      return { isClosed: true, reason: t("tomorrowBlockedNotice") };
    }
    if (dateStr === selectedDate && isHolidaySoldOut && holidayRule) {
      const holidayName = locale === "zh" ? holidayRule.nameZh || holidayRule.name : holidayRule.name;
      return {
        isClosed: true,
        reason: t("holidayCapacitySoldOut", { holiday: holidayName, date: dateStr }),
      };
    }
    const parts = dateStr.split("-").map(Number);
    if (parts.length < 3) return { isClosed: false, reason: "" };
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon...
    if (timeConfig.closedDaysOfWeek?.includes(dayOfWeek)) {
      return { isClosed: true, reason: t("regularWeeklyClosed") };
    }
    if (timeConfig.blackoutDates?.includes(dateStr)) {
      return { isClosed: true, reason: t("holidayBlackoutClosed") };
    }
    return { isClosed: false, reason: "" };
  };

  const selectedDateClosedInfo = useMemo(() => {
    return getDateClosedInfo(selectedDate);
  }, [
    selectedDate,
    isTodayPaused,
    isTomorrowBlocked,
    isHolidaySoldOut,
    holidayRule,
    timeConfig.closedDaysOfWeek,
    timeConfig.blackoutDates,
    t,
    locale,
  ]);

  const isTodayDateRestricted = useMemo(() => {
    return isTodayPaused || getDateClosedInfo(todayStr).isClosed;
  }, [todayStr, isTodayPaused, timeConfig.closedDaysOfWeek, timeConfig.blackoutDates]);

  const isTomorrowDateRestricted = useMemo(() => {
    return isTomorrowBlocked || getDateClosedInfo(tomorrowStr).isClosed;
  }, [tomorrowStr, isTomorrowBlocked, timeConfig.closedDaysOfWeek, timeConfig.blackoutDates]);

  const areTodayDeliveriesClosed =
    isTodayDateRestricted ||
    (isExactTimeMode ? areTodayExactDeliveriesClosed : areTodayRangeSlotsClosed);

  const minSelectableDate =
    isTodayPaused || areTodayDeliveriesClosed ? tomorrowStr : todayStr;

  // Price & Delivery calculations
  const baseBouquetPrice = selectedProduct?.price || 0;
  const isHolidayInclusive = Boolean(
    holidayRule &&
      !isHolidaySoldOut &&
      isHolidayPricingInclusive(holidayRule, liveStatus?.holidayPricingDisplay)
  );

  const effectiveBouquetPrice = useMemo(() => {
    if (!holidayRule || isHolidaySoldOut) return baseBouquetPrice;
    return getEffectiveProductPrice(
      baseBouquetPrice,
      holidayRule,
      liveStatus?.holidayPricingDisplay
    );
  }, [baseBouquetPrice, holidayRule, isHolidaySoldOut, liveStatus?.holidayPricingDisplay]);

  // Surcharge displayed as separate line item (0 if inclusive mode)
  const holidayLineItemSurcharge = useMemo(() => {
    if (!holidayRule || isHolidaySoldOut) return 0;
    return getHolidayLineItemSurcharge(
      baseBouquetPrice,
      holidayRule,
      liveStatus?.holidayPricingDisplay
    );
  }, [baseBouquetPrice, holidayRule, isHolidaySoldOut, liveStatus?.holidayPricingDisplay]);

  // Total festive margin amount (for backend order tracking & staff order book)
  const holidayTotalSurcharge = useMemo(() => {
    if (!holidayRule || isHolidaySoldOut) return 0;
    return calculateHolidaySurcharge(baseBouquetPrice, holidayRule);
  }, [baseBouquetPrice, holidayRule, isHolidaySoldOut]);

  const availableAddons = store.addons || [];
  const activeAddons = availableAddons.filter((a) =>
    selectedAddonIds.includes(a.id)
  );
  const addonsTotal = activeAddons.reduce((sum, a) => sum + a.price, 0);

  const isDelivery = fulfillmentMethod === "delivery";
  const deliveryConfig = store.deliveryFeeConfig;
  const isDeliveryFeeEnabled = Boolean(isDelivery && deliveryConfig?.enabled);
  const selectedZone = isDeliveryFeeEnabled
    ? deliveryConfig?.zones.find((z) => z.id === selectedDeliveryZoneId)
    : null;
  const baseDeliveryFee = selectedZone?.fee || 0;
  const bouquetTotal = effectiveBouquetPrice * quantity;
  const holidaySurchargeTotal = holidayLineItemSurcharge * quantity;
  const isFreeDelivery = Boolean(
    isDeliveryFeeEnabled &&
      deliveryConfig?.freeDeliveryThreshold &&
      bouquetTotal + addonsTotal >= deliveryConfig.freeDeliveryThreshold
  );
  const deliveryFee = isDeliveryFeeEnabled
    ? isFreeDelivery
      ? 0
      : baseDeliveryFee
    : 0;

  const grandTotal =
    bouquetTotal + addonsTotal + deliveryFee + holidaySurchargeTotal;
  const animatedTotal = useCountUp(grandTotal, 280);

  // Smart Address Auto-Detection for Delivery Zones
  const autoDetectEnabled = Boolean(
    isDeliveryFeeEnabled && deliveryConfig?.autoDetectZone !== false
  );
  const deliveryZones = deliveryConfig?.zones;

  useEffect(() => {
    if (!autoDetectEnabled || !deliveryZones || deliveryZones.length === 0) return;
    if (!isDelivery) return;

    const rawAddress = customerDetails.deliveryAddress?.trim() || "";

    // Reset manual override flag if user cleared the address
    if (!rawAddress) {
      hasUserManuallySelectedZoneRef.current = false;
      setAutoDetectedZoneId(null);
      return;
    }

    if (rawAddress.length < 3) return;

    // Detect zone with debounce for typing, faster response on autofill
    const timer = setTimeout(() => {
      const match = detectDeliveryZone(rawAddress, deliveryZones);
      if (match) {
        setAutoDetectedZoneId(match.zoneId);
        if (!hasUserManuallySelectedZoneRef.current) {
          setSelectedDeliveryZoneId(match.zoneId);
        }
      } else {
        if (!hasUserManuallySelectedZoneRef.current) {
          setAutoDetectedZoneId(null);
        }
      }
    }, rawAddress.length > 15 ? 100 : 250);

    return () => clearTimeout(timer);
  }, [
    customerDetails.deliveryAddress,
    autoDetectEnabled,
    deliveryZones,
    isDelivery,
    setSelectedDeliveryZoneId,
  ]);

  const autoDetectedZone = useMemo(() => {
    if (!autoDetectedZoneId || !deliveryZones) return null;
    return deliveryZones.find((z) => z.id === autoDetectedZoneId) || null;
  }, [autoDetectedZoneId, deliveryZones]);

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
    } else if (selectedTime && !isExactTimeMode) {
      // Validate that broad peak slot or standard slot is compatible with current date
      const isSlotValid = availableTimeSlots.some((slot) => {
        const slotString = slot.hours ? `${slot.label} (${slot.hours})` : slot.label;
        return slotString === selectedTime || slot.label === selectedTime;
      });
      if (!isSlotValid) {
        setSelectedTime("");
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

  // Set default initial date when drawer opens or if currently selectedDate is in the past
  useEffect(() => {
    if (!isCheckoutDrawerOpen) return;

    if (!selectedDate || selectedDate < minSelectableDate) {
      if (areTodayDeliveriesClosed || isTodayPaused) {
        if (!isTomorrowDateRestricted && !isTomorrowBlocked) {
          setSelectedDate(tomorrowStr);
        } else {
          // Find next available open day
          for (let i = 2; i <= 7; i++) {
            const nextDay = getDateString(i);
            if (!getDateClosedInfo(nextDay).isClosed) {
              setSelectedDate(nextDay);
              break;
            }
          }
        }
      } else {
        setSelectedDate(todayStr);
      }
    }
  }, [
    selectedDate,
    isCheckoutDrawerOpen,
    areTodayDeliveriesClosed,
    isTodayPaused,
    minSelectableDate,
    isTomorrowDateRestricted,
    isTomorrowBlocked,
    todayStr,
    tomorrowStr,
    setSelectedDate,
  ]);

  const setQuickDate = (daysAhead: number) => {
    if (daysAhead === 0 && (isTodayPaused || areTodayDeliveriesClosed)) return;
    if (daysAhead === 1 && (isTomorrowBlocked || isTomorrowDateRestricted)) return;
    const targetDate = getDateString(daysAhead);
    if (targetDate < todayStr) return;
    setSelectedDate(targetDate);
    setValidationError(null);
  };

  const handleExactTimeChange = (timeVal: string) => {
    setExactTimeInput(timeVal);
    if (validationError?.field === "time") {
      setValidationError(null);
    }
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

  // Quick greeting card message suggestions (nullable / optional)
  const quickCardPresets = useMemo(() => {
    if (locale === "zh") {
      return [
        { id: "birthday", label: "🎂 生日快乐", text: "生日快乐" },
        { id: "love", label: "❤️ 我爱你", text: "我爱你" },
        { id: "congrats", label: "🎉 恭喜祝福", text: "恭喜祝福" },
      ];
    }
    return [
      { id: "birthday", label: "🎂 Happy Birthday", text: "Happy Birthday" },
      { id: "love", label: "❤️ I Love You", text: "I Love You" },
      { id: "congrats", label: "🎉 Congratulations", text: "Congratulations" },
    ];
  }, [locale]);

  const reportValidationError = (field: ValidationErrorField, message: string) => {
    setValidationError({ field, message });
    toast.error(message, { id: "checkout-validation" });

    let elementId: string | null = null;
    switch (field) {
      case "deliveryZone":
        elementId = "checkout-delivery-zone-section";
        break;
      case "date":
        elementId = "checkout-date-section";
        break;
      case "time":
        elementId = isExactTimeMode ? "checkout-delivery-time" : "checkout-time-section";
        break;
      case "name":
        elementId = "checkout-recipient-name";
        break;
      case "phone":
        elementId = "checkout-recipient-phone";
        break;
      case "deliveryAddress":
        elementId = "checkout-delivery-address";
        break;
      default:
        elementId = null;
    }

    if (elementId) {
      setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            el.focus({ preventScroll: true });
          }
        }
      }, 50);
    }
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (isProductSoldOut) {
      reportValidationError(
        "general",
        locale === "zh"
          ? "抱歉，该花礼今日已售罄，无法提交订单。请返回选购其他精美花礼。"
          : "We're sorry, this floral arrangement has sold out for today. Please choose another bouquet."
      );
      return;
    }

    // 1. Delivery Zone (if Doorstep Delivery)
    if (isDelivery && isDeliveryFeeEnabled && !selectedDeliveryZoneId) {
      reportValidationError("deliveryZone", t("validationDeliveryZone"));
      return;
    }

    // 2. Fulfillment Date
    if (!selectedDate) {
      reportValidationError("date", t("validationDate"));
      return;
    }
    if (selectedDate < todayStr) {
      reportValidationError("date", t("validationPastDate"));
      return;
    }
    if (selectedDate < minSelectableDate) {
      reportValidationError(
        "date",
        isTodayPaused ? t("validationTodayPaused") : t("validationStoreClosedDate")
      );
      return;
    }
    if (isHolidaySoldOut && holidayRule) {
      const holidayName = locale === "zh" ? holidayRule.nameZh || holidayRule.name : holidayRule.name;
      reportValidationError(
        "date",
        t("holidayCapacitySoldOut", { holiday: holidayName, date: selectedDate })
      );
      return;
    }
    if (selectedDateClosedInfo.isClosed) {
      reportValidationError("date", selectedDateClosedInfo.reason || t("validationStoreClosedDate"));
      return;
    }

    // 3. Delivery / Fulfillment Time
    if (isExactTimeMode) {
      if (!exactTimeInput) {
        reportValidationError("time", t("validationExactTime"));
        return;
      }
      if (isToday && exactTimeInput < minTimeForExactInput) {
        reportValidationError(
          "time",
          t("validationExactTimeAdvance", {
            hours: leadHours,
            time: formatTime12h(minTimeForExactInput),
          })
        );
        return;
      }
      if (exactTimeInput < operatingStart || exactTimeInput > operatingEnd) {
        reportValidationError(
          "time",
          t("validationExactTimeHours", {
            start: formatTime12h(operatingStart),
            end: formatTime12h(operatingEnd),
          })
        );
        return;
      }
    } else {
      if (!selectedTime) {
        reportValidationError("time", t("validationTimeSlot"));
        return;
      }
    }

    // 4. Contact: Name
    if (!customerDetails.name.trim()) {
      reportValidationError("name", t("validationName"));
      return;
    }

    // 5. Contact: Phone
    if (!customerDetails.phone.trim()) {
      reportValidationError("phone", t("validationPhone"));
      return;
    }

    // 6. Contact: Delivery Address (if Doorstep Delivery)
    if (fulfillmentMethod === "delivery" && !customerDetails.deliveryAddress.trim()) {
      reportValidationError("deliveryAddress", t("validationAddress"));
      return;
    }

    // Real-time live check before proceeding to payment
    if (store.slug && selectedProduct) {
      try {
        setIsCheckingStock(true);
        const res = await fetch(
          `/api/store/status?slug=${encodeURIComponent(store.slug)}&t=${Date.now()}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (data.success && data.status) {
          setLiveStatus(data.status);
          onStatusChange?.(data.status);
          const isLatestSoldOut = Boolean(
            selectedProduct.inStock === false ||
              data.status.outOfStockProductIds?.includes(selectedProduct.id)
          );
          if (isLatestSoldOut) {
            reportValidationError(
              "general",
              locale === "zh"
                ? "抱歉，花艺师刚刚将该花礼标记为今日已售罄，无法提交此订单。请返回挑选其他心仪花礼。"
                : "We're sorry, this floral arrangement was just marked sold out for today. Please choose another bouquet."
            );
            setIsCheckingStock(false);
            return;
          }
        }
      } catch (checkErr) {
        console.warn("Live stock re-check skipped on network error:", checkErr);
      } finally {
        setIsCheckingStock(false);
      }
    }

    // Record order in background so it appears live on the florist's mobile order book
    if (selectedProduct) {
      fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug: store.slug,
          product: {
            id: selectedProduct.id,
            name: selectedProduct.name,
            nameZh: selectedProduct.nameZh,
            price: effectiveBouquetPrice,
            image: selectedProduct.image,
            quantity: quantity,
          },
          addons: activeAddons.map((a) => ({
            id: a.id,
            name: a.name,
            nameZh: a.nameZh,
            price: a.price,
          })),
          fulfillmentMethod,
          deliveryZoneName: isDelivery ? selectedZone?.name : undefined,
          deliveryFee: isDelivery ? deliveryFee : 0,
          deliveryDate: selectedDate,
          deliveryTimeSlot: selectedTime,
          recipient: {
            name: customerDetails.name,
            phone: customerDetails.phone,
            deliveryAddress: isDelivery ? customerDetails.deliveryAddress : undefined,
          },
          cardMessage: customerDetails.cardMessage || "",
          notes: isSelectedSlotRush
            ? `${customerDetails.notes ? customerDetails.notes + " • " : ""}[⚡ Same-Day Rush Slot]`
            : customerDetails.notes || "",
          totalAmount: grandTotal,
          holidaySurcharge: holidayTotalSurcharge > 0 ? holidayTotalSurcharge : 0,
          holidayName: holidayTotalSurcharge > 0 && holidayRule ? holidayRule.name : undefined,
          paymentMode: store.paymentMode || "static_qr",
          paymentStatus: "paid_tng",
        }),
      }).catch((err) => console.error("Auto order recording error:", err));
    }

    setCheckoutStep(2);
  };

  return (
    <Drawer
      open={isCheckoutDrawerOpen}
      onOpenChange={(open) => {
        if (!open) {
          if (checkoutStep === 3) {
            resetCheckout();
          } else {
            setCheckoutDrawerOpen(false);
          }
        } else {
          setCheckoutDrawerOpen(true);
        }
      }}
      repositionInputs={false}
    >
      <DrawerContent className="max-w-md mx-auto overflow-hidden bg-[#FAF9F6] border-t border-stone-200 flex flex-col h-[88vh] h-[88svh] max-h-[88vh] max-h-[88svh]">
        {/* Drawer Header */}
        <DrawerHeader className="relative border-b border-stone-200/60 bg-white/60 px-5 pt-3 pb-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-xs"
                style={{
                  backgroundColor: checkoutStep === 3 ? "#1faa59" : primaryColor,
                }}
              >
                {checkoutStep === 3 ? (
                  <Check className="h-3 w-3 stroke-[3]" />
                ) : (
                  checkoutStep
                )}
              </span>
              <DrawerTitle className="text-base font-semibold text-stone-900 tracking-tight">
                {checkoutStep === 1
                  ? t("fulfillmentAndDetails")
                  : checkoutStep === 2
                  ? t("touchNGoPayment")
                  : locale === "zh"
                  ? "已发送订单"
                  : "Order sent"}
              </DrawerTitle>
            </div>
            <div className="flex items-center gap-1.5">
              {store.enableLanguageSelector !== false && <LanguageSelector />}
              <button
                type="button"
                onClick={handleClose}
                className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
                aria-label={t("closeDrawer")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DrawerHeader>

        {checkoutStep === 1 ? (
          <form
            id="checkout-step1-form"
            onSubmit={handleProceedToPayment}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            {/* Scrollable Body */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
              {/* Selected Product Strip */}
              {selectedProduct && (
                <div
                  className={`flex items-center gap-3.5 rounded-2xl border p-3 shadow-xs transition-colors ${
                    isProductSoldOut
                      ? "border-rose-200 bg-rose-50/40"
                      : "border-stone-200/80 bg-white"
                  }`}
                >
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
                      className={`object-cover transition-transform duration-300 group-hover/thumb:scale-110 ${
                        isProductSoldOut ? "grayscale-35 opacity-75" : ""
                      }`}
                    />
                    {isProductSoldOut && (
                      <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center p-1 text-center">
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                          {locale === "zh" ? "今日售罄" : "Sold Out"}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                      <ZoomIn className="h-4 w-4 text-white" />
                    </div>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                        {t("selectedArrangement")}
                      </span>
                      {isProductSoldOut && (
                        <span className="rounded bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-700 border border-rose-200">
                          {locale === "zh" ? "今日已售罄" : "Sold Out Today"}
                        </span>
                      )}
                    </div>
                    <h4
                      className={`truncate text-sm font-semibold leading-snug ${
                        isProductSoldOut ? "text-stone-500 line-through" : "text-stone-900"
                      }`}
                    >
                      {selectedLocalized?.name || selectedProduct.name}
                    </h4>
                    <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                      <span
                        className={`text-sm font-bold tabular-nums ${isProductSoldOut ? "text-stone-400 line-through" : ""}`}
                        style={{
                          color: !isProductSoldOut ? primaryColor : undefined,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {currency} {effectiveBouquetPrice.toFixed(2)}
                      </span>
                      {isHolidayInclusive && (
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                          {t("holidayInclusiveBadge")}
                        </span>
                      )}
                      <span className="text-[11px] text-stone-400">
                        • {t("qty", { count: quantity })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity Stepper Row */}
              <div className="flex items-center justify-between rounded-2xl border border-stone-200/80 bg-white p-3.5 shadow-xs">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                    {locale === "zh" ? "订购数量" : "Quantity"}
                  </label>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {locale === "zh" ? "最多可订购 20 束" : "Select up to 20 bouquets"}
                  </p>
                </div>
                <QtyStepper
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={20}
                />
              </div>

              {/* Enhance Your Gift (Add-ons section) */}
              {availableAddons.length > 0 && (
                <div className="rounded-2xl border border-stone-200/80 bg-white p-3.5 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: primaryColor }} />
                        <span>{t("enhanceYourGift")}</span>
                      </label>
                      <p className="text-[10px] text-stone-500 mt-0.5 leading-snug">
                        {t("enhanceYourGiftSubtitle")}
                      </p>
                    </div>
                    {selectedAddonIds.length > 0 && (
                      <span
                        className="shrink-0 whitespace-nowrap text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-2xs leading-none"
                        style={{
                          backgroundColor: `${primaryColor}14`,
                          borderColor: `${primaryColor}30`,
                          color: primaryColor,
                        }}
                      >
                        {t("selectedCount", { count: selectedAddonIds.length })}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                    {availableAddons.map((addon) => {
                      const isSelected = selectedAddonIds.includes(addon.id);
                      const addonName =
                        locale === "zh" ? addon.nameZh || addon.name : addon.name;
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => toggleAddon(addon.id)}
                          className={`flex items-center justify-between rounded-xl border p-2.5 text-xs text-left transition-all cursor-pointer ${
                            isSelected
                              ? "font-semibold shadow-2xs text-stone-900"
                              : "border-stone-200/80 bg-stone-50/50 text-stone-700 hover:bg-stone-50 hover:border-stone-300"
                          }`}
                          style={
                            isSelected
                              ? {
                                  borderColor: primaryColor,
                                  backgroundColor: `${primaryColor}10`,
                                }
                              : undefined
                          }
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-1">
                            <div
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                                isSelected ? "text-white" : "border-stone-300 bg-white"
                              }`}
                              style={
                                isSelected
                                  ? {
                                      backgroundColor: primaryColor,
                                      borderColor: primaryColor,
                                    }
                                  : undefined
                              }
                            >
                              {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                            </div>
                            <span className="truncate text-[11px] font-medium">
                              {addonName}
                            </span>
                          </div>
                          <span
                            className="font-bold text-[11px] shrink-0"
                            style={{ color: primaryColor }}
                          >
                            +{currency} {addon.price.toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
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

                {/* Delivery Zone Selector for Doorstep Delivery */}
                {fulfillmentMethod === "delivery" && isDeliveryFeeEnabled && deliveryConfig && (
                  <div id="checkout-delivery-zone-section" className="mt-3 space-y-1.5 pt-2.5 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-stone-500" />
                        <span>{t("deliveryArea")}</span>
                      </label>
                      {deliveryConfig.freeDeliveryThreshold && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isFreeDelivery
                              ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60 font-bold"
                              : "text-stone-500 bg-stone-100"
                          }`}
                        >
                          {isFreeDelivery
                            ? t("freeDeliveryApplied")
                            : t("freeDeliveryThresholdNote", {
                                threshold: `${currency} ${deliveryConfig.freeDeliveryThreshold}`,
                              })}
                        </span>
                      )}
                    </div>
                    <DeliveryZoneDropdown
                      zones={deliveryConfig.zones}
                      selectedZoneId={selectedDeliveryZoneId}
                      onSelectZone={(zoneId) => {
                        hasUserManuallySelectedZoneRef.current = true;
                        setSelectedDeliveryZoneId(zoneId);
                        if (zoneId !== autoDetectedZoneId) {
                          setAutoDetectedZoneId(null);
                        }
                        if (validationError?.field === "deliveryZone") {
                          setValidationError(null);
                        }
                      }}
                      autoDetected={Boolean(
                        selectedDeliveryZoneId &&
                        autoDetectedZoneId &&
                        selectedDeliveryZoneId === autoDetectedZoneId
                      )}
                      hasError={validationError?.field === "deliveryZone"}
                      isFreeDelivery={isFreeDelivery}
                      currency={currency}
                      locale={locale}
                      placeholder={t("selectDeliveryArea")}
                    />
                    {validationError?.field === "deliveryZone" && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-200">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                        <span>{validationError.message}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Date & Time Selection Card */}
              <div className="rounded-2xl border border-stone-200/80 bg-white p-3.5 shadow-xs space-y-3.5 overflow-hidden">
                {/* Emergency Notice from Florist */}
                {liveStatus?.emergencyNotice && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-300/80 bg-amber-50/90 p-2.5 text-xs text-amber-950 shadow-2xs">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-bold text-[11px] text-amber-900">Notice from Florist:</div>
                      <p className="mt-0.5 text-[11px] text-amber-800 leading-relaxed">
                        {liveStatus.emergencyNotice}
                      </p>
                    </div>
                  </div>
                )}

                {/* Date Input */}
                <div id="checkout-date-section" className="w-full min-w-0">
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-stone-500" />
                      <span>{t("fulfillmentDate")}</span>
                    </label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={isTodayPaused || areTodayDeliveriesClosed}
                        onClick={() => {
                          setQuickDate(0);
                          if (validationError?.field === "date") setValidationError(null);
                        }}
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-medium transition-all ${
                          isTodayPaused || areTodayDeliveriesClosed
                            ? "opacity-60 cursor-not-allowed bg-stone-100 text-stone-400"
                            : "cursor-pointer"
                        } ${
                          isToday && !isTodayPaused && !areTodayDeliveriesClosed
                            ? "font-bold shadow-2xs"
                            : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                        }`}
                        style={
                          isToday && !isTodayPaused && !areTodayDeliveriesClosed
                            ? {
                                borderColor: primaryColor,
                                backgroundColor: `${primaryColor}14`,
                                color: primaryColor,
                              }
                            : undefined
                        }
                      >
                        {isTodayPaused
                          ? t("todayPaused")
                          : areTodayDeliveriesClosed
                          ? t("todayClosed")
                          : t("today")}
                      </button>
                      <button
                        type="button"
                        disabled={isTomorrowBlocked || isTomorrowDateRestricted}
                        onClick={() => {
                          setQuickDate(1);
                          if (validationError?.field === "date") setValidationError(null);
                        }}
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-medium transition-all ${
                          isTomorrowBlocked || isTomorrowDateRestricted
                            ? "opacity-60 cursor-not-allowed bg-stone-100 text-stone-400"
                            : "cursor-pointer"
                        } ${
                          selectedDate === tomorrowStr && !isTomorrowBlocked && !isTomorrowDateRestricted
                            ? "font-bold shadow-2xs"
                            : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                        }`}
                        style={
                          selectedDate === tomorrowStr && !isTomorrowBlocked && !isTomorrowDateRestricted
                            ? {
                                borderColor: primaryColor,
                                backgroundColor: `${primaryColor}14`,
                                color: primaryColor,
                              }
                            : undefined
                        }
                      >
                        {isTomorrowBlocked
                          ? t("tomorrowBlocked")
                          : isTomorrowDateRestricted
                          ? `${t("tomorrow")} (Closed)`
                          : t("tomorrow")}
                      </button>
                    </div>
                  </div>

                  {/* Holiday Sold-Out Banner with 1-Tap Alternative Date Recommendation */}
                  {isHolidaySoldOut && holidayRule ? (
                    <div className="mb-2.5 rounded-xl border border-rose-300 bg-rose-50/95 p-3 text-xs text-rose-950 shadow-2xs space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                        <div>
                          <p className="font-bold text-rose-950">
                            {t("holidayCapacitySoldOut", {
                              holiday: locale === "zh" ? holidayRule.nameZh || holidayRule.name : holidayRule.name,
                              date: selectedDate,
                            })}
                          </p>
                          {holidayRule.alternativeDate && (
                            <p className="mt-1 text-[11px] text-rose-800 leading-relaxed">
                              {t("suggestAlternativeDate", {
                                altLabel:
                                  locale === "zh"
                                    ? holidayRule.alternativeDateLabelZh || holidayRule.alternativeDateLabel || holidayRule.alternativeDate
                                    : holidayRule.alternativeDateLabel || holidayRule.alternativeDate,
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      {holidayRule.alternativeDate && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate(holidayRule.alternativeDate!);
                            setValidationError(null);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-bold text-white shadow-xs transition-transform active:scale-98 cursor-pointer"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <span>
                            {t("switchToAltDate", {
                              altLabel:
                                locale === "zh"
                                  ? holidayRule.alternativeDateLabelZh || holidayRule.alternativeDateLabel || holidayRule.alternativeDate
                                  : holidayRule.alternativeDateLabel || holidayRule.alternativeDate,
                            })}
                          </span>
                        </button>
                      )}
                    </div>
                  ) : holidayRule ? (
                    /* Active Holiday Peak Season Notice & Broad Courier Windows */
                    <div className="mb-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-2.5 text-xs text-rose-950 shadow-2xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-950">
                        <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-rose-800 border border-rose-200">
                          {t("holidayPeakBadge")}
                        </span>
                        <span>{locale === "zh" ? holidayRule.nameZh || holidayRule.name : holidayRule.name}</span>
                      </div>
                      <p className="text-[11px] text-rose-800 leading-relaxed">
                        {locale === "zh"
                          ? holidayRule.noticeMessageZh || holidayRule.noticeMessage || t("holidayPeakNotice")
                          : holidayRule.noticeMessage || t("holidayPeakNotice")}
                      </p>
                      {holidayRule.peakSlots && holidayRule.peakSlots.length > 0 && (
                        <p className="text-[10px] text-rose-700/90 font-medium italic pt-0.5">
                          {t("holidayBroadWindowsNotice", {
                            holiday: locale === "zh" ? holidayRule.nameZh || holidayRule.name : holidayRule.name,
                          })}
                        </p>
                      )}
                    </div>
                  ) : null}

                  {/* Regular Warning if selected date is a closed day or emergency paused (non-holiday) */}
                  {!isHolidaySoldOut && selectedDateClosedInfo.isClosed && (
                    <div className="mb-2 rounded-xl border border-rose-200 bg-rose-50/70 p-2.5 text-xs text-rose-900 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                      <p className="font-semibold text-[11px] text-rose-950 leading-relaxed">
                        {selectedDateClosedInfo.reason ||
                          t("storeClosedDayWarning", {
                            reason: selectedDateClosedInfo.reason,
                          })}
                      </p>
                    </div>
                  )}
                  <div className="relative w-full min-w-0">
                    <input
                      id="checkout-delivery-date"
                      aria-label={t("fulfillmentDate")}
                      type="date"
                      min={minSelectableDate}
                      value={selectedDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setSelectedDate("");
                          return;
                        }
                        if (val < todayStr) {
                          setSelectedDate(minSelectableDate);
                          reportValidationError("date", t("validationPastDate"));
                          return;
                        }
                        if (val < minSelectableDate) {
                          setSelectedDate(minSelectableDate);
                          reportValidationError(
                            "date",
                            isTodayPaused ? t("validationTodayPaused") : t("validationStoreClosedDate")
                          );
                          return;
                        }
                        setSelectedDate(val);
                        if (validationError?.field === "date") {
                          setValidationError(null);
                        }
                      }}
                      required
                      className={`block w-full max-w-full min-w-0 box-border appearance-none rounded-xl border px-3 py-2.5 text-base sm:text-xs shadow-2xs focus:outline-none transition-all ${
                        validationError?.field === "date"
                          ? "border-red-400 bg-white ring-2 ring-red-100 text-stone-900"
                          : "border-stone-200 bg-stone-50/50 text-stone-900 focus:border-stone-400 focus:bg-white"
                      }`}
                    />
                  </div>
                  {validationError?.field === "date" && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-200">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                      <span>{validationError.message}</span>
                    </p>
                  )}
                </div>

                {/* Time picker section (Exact Time vs Time Range) */}
                <div id="checkout-time-section" className="scroll-mt-4">
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

                  {/* Inline Error Notice for Time if missing */}
                  {validationError?.field === "time" && (
                    <div className="mb-2 flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200/90 px-3 py-2 text-xs font-semibold text-red-700 animate-in fade-in duration-200">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                      <span>{validationError.message}</span>
                    </div>
                  )}

                  {/* If all deliveries for today are closed */}
                  {isToday && areTodayDeliveriesClosed ? (
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
                          id="checkout-delivery-time"
                          aria-label={t("exactDeliveryTime")}
                          type="time"
                          min={minTimeForExactInput}
                          max={operatingEnd}
                          value={exactTimeInput}
                          onChange={(e) => handleExactTimeChange(e.target.value)}
                          required
                          className={`block w-full max-w-full min-w-0 box-border appearance-none rounded-xl border px-3 py-2.5 text-base sm:text-xs shadow-2xs focus:outline-none transition-all ${
                            validationError?.field === "time"
                              ? "border-red-400 bg-white ring-2 ring-red-100 text-stone-900"
                              : "border-stone-200 bg-stone-50/50 text-stone-900 focus:border-stone-400 focus:bg-white"
                          }`}
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
                      className={`transition-all rounded-2xl ${
                        validationError?.field === "time"
                          ? "p-1.5 border border-red-300 ring-2 ring-red-100/80 bg-red-50/20"
                          : ""
                      } ${
                        configuredSlots.length > 4
                          ? "grid grid-cols-2 gap-2"
                          : "grid grid-cols-1 gap-1.5"
                      }`}
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
                            onClick={() => {
                              setSelectedTime(slotString);
                              if (validationError?.field === "time") {
                                setValidationError(null);
                              }
                            }}
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

                  {/* Rush Order Warning Banner (Strategy 2) */}
                  {isToday && isSelectedSlotRush && rushStrategy === "rush_with_warning" && (
                    <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-amber-300/90 bg-amber-50/95 p-3 text-xs shadow-2xs">
                      <Zap className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-950">
                          <span>{t("rushOrderTitle")}</span>
                          <span className="rounded-md bg-amber-200/90 px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-amber-900 border border-amber-300">
                            {t("rushBadge")}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-amber-900/90 leading-relaxed">
                          {t("rushOrderNotice")}
                        </p>
                      </div>
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
                <div className="space-y-1">
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                    <input
                      id="checkout-recipient-name"
                      type="text"
                      name="name"
                      autoComplete="name"
                      aria-label={t("recipientNamePlaceholder")}
                      placeholder={t("recipientNamePlaceholder")}
                      value={customerDetails.name}
                      onChange={(e) => {
                        setCustomerDetails({ name: e.target.value });
                        if (validationError?.field === "name") {
                          setValidationError(null);
                        }
                      }}
                      required
                      className={`w-full rounded-xl border h-11 pr-3 pl-10 text-base sm:text-xs shadow-2xs focus:outline-none transition-all ${
                        validationError?.field === "name"
                          ? "border-red-400 bg-white ring-2 ring-red-100 text-stone-900"
                          : "border-stone-200 bg-stone-50/50 text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white"
                      }`}
                    />
                  </div>
                  {validationError?.field === "name" && (
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-200 px-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                      <span>{validationError.message}</span>
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                    <input
                      id="checkout-recipient-phone"
                      type="tel"
                      name="tel"
                      autoComplete="tel"
                      aria-label={t("phonePlaceholder")}
                      placeholder={t("phonePlaceholder")}
                      value={customerDetails.phone}
                      onChange={(e) => {
                        setCustomerDetails({ phone: e.target.value });
                        if (validationError?.field === "phone") {
                          setValidationError(null);
                        }
                      }}
                      required
                      className={`w-full rounded-xl border h-11 pr-3 pl-10 text-base sm:text-xs shadow-2xs focus:outline-none transition-all ${
                        validationError?.field === "phone"
                          ? "border-red-400 bg-white ring-2 ring-red-100 text-stone-900"
                          : "border-stone-200 bg-stone-50/50 text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white"
                      }`}
                    />
                  </div>
                  {validationError?.field === "phone" && (
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-200 px-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                      <span>{validationError.message}</span>
                    </p>
                  )}
                </div>

                {/* Delivery Address (only when Delivery is selected) */}
                {fulfillmentMethod === "delivery" && (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
                      <textarea
                        id="checkout-delivery-address"
                        name="street-address"
                        autoComplete="street-address"
                        aria-label={t("addressPlaceholder")}
                        placeholder={t("addressPlaceholder")}
                        rows={2}
                        value={customerDetails.deliveryAddress}
                        onChange={(e) => {
                          setCustomerDetails({ deliveryAddress: e.target.value });
                          if (validationError?.field === "deliveryAddress") {
                            setValidationError(null);
                          }
                        }}
                        required
                        className={`w-full rounded-xl border pt-3 pb-2.5 pr-3 pl-10 text-base sm:text-xs leading-5 shadow-2xs focus:outline-none transition-all resize-none ${
                          validationError?.field === "deliveryAddress"
                            ? "border-red-400 bg-white ring-2 ring-red-100 text-stone-900"
                            : "border-stone-200 bg-stone-50/50 text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white"
                        }`}
                      />
                    </div>
                    {validationError?.field === "deliveryAddress" && (
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600 animate-in fade-in duration-200 px-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                        <span>{validationError.message}</span>
                      </p>
                    )}
                    {/* Auto-detected Zone Confirmation Hint */}
                    {autoDetectedZone && isDeliveryFeeEnabled && selectedDeliveryZoneId === autoDetectedZone.id && (
                      <div className="flex items-center justify-between text-[11px] text-stone-600 px-1 pt-0.5 animate-in fade-in duration-200">
                        <span className="flex items-center gap-1.5 font-medium text-stone-700 truncate">
                          <Sparkles className="h-3 w-3 text-stone-500 shrink-0" />
                          <span className="truncate">
                            {t("autoDetected")}:{" "}
                            <strong className="text-stone-900 font-semibold">
                              {locale === "zh"
                                ? autoDetectedZone.nameZh || autoDetectedZone.name
                                : autoDetectedZone.name}
                            </strong>
                          </span>
                        </span>
                        <span className="text-[10px] font-semibold text-stone-500 shrink-0 ml-2">
                          {isFreeDelivery
                            ? t("freeDelivery")
                            : `+${currency} ${autoDetectedZone.fee.toFixed(2)}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Complimentary Card Message (Nullable / Optional) */}
                <div className="space-y-1.5">
                  <div className="relative">
                    <Heart className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
                    <textarea
                      id="checkout-card-message"
                      aria-label={t("cardMessagePlaceholder")}
                      placeholder={t("cardMessagePlaceholder")}
                      rows={2}
                      value={customerDetails.cardMessage}
                      onChange={(e) =>
                        setCustomerDetails({ cardMessage: e.target.value })
                      }
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/50 pt-3 pb-2.5 pr-8 pl-10 text-base sm:text-xs leading-5 text-stone-900 placeholder:text-stone-400 shadow-2xs focus:border-stone-400 focus:bg-white focus:outline-none transition-all resize-none"
                    />
                    {customerDetails.cardMessage && (
                      <button
                        type="button"
                        onClick={() => setCustomerDetails({ cardMessage: "" })}
                        className="absolute top-3.5 right-2.5 rounded-full p-0.5 text-stone-400 hover:bg-stone-200 hover:text-stone-600 transition-colors cursor-pointer"
                        title={locale === "zh" ? "清空留言" : "Clear message"}
                        aria-label="Clear card message"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Quick Fill Preset Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[11px] text-stone-400 shrink-0 select-none">
                      {locale === "zh" ? "快捷填写：" : "Quick fill:"}
                    </span>
                    {quickCardPresets.map((preset) => {
                      const isSelected = customerDetails.cardMessage === preset.text;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setCustomerDetails({ cardMessage: "" });
                            } else {
                              setCustomerDetails({ cardMessage: preset.text });
                            }
                          }}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] transition-all cursor-pointer ${
                            isSelected
                              ? "font-semibold shadow-2xs"
                              : "border border-stone-200/80 bg-stone-50/80 text-stone-600 hover:bg-stone-100/80 hover:border-stone-300"
                          }`}
                          style={
                            isSelected
                              ? {
                                  borderColor: primaryColor,
                                  backgroundColor: `${primaryColor}14`,
                                  color: primaryColor,
                                }
                              : undefined
                          }
                        >
                          <span>{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Inline Validation Alert */}
              {validationError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200/90 animate-in fade-in duration-200 flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{validationError.message}</span>
                </div>
              )}

              {/* Itemized Order Price Summary Card */}
              <div className="rounded-2xl border border-stone-200/80 bg-stone-50/80 p-3.5 space-y-2 text-xs text-stone-600 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-700 flex items-center gap-1.5">
                    <span>{t("subtotal")}</span>
                    {quantity > 1 && (
                      <span className="rounded-md bg-stone-200/70 px-1.5 py-0.2 text-[10px] font-semibold text-stone-700">
                        x{quantity}
                      </span>
                    )}
                    {isHolidayInclusive && holidayRule && (
                      <span className="rounded-md bg-rose-100/80 px-1.5 py-0.2 text-[10px] font-semibold text-rose-800 border border-rose-200">
                        {locale === "zh" ? holidayRule.nameZh || holidayRule.name : holidayRule.name}
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-stone-900">
                    {currency} {bouquetTotal.toFixed(2)}
                  </span>
                </div>

                {activeAddons.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-stone-700">
                      {t("addonsTotal")} ({activeAddons.length})
                    </span>
                    <span className="font-semibold text-stone-900">
                      +{currency} {addonsTotal.toFixed(2)}
                    </span>
                  </div>
                )}

                {isDelivery && isDeliveryFeeEnabled && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-stone-700">
                      {t("deliveryFee")}
                      {selectedZone && (
                        <span className="text-[10px] text-stone-400 font-normal ml-1">
                          ({locale === "zh" ? selectedZone.nameZh || selectedZone.name : selectedZone.name})
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-stone-900">
                      {isFreeDelivery ? (
                        <span className="text-emerald-700 font-bold">
                          {t("freeDeliveryApplied")}
                        </span>
                      ) : (
                        `+${currency} ${deliveryFee.toFixed(2)}`
                      )}
                    </span>
                  </div>
                )}

                {/* Peak Holiday Surcharge Line Item (only shown if not in all-inclusive pricing mode) */}
                {holidayLineItemSurcharge > 0 && holidayRule && !isHolidayInclusive && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-stone-700 flex items-center gap-1.5">
                      <span>{locale === "zh" ? "节日高峰附加费" : "Peak Holiday Surcharge"}</span>
                      {quantity > 1 && (
                        <span className="rounded-md bg-rose-100/80 px-1.5 py-0.2 text-[10px] font-semibold text-rose-800">
                          x{quantity}
                        </span>
                      )}
                      <span className="rounded-md bg-rose-100/80 px-1.5 py-0.2 text-[10px] font-semibold text-rose-800 border border-rose-200">
                        {locale === "zh" ? holidayRule.nameZh || holidayRule.name : holidayRule.name}
                        {holidayRule.surchargeType === "percentage" ? ` (+${holidayRule.surchargeAmount}%)` : ""}
                      </span>
                    </span>
                    <span className="font-semibold text-stone-900">
                      +{currency} {holidaySurchargeTotal.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-stone-200/70 pt-2 text-sm font-bold text-stone-900">
                  <span>{t("orderTotal")}</span>
                  <span className="text-base tabular-nums" style={{ color: primaryColor, fontVariantNumeric: "tabular-nums" }}>
                    {currency} {grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Sold Out Warning Banner (if product sold out) */}
              {isProductSoldOut && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs shadow-xs">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-rose-900">
                      {locale === "zh" ? "该花礼今日已售罄" : "This floral arrangement is sold out today"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-rose-700 leading-relaxed">
                      {locale === "zh"
                        ? "花艺师今日该花材配额已用完，暂无法提交订单。请返回首页选购其他精美花礼。"
                        : "Today's floral stem quota for this arrangement is fully booked. Please browse our other available bouquets."}
                    </p>
                  </div>
                </div>
              )}

              {/* Legal & Policy Disclaimer */}
              <p className="text-center text-[10px] text-stone-400 leading-relaxed pb-2">
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

            {/* Persistent Step 1 Footer (never scrolls away) */}
            <div
              className="sh-f shrink-0 flex items-center justify-between gap-3.5 border-t border-stone-200/80 bg-white px-[18px] py-3 shadow-lg"
              style={{
                paddingBottom: "calc(14px + env(safe-area-inset-bottom, 0px))",
              }}
            >
              <div className="flex flex-col shrink-0 min-w-[115px] sm:min-w-[130px] pr-1">
                <small className="text-[11px] font-medium text-stone-400 uppercase tracking-wider leading-none">
                  {t("orderTotal") || "Total"}
                </small>
                <b
                  className="amt text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight leading-tight mt-0.5 tabular-nums"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {currency} {animatedTotal.toFixed(2)}
                </b>
              </div>

              <button
                type="submit"
                form="checkout-step1-form"
                disabled={isProductSoldOut || isCheckingStock}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-stone-800 ${
                  isProductSoldOut
                    ? "bg-stone-200 text-stone-400 border border-stone-300/80 cursor-not-allowed shadow-none"
                    : isCheckingStock
                    ? "opacity-80 cursor-wait text-white shadow-md"
                    : "text-white shadow-md active:scale-98 hover:opacity-95 cursor-pointer"
                }`}
                style={!isProductSoldOut ? { backgroundColor: primaryColor } : undefined}
              >
                {isCheckingStock ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span className="font-medium text-white truncate">
                      {locale === "zh" ? "正在实时核验鲜花配额..." : "Verifying live stock quota..."}
                    </span>
                  </>
                ) : isProductSoldOut ? (
                  <>
                    <Ban className="h-4 w-4 text-stone-400" />
                    <span className="font-semibold text-stone-500 truncate">
                      {locale === "zh" ? "今日已售罄 • 无法提交订单" : "Sold Out Today • Cannot Order"}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-white/90 truncate">
                      {t("proceedToPayment")}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : checkoutStep === 2 ? (
          <div
            key="checkout-step-2"
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4"
          >
            <TngPaymentView
              store={store}
              pricingDisplayMode={liveStatus?.holidayPricingDisplay}
            />
          </div>
        ) : (
          <div
            key="checkout-step-3"
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-0"
          >
            <OrderSuccess
              key={selectedProduct ? `success-${selectedProduct.id}` : "success"}
              message={whatsappMessage}
              waUrl={whatsappUrl}
              onBack={resetCheckout}
            />
          </div>
        )}
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
