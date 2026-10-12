import { floristConfig } from "@/config/florist.config";
import { useCartStore } from "@/store/cartStore";

/**
 * Generates a formatted order summary text message for WhatsApp.
 */
export function generateWhatsAppMessage(): string {
  const {
    selectedProduct,
    fulfillmentMethod,
    selectedDate,
    selectedTime,
    customerDetails,
  } = useCartStore.getState();

  const isDelivery = fulfillmentMethod === "delivery";
  const fulfillmentLabel = isDelivery ? "Home Delivery 🚚" : "Store Self-Pickup 🏬";

  const messageLines = [
    `🌸 *NEW ORDER - ${floristConfig.storeName.toUpperCase()}* 🌸`,
    ``,
    `💐 *ORDERED ITEM:*`,
    `• Product: ${selectedProduct ? selectedProduct.name : "Floral Arrangement"}`,
    `• Amount: ${floristConfig.currency} ${selectedProduct ? selectedProduct.price.toFixed(2) : "0.00"}`,
    ``,
    `📅 *FULFILLMENT DETAILS:*`,
    `• Method: ${fulfillmentLabel}`,
    `• Preferred Date: ${selectedDate || "Not specified"}`,
    `• Preferred Time: ${selectedTime || "Not specified"}`,
    ``,
    `👤 *CUSTOMER DETAILS:*`,
    `• Name: ${customerDetails.name || "N/A"}`,
    `• Phone: ${customerDetails.phone || "N/A"}`,
  ];

  if (isDelivery) {
    messageLines.push(`• Delivery Address: ${customerDetails.deliveryAddress || "N/A"}`);
  } else if (floristConfig.pickupAddress) {
    messageLines.push(`• Pickup Location: ${floristConfig.pickupAddress}`);
  }

  if (customerDetails.cardMessage && customerDetails.cardMessage.trim()) {
    messageLines.push(`• Card Message: "${customerDetails.cardMessage.trim()}"`);
  }

  if (customerDetails.notes && customerDetails.notes.trim()) {
    messageLines.push(`• Special Notes: ${customerDetails.notes.trim()}`);
  }

  messageLines.push(
    ``,
    `💳 *PAYMENT CONFIRMATION:*`,
    `• Method: Touch 'n Go (TNG) eWallet`,
    `• Account: ${floristConfig.tngAccountName || floristConfig.storeName}`,
    `• Status: Paid via TNG QR (Payment proof screenshot attached below 📸)`,
    ``,
    `✨ _Thank you for ordering with ${floristConfig.storeName}!_`
  );

  return messageLines.join("\n");
}

/**
 * Constructs the WhatsApp direct link.
 */
export function getWhatsAppUrl(): string {
  const cleanNumber = floristConfig.whatsappNumber.replace(/\D/g, "");
  const text = generateWhatsAppMessage();
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * Triggers browser redirection to WhatsApp with pre-filled order data.
 */
export function sendOrderViaWhatsApp(): void {
  const url = getWhatsAppUrl();

  // On mobile devices, assigning directly to window.location or opening new tab
  if (typeof window !== "undefined") {
    // Attempt opening in a new tab first; if popup blocker prevents it, fallback to window.location
    const newWindow = window.open(url, "_blank");
    if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
      window.location.href = url;
    }
  }
}
