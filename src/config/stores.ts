export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  tag?: string;
  inStock?: boolean;

  // Optional Chinese localization
  nameZh?: string;
  descriptionZh?: string;
  categoryZh?: string;
  tagZh?: string;
}

export type PaymentMode = "static_qr" | "gateway";

export type DeliveryTimeType = "range" | "exact";

export interface DeliveryTimeSlot {
  id: string;
  label: string; // e.g. "10:00 AM – 11:00 AM" or "Morning"
  hours?: string; // Optional detailed hours subtitle, e.g. "10:00 AM – 1:00 PM"
  cutoffHour: number; // 24-hr format (0-23)
  cutoffMinute?: number; // 0-59 (default 0)
}

export interface DeliveryZone {
  id: string;
  name: string;
  nameZh?: string;
  fee: number;
}

export interface DeliveryFeeConfig {
  enabled: boolean;
  freeDeliveryThreshold?: number; // e.g. 250 (RM 250 or more = free delivery)
  zones: DeliveryZone[];
  defaultZoneId?: string;
}

export interface StoreAddon {
  id: string;
  name: string;
  nameZh?: string;
  price: number;
  description?: string;
  descriptionZh?: string;
  icon?: "sparkles" | "balloon" | "gift" | "heart" | "card";
}

export type RushStrategy = "rush_with_warning" | "strict_cutoff" | "flexible";

export interface DeliveryTimeConfig {
  type: DeliveryTimeType; // "range" or "exact"
  // For type === "range": customize any number of time ranges (e.g. hourly slots)
  slots?: DeliveryTimeSlot[];
  // For type === "exact": customer inputs exact delivery time
  operatingHours?: {
    start: string; // e.g. "09:00"
    end: string; // e.g. "19:00"
  };
  sameDayLeadHours?: number; // Advance hours needed for same-day delivery (e.g. 2)

  // Rush order strategy for same-day delivery:
  // - "rush_with_warning": (Recommended) Slots stay open until cutoff, but display an urgent rush warning if ordered close to window.
  // - "strict_cutoff": Slots close strictly when the hour starts (e.g. 10:00 AM slot closes at 10:00 AM).
  // - "flexible": Standard booking window throughout operating hours.
  rushStrategy?: RushStrategy;
  rushThresholdMinutes?: number; // Minutes before slot start/end considered rush (default 45)

  // Regular weekly closed days (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  closedDaysOfWeek?: number[];

  // Specific holiday or blackout dates (YYYY-MM-DD)
  blackoutDates?: string[];
}

export type HolidayPricingDisplayMode = "separate_surcharge" | "inclusive";

export interface HolidayPeakRule {
  id: string; // e.g. "valentines" | "mothers_day"
  name: string; // e.g. "Valentine's Day Peak"
  nameZh?: string; // e.g. "情人节鲜花高峰期"
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  surchargeType: "fixed" | "percentage"; // Both fixed amount (+RM 35) and percentage (+20%) supported
  surchargeAmount: number; // e.g. 35 for +RM 35, or 20 for +20%
  /**
   * Pricing display strategy for festive peak season:
   * - "separate_surcharge" (default): Keep base product price and show a separate "Peak Holiday Surcharge" line item.
   * - "inclusive": Directly incorporate the festive surge into the product price (e.g. RM 168 + RM 35 = RM 203) with no extra fee line item.
   */
  pricingDisplay?: HolidayPricingDisplayMode;
  maxDailyOrders?: number; // Studio daily capacity limit (e.g. 70 orders)
  alternativeDate?: string; // e.g. "2027-02-13" (suggest Valentine's Eve when sold out)
  alternativeDateLabel?: string; // e.g. "Valentine's Eve (Feb 13)"
  alternativeDateLabelZh?: string; // e.g. "情人节前夕 (2月13日)"
  peakSlots?: string[]; // Optional broad fulfillment windows during peak traffic (e.g. Morning, Afternoon, Evening)
  noticeMessage?: string; // Optional customer explanation
  noticeMessageZh?: string;
}

export interface HolidayPeakConfig {
  enabled: boolean;
  rules: HolidayPeakRule[];
}

