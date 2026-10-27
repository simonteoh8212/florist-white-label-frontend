import { StoreConfig, STORES, HolidayPricingDisplayMode } from "@/config/stores";
import { useCartStore } from "@/store/cartStore";
import { useLocaleStore } from "@/i18n/localeStore";
import {
  getHolidayRuleForDate,
  calculateHolidaySurcharge,
  isHolidayPricingInclusive,
  getEffectiveProductPrice,
  getHolidayLineItemSurcharge,
} from "@/lib/holidayPricing";

/**
 * Resolves the active store configuration.
 */
function resolveStore(providedStore?: StoreConfig): StoreConfig {
  if (providedStore) return providedStore;
  const storeFromCart = useCartStore.getState().currentStore;
  if (storeFromCart) return storeFromCart;
  // Default fallback
  return STORES.autarix;
}

/**
 * Generates a formatted order summary text message for WhatsApp.
 * Uses bulletproof typography and clean bullet points that NEVER corrupt
 * into question mark diamonds () across any browser, OS, or WhatsApp client.
 */
export function generateWhatsAppMessage(
  storeOverride?: StoreConfig,
  pricingDisplayOverride?: HolidayPricingDisplayMode
): string {
  const store = resolveStore(storeOverride);
  const {
    selectedProduct,
    selectedAddonIds,
    fulfillmentMethod,
    selectedDeliveryZoneId,
    selectedDate,
    selectedTime,
    customerDetails,
  } = useCartStore.getState();

  const locale = useLocaleStore.getState().locale || "en";
  const isZh = locale === "zh";

  const isDelivery = fulfillmentMethod === "delivery";
  const fulfillmentLabel = isDelivery
    ? isZh
      ? "专人送花上门"
      : "Home Delivery"
    : isZh
      ? "工作室门店自取"
      : "Store Self-Pickup";

  const currency = store.currency || "RM";
  const baseProductPrice = selectedProduct?.price || 0;

  // Resolve active add-ons
  const availableAddons = store.addons || [];
  const activeAddons = availableAddons.filter((a) =>
    selectedAddonIds.includes(a.id)
  );
  const addonsTotal = activeAddons.reduce((sum, a) => sum + a.price, 0);

  // Resolve delivery zone and fee
  const deliveryConfig = store.deliveryFeeConfig;
  const isDeliveryFeeEnabled = Boolean(isDelivery && deliveryConfig?.enabled);
  const selectedZone = isDeliveryFeeEnabled
    ? deliveryConfig?.zones.find((z) => z.id === selectedDeliveryZoneId)
    : null;
  const baseDeliveryFee = selectedZone?.fee || 0;
  const isFreeDelivery = Boolean(
    isDeliveryFeeEnabled &&
      deliveryConfig?.freeDeliveryThreshold &&
      baseProductPrice + addonsTotal >= deliveryConfig.freeDeliveryThreshold
  );
  const deliveryFee = isDeliveryFeeEnabled
    ? isFreeDelivery
      ? 0
      : baseDeliveryFee
    : 0;

  // Holiday peak rule and surcharge calculation
  const holidayRule = getHolidayRuleForDate(store, selectedDate);
  const isHolidayInclusive = Boolean(
    holidayRule && isHolidayPricingInclusive(holidayRule, pricingDisplayOverride)
  );
  const effectiveProductPrice = getEffectiveProductPrice(
    baseProductPrice,
    holidayRule,
    pricingDisplayOverride
  );
  const holidayLineItemSurcharge = getHolidayLineItemSurcharge(
    baseProductPrice,
    holidayRule,
    pricingDisplayOverride
  );

  const grandTotal = effectiveProductPrice + addonsTotal + deliveryFee + holidayLineItemSurcharge;

  const productName = selectedProduct
    ? isZh
      ? selectedProduct.nameZh || selectedProduct.name
      : selectedProduct.name
    : isZh
      ? "精选花礼"
      : "Floral Arrangement";

  const productPriceSuffixZh = isHolidayInclusive && holidayRule
    ? ` (已含${holidayRule.nameZh || holidayRule.name}当季定价)`
    : "";
  const productPriceSuffixEn = isHolidayInclusive && holidayRule
    ? ` (Includes ${holidayRule.name} Seasonal Price)`
    : "";

  const messageLines: string[] = isZh
    ? [
        `*新订单 - ${store.name.toUpperCase()}*`,
        ``,
        `*订购花礼：*`,
        `\u2022 商品：${productName}`,
        `\u2022 单价：${currency} ${effectiveProductPrice.toFixed(2)}${productPriceSuffixZh}`,
      ]
    : [
        `*NEW ORDER - ${store.name.toUpperCase()}*`,
        ``,
        `*ORDERED ITEM:*`,
        `\u2022 Product: ${productName}`,
        `\u2022 Price: ${currency} ${effectiveProductPrice.toFixed(2)}${productPriceSuffixEn}`,
      ];

  // Optional Add-ons section
  if (activeAddons.length > 0) {
    if (isZh) {
      messageLines.push(``, `*加购精美配饰：*`);
      activeAddons.forEach((addon) => {
        const addonName = addon.nameZh || addon.name;
        messageLines.push(
          `\u2022 ${addonName} (+${currency} ${addon.price.toFixed(2)})`
        );
      });
    } else {
      messageLines.push(``, `*OPTIONAL ADD-ONS:*`);
      activeAddons.forEach((addon) => {
        messageLines.push(
          `\u2022 ${addon.name} (+${currency} ${addon.price.toFixed(2)})`
        );
      });
    }
  }

  // Check if order is same-day rush
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const isOrderToday = selectedDate === todayStr;

  let isRushOrder = false;
  if (isOrderToday && selectedTime && store.deliveryTimeConfig?.rushStrategy === "rush_with_warning") {
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const thresh = store.deliveryTimeConfig?.rushThresholdMinutes ?? 45;
    const matchingSlot = store.deliveryTimeConfig?.slots?.find((s) => {
      const slotString = s.hours ? `${s.label} (${s.hours})` : s.label;
      return slotString === selectedTime || s.label === selectedTime;
    });
    if (matchingSlot) {
      const startMins = (matchingSlot.cutoffHour - 1) * 60;
      const endMins = matchingSlot.cutoffHour * 60 + (matchingSlot.cutoffMinute ?? 0);
      if (
        (currentMins >= startMins && currentMins < endMins) ||
        (startMins - currentMins <= thresh && startMins > currentMins)
      ) {
        isRushOrder = true;
      }
    }
  }

  // Fulfillment details
  if (isZh) {
    messageLines.push(
      ``,
      `*履约配送信息：*`,
      `\u2022 方式：${fulfillmentLabel}`
    );
    if (isDelivery && selectedZone) {
      const zoneName = selectedZone.nameZh || selectedZone.name;
      messageLines.push(`\u2022 配送区域：${zoneName}`);
    }
    messageLines.push(
      `\u2022 预约日期：${selectedDate || "未指定"}${holidayRule ? ` [${holidayRule.nameZh || holidayRule.name}节日高峰]` : ""}`,
      `\u2022 期望时段：${selectedTime || "未指定"}${isRushOrder ? " [加急配送]" : ""}`
    );
    if (isRushOrder) {
      messageLines.push(`\u2022 加急提示：临近配送时段，具体时间以花店最终确认为准`);
    }
  } else {
    messageLines.push(
      ``,
      `*FULFILLMENT DETAILS:*`,
      `\u2022 Method: ${fulfillmentLabel}`
    );
    if (isDelivery && selectedZone) {
      messageLines.push(`\u2022 Delivery Area: ${selectedZone.name}`);
    }
    messageLines.push(
      `\u2022 Preferred Date: ${selectedDate || "Not specified"}${holidayRule ? ` [${holidayRule.name} Peak Holiday]` : ""}`,
      `\u2022 Preferred Time: ${selectedTime || "Not specified"}${isRushOrder ? " [Same-Day Rush]" : ""}`
    );
    if (isRushOrder) {
      messageLines.push(`\u2022 Rush Notice: Placed close to window. Confirmed subject to florist capacity.`);
    }
  }

  // Address
  if (isDelivery) {
    messageLines.push(
      isZh
        ? `\u2022 送花地址：${customerDetails.deliveryAddress || "未填写"}`
        : `\u2022 Delivery Address: ${customerDetails.deliveryAddress || "N/A"}`
    );
  } else if (store.pickupAddress) {
    messageLines.push(
      isZh
        ? `\u2022 自取地址：${store.pickupAddress}`
        : `\u2022 Pickup Location: ${store.pickupAddress}`
    );
  }

  // Customer Details
  if (isZh) {
    messageLines.push(
      ``,
      `*顾客联络资料：*`,
      `\u2022 订购人/收花人：${customerDetails.name || "未填写"}`,
      `\u2022 联络电话：${customerDetails.phone || "未填写"}`
    );
  } else {
    messageLines.push(
      ``,
      `*CUSTOMER DETAILS:*`,
      `\u2022 Recipient / Customer: ${customerDetails.name || "N/A"}`,
      `\u2022 Contact Phone: ${customerDetails.phone || "N/A"}`
    );
  }

  // Greeting card & Notes
  if (customerDetails.cardMessage && customerDetails.cardMessage.trim()) {
    messageLines.push(
      isZh
        ? `\u2022 贺卡留言："${customerDetails.cardMessage.trim()}"`
        : `\u2022 Card Message: "${customerDetails.cardMessage.trim()}"`
    );
  }

  if (customerDetails.notes && customerDetails.notes.trim()) {
    messageLines.push(
      isZh
        ? `\u2022 订单备注："${customerDetails.notes.trim()}"`
        : `\u2022 Notes: "${customerDetails.notes.trim()}"`
    );
  }

  // Price Summary breakdown
  if (isZh) {
    messageLines.push(
      ``,
      `*款项明细：*`,
      `\u2022 花礼小计：${currency} ${effectiveProductPrice.toFixed(2)}`
    );
    if (activeAddons.length > 0) {
      messageLines.push(
        `\u2022 加购配饰：${currency} ${addonsTotal.toFixed(2)}`
      );
    }
    if (isDelivery && isDeliveryFeeEnabled) {
      messageLines.push(
        isFreeDelivery
          ? `\u2022 配送运费：${currency} 0.00 (已享满额免运)`
          : `\u2022 配送运费：${currency} ${deliveryFee.toFixed(2)}`
      );
    }
    if (holidayLineItemSurcharge > 0 && holidayRule && !isHolidayInclusive) {
      const holidayName = holidayRule.nameZh || holidayRule.name;
      const pctInfo = holidayRule.surchargeType === "percentage" ? ` (+${holidayRule.surchargeAmount}%)` : "";
      messageLines.push(
        `\u2022 节日高峰附加费 (${holidayName}${pctInfo})：${currency} ${holidayLineItemSurcharge.toFixed(2)}`
      );
    }
    messageLines.push(
      `\u2022 应付总额：*${currency} ${grandTotal.toFixed(2)}*`
    );
  } else {
    messageLines.push(
      ``,
      `*PRICE BREAKDOWN:*`,
      `\u2022 Bouquet Subtotal: ${currency} ${effectiveProductPrice.toFixed(2)}`
    );
    if (activeAddons.length > 0) {
      messageLines.push(
        `\u2022 Add-ons Total: ${currency} ${addonsTotal.toFixed(2)}`
      );
    }
    if (isDelivery && isDeliveryFeeEnabled) {
      messageLines.push(
        isFreeDelivery
          ? `\u2022 Delivery Fee: ${currency} 0.00 (FREE - Promo Applied)`
          : `\u2022 Delivery Fee: ${currency} ${deliveryFee.toFixed(2)}`
      );
    }
    if (holidayLineItemSurcharge > 0 && holidayRule && !isHolidayInclusive) {
      const pctInfo = holidayRule.surchargeType === "percentage" ? ` (+${holidayRule.surchargeAmount}%)` : "";
      messageLines.push(
        `\u2022 Seasonal Peak Surcharge (${holidayRule.name}${pctInfo}): ${currency} ${holidayLineItemSurcharge.toFixed(2)}`
      );
    }
    messageLines.push(
      `\u2022 Total Payable: *${currency} ${grandTotal.toFixed(2)}*`
    );
  }

  // Payment Method
  if (isZh) {
    messageLines.push(
      ``,
      `*付款方式：*`,
      `\u2022 Touch 'n Go (TNG) 电子钱包`,
      `\u2022 收款账户：${store.tngAccountName || store.name}`,
      `\u2022 状态：已通过 TNG 付款（转账收据截图已附在下方）`,
      ``,
      `_感谢您向 ${store.name} 订购花礼！_`
    );
  } else {
    messageLines.push(
      ``,
      `*PAYMENT METHOD:*`,
      `\u2022 Touch 'n Go (TNG) eWallet`,
      `\u2022 Account: ${store.tngAccountName || store.name}`,
      `\u2022 Status: Paid via TNG (Payment proof screenshot attached below)`,
      ``,
      `_Thank you for ordering with ${store.name}!_`
    );
  }

  return messageLines.join("\n");
}

