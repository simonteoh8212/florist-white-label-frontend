import { StoreConfig, STORES } from "@/config/stores";
import { useCartStore } from "@/store/cartStore";
import { useLocaleStore } from "@/i18n/localeStore";

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
export function generateWhatsAppMessage(storeOverride?: StoreConfig): string {
  const store = resolveStore(storeOverride);
  const {
    selectedProduct,
    fulfillmentMethod,
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
  const priceStr = selectedProduct
    ? selectedProduct.price.toFixed(2)
    : "0.00";

  const productName = selectedProduct
    ? isZh
      ? selectedProduct.nameZh || selectedProduct.name
      : selectedProduct.name
    : isZh
      ? "精选花礼"
      : "Floral Arrangement";

  const messageLines = isZh
    ? [
        `*新订单 - ${store.name.toUpperCase()}*`,
        ``,
        `*订购花礼：*`,
        `\u2022 商品：${productName}`,
        `\u2022 金额：${currency} ${priceStr}`,
        ``,
        `*履约配送信息：*`,
        `\u2022 方式：${fulfillmentLabel}`,
        `\u2022 预约日期：${selectedDate || "未指定"}`,
        `\u2022 期望时段：${selectedTime || "未指定"}`,
        ``,
        `*顾客联络资料：*`,
        `\u2022 姓名：${customerDetails.name || "未填写"}`,
        `\u2022 电话：${customerDetails.phone || "未填写"}`,
      ]
    : [
        `*NEW ORDER - ${store.name.toUpperCase()}*`,
        ``,
        `*ORDERED ITEM:*`,
        `\u2022 Product: ${productName}`,
        `\u2022 Amount: ${currency} ${priceStr}`,
        ``,
        `*FULFILLMENT DETAILS:*`,
        `\u2022 Method: ${fulfillmentLabel}`,
        `\u2022 Preferred Date: ${selectedDate || "Not specified"}`,
        `\u2022 Preferred Time: ${selectedTime || "Not specified"}`,
        ``,
        `*CUSTOMER DETAILS:*`,
        `\u2022 Name: ${customerDetails.name || "N/A"}`,
        `\u2022 Contact: ${customerDetails.phone || "N/A"}`,
      ];

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
        ? `\u2022 备注："${customerDetails.notes.trim()}"`
        : `\u2022 Customer Notes: "${customerDetails.notes.trim()}"`
    );
  }

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
export function sendOrderViaWhatsApp(storeOverride?: StoreConfig): void {
  const store = resolveStore(storeOverride);
  const digits = store.whatsapp.replace(/\D/g, "");
  const cleanNumber = digits.startsWith("60")
    ? digits
    : digits.startsWith("0")
      ? `6${digits}`
      : `60${digits}`;
  const text = generateWhatsAppMessage(store);
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