export interface StoreConfig {
  id: string;
  name: string;
  slug: string;
  companyName?: string; // Registered business / company entity name (e.g. "Autarix Floral & Gift")
  ssmNumber?: string; // SSM registration number (e.g. "PG0523418-V" or "202301048291 (1528211-T)")
  whatsapp: string; // E.164 string format, e.g. "+60123456789"
  primaryColor: string; // Hex color string, e.g. "#BE185D"
  logo: string; // Path or URL to store logo, e.g. "/stores/autarix/logo.svg"
  tagline?: string;
  currency?: string;
  pickupAddress?: string;
  googleMapsUrl?: string; // Optional direct Google Maps location URL
  tngQrUrl?: string;
  tngAccountName?: string;
  tngDeepLink?: string;
  paymentMode?: PaymentMode;
  gatewayCheckoutUrl?: string;

  // Delivery Time Configuration (Time range slots vs Exact time, operating days)
  deliveryTimeConfig?: DeliveryTimeConfig;

  // Peak Holiday Dynamic Surcharge & Capacity Engine (Valentine's, Mother's Day)
  holidayPeakConfig?: HolidayPeakConfig;

  // Dynamic Delivery Fee / Zone Configuration (per-tenant)
  deliveryFeeConfig?: DeliveryFeeConfig;

  // Dynamic Gift Add-ons (Balloons, lights, chocolates, cards)
  addons?: StoreAddon[];

  // Storefront layout options
  showHeroBanner?: boolean; // Defaults to true; set false to hide Hero Banner / Studio Introduction

  // Multi-language localization configuration (per-tenant switch)
  enableLanguageSelector?: boolean; // Defaults to true; set false to hide switcher
  defaultLocale?: "en" | "zh"; // Default starting locale
  supportedLocales?: ("en" | "zh")[]; // Available locales for this store
  // Staff Terminal PIN (Default for merchant access)
  adminPin?: string;

  products: Product[];
}

/**
 * Convenient utility to generate hourly delivery time slots (e.g. 10 AM – 11 AM, 11 AM – 12 PM, etc.)
 *
 * @param startHour 24h start hour (e.g. 9 for 9:00 AM)
 * @param endHour 24h end hour (e.g. 20 for 8:00 PM)
 * @param cutoffLeadMinutes Advance minutes before slot start to close bookings
 */
