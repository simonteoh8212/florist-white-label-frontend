import { StoreConfig, STORES } from "@/config/stores";
import { useCartStore } from "@/store/cartStore";

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

  const isDelivery = fulfillmentMethod === "delivery";
  const fulfillmentLabel = isDelivery ? "Home Delivery 🚚" : "Store Self-Pickup 🏬";
  const currency = store.currency || "RM";

  const messageLines = [
    `🌸 *NEW ORDER - ${store.name.toUpperCase()}* 🌸`,
    ``,
    `💐 *ORDERED ITEM:*`,
    `• Product: ${selectedProduct ? selectedProduct.name : "Floral Arrangement"}`,
    `• Amount: ${currency} ${selectedProduct ? selectedProduct.price.toFixed(2) : "0.00"}`,
    ``,
    `📅 *FULFILLMENT DETAILS:*`,
    `• Method: ${fulfillmentLabel}`,
    `• Preferred Date: ${selectedDate || "Not specified"}`,
    `• Preferred Time: ${selectedTime || "Not specified"}`,
    ``,
    `👤 *CUSTOMER DETAILS:*`,
    `• Name: ${customerDetails.name || "N/A"}`,
    `• Contact: ${customerDetails.phone || "N/A"}`,
  ];

  if (isDelivery) {
    messageLines.push(`• Delivery Address: ${customerDetails.deliveryAddress || "N/A"}`);
  } else if (store.pickupAddress) {
    messageLines.push(`• Pickup Location: ${store.pickupAddress}`);
  }

  if (customerDetails.cardMessage && customerDetails.cardMessage.trim()) {
    messageLines.push(`• Card Message: "${customerDetails.cardMessage.trim()}"`);
  }

  if (customerDetails.notes && customerDetails.notes.trim()) {
    messageLines.push(`• Customer Notes: ${customerDetails.notes.trim()}`);
  }

  messageLines.push(
    ``,
    `💳 *PAYMENT METHOD:*`,
    `• Touch 'n Go (TNG) eWallet`,
    `• Account: ${store.tngAccountName || store.name}`,
    `• Status: Paid via TNG (Payment proof screenshot attached below 📸)`,
    ``,
    `✨ _Thank you for ordering with ${store.name}!_`
  );

  return messageLines.join("\n");
}

/**
 * Constructs the dynamic WhatsApp URL string based on the tenant store's WhatsApp number.
 */
export function getWhatsAppUrl(storeOverride?: StoreConfig): string {
  const store = resolveStore(storeOverride);
  const digits = store.whatsapp.replace(/\D/g, "");
  const cleanNumber = digits.startsWith("0") ? `6${digits}` : digits;
  const text = generateWhatsAppMessage(store);
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * Triggers browser redirection to WhatsApp with pre-filled tenant order data.
 */
export function sendOrderViaWhatsApp(storeOverride?: StoreConfig): void {
  const url = getWhatsAppUrl(storeOverride);

  if (typeof window !== "undefined") {
    const newWindow = window.open(url, "_blank");
    if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
      window.location.href = url;
    }
  }
}
