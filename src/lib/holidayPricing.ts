import {
  StoreConfig,
  HolidayPeakRule,
  HolidayPricingDisplayMode,
  DeliveryTimeSlot,
} from "@/config/stores";

/**
 * Returns the matching peak holiday rule for a given target delivery date (YYYY-MM-DD),
 * or null if no holiday rule applies.
 */
export function getHolidayRuleForDate(
  store: StoreConfig,
  dateStr?: string | null
): HolidayPeakRule | null {
  if (!dateStr || !store.holidayPeakConfig || store.holidayPeakConfig.enabled === false) {
    return null;
  }

  const rules = store.holidayPeakConfig.rules || [];
  for (const rule of rules) {
    if (dateStr >= rule.startDate && dateStr <= rule.endDate) {
      return rule;
    }
  }

  return null;
}

/**
 * Calculates the dynamic surcharge amount for a given bouquet price.
 * Supports both fixed amounts (e.g. +RM 35) and percentages (e.g. +20%).
 */
export function calculateHolidaySurcharge(
  productPrice: number,
  rule: HolidayPeakRule
): number {
  if (rule.surchargeType === "percentage") {
    const raw = (productPrice * rule.surchargeAmount) / 100;
    return Math.round(raw);
  }
  return Number(rule.surchargeAmount) || 0;
}

/**
 * Checks whether the holiday rule directly charges the surcharge to the product price
 * (all-inclusive pricing mode) rather than showing a separate surcharge fee line item.
 * Supports an optional live overrideMode set dynamically by the florist owner.
 */
export function isHolidayPricingInclusive(
  rule?: HolidayPeakRule | null,
  overrideMode?: HolidayPricingDisplayMode
): boolean {
  if (!rule) return false;
  const mode = overrideMode || rule.pricingDisplay;
  return mode === "inclusive";
}

/**
 * Calculates the effective product price for the target date.
 * If the rule is configured as "inclusive", the product price absorbs the holiday surge directly.
 * Otherwise, it retains the base product price.
 */
export function getEffectiveProductPrice(
  basePrice: number,
  rule?: HolidayPeakRule | null,
  overrideMode?: HolidayPricingDisplayMode
): number {
  if (!rule || !isHolidayPricingInclusive(rule, overrideMode)) {
    return basePrice;
  }
  return basePrice + calculateHolidaySurcharge(basePrice, rule);
}

/**
 * Calculates the separate line-item surcharge to display at checkout.
 * Returns 0 if the rule is in "inclusive" mode (since it is already in the product price).
 */
export function getHolidayLineItemSurcharge(
  basePrice: number,
  rule?: HolidayPeakRule | null,
  overrideMode?: HolidayPricingDisplayMode
): number {
  if (!rule || isHolidayPricingInclusive(rule, overrideMode)) {
    return 0;
  }
  return calculateHolidaySurcharge(basePrice, rule);
}

/**
 * Generates an informative customer-facing label for the holiday surcharge breakdown.
 */
export function formatHolidaySurchargeLabel(
  rule: HolidayPeakRule,
  calculatedAmount: number,
  currency: string = "RM",
  isZh: boolean = false
): string {
  const name = isZh ? rule.nameZh || rule.name : rule.name;
  if (rule.surchargeType === "percentage") {
    return `${name} (+${rule.surchargeAmount}%): +${currency} ${calculatedAmount.toFixed(2)}`;
  }
  return `${name}: +${currency} ${calculatedAmount.toFixed(2)}`;
}

/**
 * Converts holiday broad peak slots (strings) into DeliveryTimeSlot objects
 * so the checkout drawer slot picker can seamlessly switch on holiday dates.
 */
export function convertPeakSlotsToDeliveryTimeSlots(
  peakSlotStrings: string[]
): DeliveryTimeSlot[] {
  return peakSlotStrings.map((slotStr, idx) => {
    // Generate cutoff hour based on typical morning/afternoon/evening windows
    let cutoffHour = 21;
    if (slotStr.toLowerCase().includes("morning") || slotStr.toLowerCase().includes("早")) {
      cutoffHour = 13;
    } else if (slotStr.toLowerCase().includes("afternoon") || slotStr.toLowerCase().includes("午")) {
      cutoffHour = 18;
    }

    return {
      id: `holiday_slot_${idx}`,
      label: slotStr,
      cutoffHour,
      cutoffMinute: 0,
    };
  });
}
