import { StoreConfig, Product, generateHourlySlots } from "./stores";
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
    deliveryTimeConfig: {
      type: "range",
      slots: generateHourlySlots(10, 20),
      rushStrategy: "rush_with_warning", // Flexible: allows rush orders with prominent warning banner & WhatsApp confirmation
      rushThresholdMinutes: 45,
      closedDaysOfWeek: [0], // Closed on Sundays (0 = Sun)
    },

    // Peak Holiday Dynamic Surcharge & Capacity Engine
    holidayPeakConfig: {
      enabled: true,
      rules: [
        {
          id: "valentines_peak",
          name: "Valentine's Day Peak",
          nameZh: "情人节鲜花高峰期",
          startDate: "2027-02-12",
          endDate: "2027-02-15",
          surchargeType: "fixed",
          surchargeAmount: 35,
          // Florist Choice: "separate_surcharge" (shows +RM 35 line item) or "inclusive" (directly rolls +RM 35 into bouquet price)
          pricingDisplay: "separate_surcharge",
          maxDailyOrders: 60,
          alternativeDate: "2027-02-13",
          alternativeDateLabel: "Valentine's Eve (Feb 13)",
          alternativeDateLabelZh: "情人节前夕 (2月13日)",
          peakSlots: [
            "Morning Peak (09:00 AM – 01:00 PM)",
            "Afternoon Peak (01:00 PM – 06:00 PM)",
            "Evening Dinner (06:00 PM – 09:00 PM)",
          ],
          noticeMessage: "Wholesale fresh roses experience seasonal market adjustments during Valentine's peak. Broad delivery windows ensure safe courier arrival.",
          noticeMessageZh: "情人节高峰期新鲜玫瑰花材受产地拍卖价上涨影响，按节日统一定价制作。采用大时段派送以确保避开交通高峰准时送达。",
        },
        {
          id: "mothers_day_peak",
          name: "Mother's Day Peak",
          nameZh: "母亲节鲜花高峰期",
          startDate: "2027-05-08",
          endDate: "2027-05-10",
          surchargeType: "percentage",
          surchargeAmount: 20,
          // All-inclusive mode: directly charges +20% to product base price (no separate extra fee line item)
          pricingDisplay: "inclusive",
          maxDailyOrders: 50,
          alternativeDate: "2027-05-08",
          alternativeDateLabel: "Mother's Day Eve (May 8)",
          alternativeDateLabelZh: "母亲节前夕 (5月8日)",
          peakSlots: [
            "Morning Delivery (09:00 AM – 01:00 PM)",
            "Afternoon Delivery (01:00 PM – 06:00 PM)",
          ],
          noticeMessage: "Seasonal premium carnations and imported blooms experience holiday price adjustments.",
          noticeMessageZh: "母亲节期间康乃馨与进口鲜花行情调整，包含节日专属花礼保鲜制作。",
        },
        {
          id: "upcoming_peak_demo",
          name: "Peak Weekend Holiday (Demo)",
          nameZh: "周末鲜花高峰期 (测试演示)",
          startDate: (() => {
            const d = new Date();
            d.setDate(d.getDate() + 2);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          })(),
          endDate: (() => {
            const d = new Date();
            d.setDate(d.getDate() + 4);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          })(),
          surchargeType: "fixed",
          surchargeAmount: 25,
          // Switch between "separate_surcharge" or "inclusive" whenever you prefer
          pricingDisplay: "separate_surcharge",
          maxDailyOrders: 40,
          alternativeDate: (() => {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          })(),
          alternativeDateLabel: "Pre-Peak Day",
          alternativeDateLabelZh: "高峰前夕",
          peakSlots: [
            "Morning Window (09:00 AM – 01:00 PM)",
            "Afternoon Window (01:00 PM – 06:00 PM)",
            "Evening Window (06:00 PM – 09:00 PM)",
          ],
          noticeMessage: "Peak weekend demand: seasonal wholesale market adjustment applies.",
          noticeMessageZh: "周末鲜花高峰时段：适用当季花市批发行情附加费。",
        },
      ],
    },

    // Dynamic Delivery Fee / Zones (Penang Island & Mainland)
    deliveryFeeConfig: {
      enabled: true,
      freeDeliveryThreshold: 250, // Free delivery for orders RM 250 and above
      zones: [
        {
          id: "island_central",
          name: "Georgetown / Ayer Itam / Farlim / Jelutong",
          nameZh: "乔治市 / 亚依淡 / 发林 / 日落洞",
          fee: 10,
        },
        {
          id: "island_outer",
          name: "Bayan Lepas / Gelugor / Tg Tokong / Gurney",
          nameZh: "峇六拜 / 牛汝莪 / 丹绒道光 / 新关仔角",
          fee: 18,
        },
        {
          id: "penang_mainland",
          name: "Penang Mainland (Butterworth / Bukit Mertajam)",
          nameZh: "槟城威省 (北海 / 大山脚 / 诗布朗再也)",
          fee: 30,
        },
      ],
      defaultZoneId: "island_central",
    },

    // Dynamic Gift Add-ons
    addons: [
      {
        id: "led_lights",
        name: "Warm Fairy LED Lights",
        nameZh: "暖光 LED 氛围小彩灯",
        price: 10,
        icon: "sparkles",
      },
      {
        id: "foil_balloon",
        name: "Happy Birthday Foil Balloon",
        nameZh: "生日快乐铝箔精美气球",
        price: 18,
        icon: "balloon",
      },
      {
        id: "ferrero_box",
        name: "Ferrero Rocher Chocolates (3 pcs)",
        nameZh: "金莎巧克力心意礼盒 (3粒装)",
        price: 15,
        icon: "gift",
      },
    ],

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
      rushStrategy: "rush_with_warning", // Flexible: allows rush orders with prominent warning banner & WhatsApp confirmation
    },

    // Dynamic Delivery Fee / Zones (Klang Valley)
    deliveryFeeConfig: {
      enabled: true,
      freeDeliveryThreshold: 300,
      zones: [
        {
          id: "mont_kiara",
          name: "Mont Kiara / Sri Hartamas / Dutamas",
          nameZh: "满家乐 / 金地花园 / 杜达玛斯",
          fee: 10,
        },
        {
          id: "kl_city_bangsar",
          name: "KL City Centre / Bangsar / Petaling Jaya",
          nameZh: "吉隆坡市中心 / 孟沙 / 八打灵再也",
          fee: 20,
        },
        {
          id: "greater_kl",
          name: "Shah Alam / Subang Jaya / Klang / Puchong",
          nameZh: "莎阿南 / 梳邦再也 / 巴生 / 蒲种",
          fee: 35,
        },
      ],
      defaultZoneId: "mont_kiara",
    },

    // Dynamic Gift Add-ons
    addons: [
      {
        id: "calligraphy_card",
        name: "Handcrafted Calligraphy Greeting Card",
        nameZh: "手写烫金祝福贺卡",
        price: 12,
        icon: "card",
      },
      {
        id: "plant_tonic",
        name: "Organic Botanical Tonic & Mister",
        nameZh: "有机植物滋养喷雾",
        price: 25,
        icon: "gift",
      },
      {
        id: "fairy_lights",
        name: "Warm Amber Fairy String Lights",
        nameZh: "暖琥珀色氛围小灯串",
        price: 10,
        icon: "sparkles",
      },
    ],

    // Multi-language localization configuration
    enableLanguageSelector: true,
    defaultLocale: "en",
    supportedLocales: ["en", "zh"],

    // Products loaded from src/config/tenants/greenland/products.json
    products: greenlandProducts as Product[],
  },
};