export function generateHourlySlots(
  startHour: number = 10,
  endHour: number = 20
): DeliveryTimeSlot[] {
  const slots: DeliveryTimeSlot[] = [];
  const formatHour12 = (h: number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:00 ${ampm}`;
  };

  for (let h = startHour; h < endHour; h++) {
    const startLabel = formatHour12(h);
    const endLabel = formatHour12(h + 1);
    slots.push({
      id: `${h}-${h + 1}`,
      label: `${startLabel} – ${endLabel}`,
      cutoffHour: h + 1, // slot closes when the hour window concludes
      cutoffMinute: 0,
    });
  }

  return slots;
}

/**
 * Returns localized product name, description, category, and tag based on active locale.
 */
export function getProductLocalized(
  product: Product,
  locale: "en" | "zh" = "en"
): {
  name: string;
  description: string;
  category: string;
  tag?: string;
} {
  if (locale === "zh") {
    return {
      name: product.nameZh || product.name,
      description: product.descriptionZh || product.description,
      category: product.categoryZh || product.category,
      tag: product.tagZh || product.tag,
    };
  }
  return {
    name: product.name,
    description: product.description,
    category: product.category,
    tag: product.tag,
  };
}

/**
 * Parses a time string (e.g. "7:00 PM", "07:00 PM", "7 PM", "19:00", "09:30")
 * into total minutes from midnight (0 - 1439).
 */
export function parseTimeStringToMinutes(str: string): number | null {
  if (!str) return null;
  const trimmed = str.trim();
  // 12-hour format: "7:00 PM", "7 PM", "07:00 AM"
  const m12 = trimmed.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const m = m12[2] ? parseInt(m12[2], 10) : 0;
    const isPM = m12[3].toUpperCase() === "PM";
    if (isPM && h < 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return h * 60 + m;
  }
  // 24-hour format: "19:00", "09:30"
  const m24 = trimmed.match(/(\d{1,2}):(\d{2})/);
  if (m24) {
    const h = parseInt(m24[1], 10);
    const m = parseInt(m24[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return h * 60 + m;
  }
  return null;
}

/**
 * Parses a delivery slot range string into { startMinutes, endMinutes }.
 * Supports:
 * - "7:00 PM – 8:00 PM" (en-dash)
 * - "7:00 PM - 8:00 PM" (hyphen)
 * - "Morning Peak (09:00 AM – 01:00 PM)"
 * - "19:00"
 */
export function parseSlotRange(
  slotStr: string
): { startMinutes: number; endMinutes: number } | null {
  if (!slotStr) return null;
  const splitRegex = /[\u2013\u2014\-]|(?:\bto\b)/i;
  const parts = slotStr.split(splitRegex);
  const startMinutes = parseTimeStringToMinutes(parts[0]);
  if (startMinutes === null) return null;
  const endPart = parts.slice(1).join(" ");
  const endMinutes = endPart ? parseTimeStringToMinutes(endPart) : null;
  return {
    startMinutes,
    endMinutes: endMinutes !== null ? endMinutes : startMinutes + 60,
  };
}

/**
 * Checks whether a given delivery date and slot qualifies as a Same-Day Rush Order.
 *
 * An order is a rush order if:
 * 1. The target date is today (Asia/Kuala_Lumpur).
 * 2. Current time is already inside the slot window (e.g. 5:15 PM inside 5:00 - 6:00 PM),
 *    OR the slot starts within `thresholdMinutes` (e.g. 45 mins).
 */
export function checkIfSlotIsRush(
  targetDate: string,
  targetSlot: string,
  thresholdMinutes: number = 45,
  slotsConfig?: DeliveryTimeSlot[]
): boolean {
  if (!targetDate || !targetSlot) return false;

  // 1. Must be today in Malaysia Time (Asia/Kuala_Lumpur)
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
  }).format(now);

  if (targetDate !== todayStr) {
    return false; // Future or past dates are never same-day rush
  }

  // 2. Current time in minutes from midnight (in Asia/Kuala_Lumpur)
  const klParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const curHour = parseInt(klParts.find((p) => p.type === "hour")?.value || "0", 10);
  const curMin = parseInt(klParts.find((p) => p.type === "minute")?.value || "0", 10);
  const currentTotalMinutes = curHour * 60 + curMin;

  // 3. Match against configured slots if provided
  if (slotsConfig && slotsConfig.length > 0) {
    const matched = slotsConfig.find((s) => {
      const labelWithHours = s.hours ? `${s.label} (${s.hours})` : s.label;
      return (
        s.label === targetSlot ||
        labelWithHours === targetSlot ||
        s.id === targetSlot
      );
    });
    if (matched) {
      const startHour = matched.cutoffHour - 1;
      const startMinutes = startHour * 60;
      const endMinutes = matched.cutoffHour * 60 + (matched.cutoffMinute ?? 0);

      if (currentTotalMinutes >= startMinutes && currentTotalMinutes < endMinutes) {
        return true;
      }
      if (startMinutes > currentTotalMinutes && startMinutes - currentTotalMinutes <= thresholdMinutes) {
        return true;
      }
      return false;
    }
  }

  // 4. Fallback: Parse from time string
  const range = parseSlotRange(targetSlot);
  if (range) {
    if (currentTotalMinutes >= range.startMinutes && currentTotalMinutes < range.endMinutes) {
      return true;
    }
    if (range.startMinutes > currentTotalMinutes && range.startMinutes - currentTotalMinutes <= thresholdMinutes) {
      return true;
    }
    return false;
  }

  return false;
}

// Modular Tenant Stores Data (Loaded from dedicated stores.data.ts)
import { STORES } from "./stores.data";
export { STORES };

/**
 * Helper to fetch store configuration by slug.
 */
export function getStoreBySlug(slug: string): StoreConfig | undefined {
  return STORES[slug.toLowerCase()];
}

/**
 * Returns all store slugs for static generation or routing.
 */
export function getAllStoreSlugs(): string[] {
  return Object.keys(STORES);
}