/**
 * Constructs the WhatsApp URL using the reliable api.whatsapp.com endpoint
 * to ensure parameters never get stripped or corrupted by wa.me redirect proxies.
 */
export function getWhatsAppUrl(storeOverride?: StoreConfig): string {
  const store = resolveStore(storeOverride);
  const digits = store.whatsapp.replace(/\D/g, "");
  const cleanNumber = digits.startsWith("60")
    ? digits
    : digits.startsWith("0")
      ? `6${digits}`
      : `60${digits}`;
  const text = generateWhatsAppMessage(store);
  return `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(text)}`;
}

/**
 * Triggers redirection to WhatsApp with pre-filled tenant order data.
 * Automatically utilizes direct app scheme on mobile (iOS/Android) and
 * falls back to api.whatsapp.com on desktop/web.
 */
export function sendOrderViaWhatsApp(
  storeOverride?: StoreConfig,
  pricingDisplayOverride?: HolidayPricingDisplayMode
): void {
  const store = resolveStore(storeOverride);
  const digits = store.whatsapp.replace(/\D/g, "");
  const cleanNumber = digits.startsWith("60")
    ? digits
    : digits.startsWith("0")
      ? `6${digits}`
      : `60${digits}`;
  const text = generateWhatsAppMessage(store, pricingDisplayOverride);
  const encodedText = encodeURIComponent(text);

  if (typeof window !== "undefined") {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      // Direct native app scheme on mobile (iOS & Android) - bypasses web browser redirect layer completely
      window.location.href = `whatsapp://send?phone=${cleanNumber}&text=${encodedText}`;
      return;
    }

    // On Desktop/Web, open api.whatsapp.com directly in a new window
    const webUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedText}`;
    const newWindow = window.open(webUrl, "_blank");
    if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
      window.location.href = webUrl;
    }
  }
}
