export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  tag?: string;

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

  // Delivery Time Configuration (Time range slots vs Exact time)
  deliveryTimeConfig?: DeliveryTimeConfig;

  // Multi-language localization configuration (per-tenant switch)
  enableLanguageSelector?: boolean; // Defaults to true; set false to hide switcher
  defaultLocale?: "en" | "zh"; // Default starting locale
  supportedLocales?: ("en" | "zh")[]; // Available locales for this store

  products: Product[];
}

// Modular Tenant Product Catalogs (Easily imported via CSV or edited per tenant)
import autarixProducts from "./tenants/autarix/products.json";
import greenlandProducts from "./tenants/greenland/products.json";

export const STORES: Record<string, StoreConfig> = {
  autarix: {
    id: "store_autarix",
    name: "Autarix Florist & Gift",
    companyName: "Autarix Florist & Gift",
    ssmNumber: "PG0523418-V",
    slug: "autarix",
    whatsapp: "+6012-542 0555",
    primaryColor: "#BE185D", // Luxe Crimson / Rose
    logo: "/stores/autarix/logo.webp",
    tagline: "Bespoke Artisanal Bouquets & Preserved Floral Art",
    currency: "RM",
    pickupAddress: "1-G-6, Medan Angsana 4, Farlim Business Centre, 11500 Ayer Itam, Pulau Pinang",
    googleMapsUrl: "https://maps.app.goo.gl/LqXTrwJFXAhr1rtA7",
    tngQrUrl: "/stores/autarix/tng-qr.svg",
    tngAccountName: "Autarix Florist & Gift (TNG eWallet)",
    tngDeepLink: "tngewallet://",
    paymentMode: "static_qr",
    gatewayCheckoutUrl: "https://checkout.hitpayapp.com/pay/autarix-demo",

    // Delivery time configuration: 1-hour time ranges throughout operating hours (10:00 AM – 8:00 PM)
    // Store clients can use generateHourlySlots(startHour, endHour) or pass custom slot objects
    deliveryTimeConfig: {
      type: "range",
      slots: generateHourlySlots(10, 20),
    },

    // Multi-language localization configuration
    enableLanguageSelector: false,
    defaultLocale: "en",
    supportedLocales: ["en", "zh"],

    // Products loaded from src/config/tenants/autarix/products.json
    products: autarixProducts as Product[],
  },

  greenland: {
    id: "store_greenland",
    name: "Greenland Botanical & Living Florals",
    companyName: "Greenland Botanical Sdn. Bhd.",
    ssmNumber: "202301048291 (1528211-T)",
    slug: "greenland",
    whatsapp: "+60198765432",
    primaryColor: "#059669", // Botanical Emerald
    logo: "/stores/greenland/logo.svg",
    tagline: "Sustainable Living Plants, Cascading Orchids & Wild Botanicals",
    currency: "RM",
    pickupAddress: "Lot 4B, The Greenhouse Pavilion, Mont Kiara, 50480 Kuala Lumpur, Malaysia",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=The+Greenhouse+Pavilion+Mont+Kiara+50480+Kuala+Lumpur",
    tngQrUrl: "/stores/greenland/tng-qr.svg",
    tngAccountName: "Greenland Botanical Co. (TNG eWallet)",
    tngDeepLink: "tngewallet://",
    paymentMode: "static_qr",
    gatewayCheckoutUrl: "https://checkout.hitpayapp.com/pay/greenland-demo",

    // Delivery time configuration: Exact time selection with operating hours and 2 hours lead time
    deliveryTimeConfig: {
      type: "exact",
      operatingHours: {
        start: "09:00",
        end: "19:00",
      },
      sameDayLeadHours: 2,
    },

    // Multi-language localization configuration
    enableLanguageSelector: true,
    defaultLocale: "en",
    supportedLocales: ["en", "zh"],

    // Products loaded from src/config/tenants/greenland/products.json
    products: greenlandProducts as Product[],
  },
};

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
 * Convenient utility to generate hourly delivery time slots (e.g. 10 AM – 11 AM, 11 AM – 12 PM, etc.)
 *
 * @param startHour 24h start hour (e.g. 9 for 9:00 AM)
 * @param endHour 24h end hour (e.g. 20 for 8:00 PM)
 * @param cutoffLeadMinutes Advance minutes before slot start to close bookings (defaults to 0, which means cutoff is at slot start or slot end)
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
      cutoffHour: h + 1, // slot closes when the hour window concludes (or configure as needed)
      cutoffMinute: 0,
    });
  }

  return slots;
}
