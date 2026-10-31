"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  StoreConfig,
  STORES,
  getProductLocalized,
  HolidayPricingDisplayMode,
} from "@/config/stores";
import { useCartStore } from "@/store/cartStore";
import { getWhatsAppUrl, sendOrderViaWhatsApp } from "@/utils/whatsapp";
import { useTranslation } from "@/i18n/localeStore";
import {
  getHolidayRuleForDate,
  calculateHolidaySurcharge,
  isHolidayPricingInclusive,
  getEffectiveProductPrice,
  getHolidayLineItemSurcharge,
} from "@/lib/holidayPricing";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { SuccessCheck } from "@/components/SuccessCheck";
import { CelebrateAnimation } from "@/components/CelebrateAnimation";

interface TngPaymentViewProps {
  store?: StoreConfig;
  pricingDisplayMode?: HolidayPricingDisplayMode;
}

export const TngPaymentView: React.FC<TngPaymentViewProps> = ({
  store: storeProp,
  pricingDisplayMode,
}) => {
  const currentStore = useCartStore((state) => state.currentStore);
  const store = storeProp || currentStore || STORES.autarix;
  const { t, locale } = useTranslation();

  const selectedProduct = useCartStore((state) => state.selectedProduct);
  const selectedAddonIds = useCartStore((state) => state.selectedAddonIds);
  const fulfillmentMethod = useCartStore((state) => state.fulfillmentMethod);
  const selectedDeliveryZoneId = useCartStore((state) => state.selectedDeliveryZoneId);
  const selectedDate = useCartStore((state) => state.selectedDate);

  const selectedLocalized = selectedProduct
    ? getProductLocalized(selectedProduct, locale)
    : null;
  const setCheckoutStep = useCartStore((state) => state.setCheckoutStep);
  const quantity = useCartStore((state) => state.quantity);

  const [hasCopiedAmount, setHasCopiedAmount] = useState(false);
  const [hasLaunchedApp, setHasLaunchedApp] = useState(false);

  const currency = store.currency || "RM";
  const baseProductPrice = selectedProduct?.price || 0;

  // Holiday surcharge & pricing display mode
  const holidayRule = getHolidayRuleForDate(store, selectedDate);
  const isHolidayInclusive = Boolean(
    holidayRule && isHolidayPricingInclusive(holidayRule, pricingDisplayMode)
  );
  const effectiveProductPrice = getEffectiveProductPrice(
    baseProductPrice,
    holidayRule,
    pricingDisplayMode
  );
  const holidayLineItemSurcharge = getHolidayLineItemSurcharge(
    baseProductPrice,
    holidayRule,
    pricingDisplayMode
  );

  // Active Add-ons
  const availableAddons = store.addons || [];
  const activeAddons = availableAddons.filter((a) =>
    selectedAddonIds.includes(a.id)
  );
  const addonsTotal = activeAddons.reduce((sum, a) => sum + a.price, 0);

  // Delivery Fee
  const isDelivery = fulfillmentMethod === "delivery";
  const deliveryConfig = store.deliveryFeeConfig;
  const isDeliveryFeeEnabled = Boolean(isDelivery && deliveryConfig?.enabled);
  const selectedZone = isDeliveryFeeEnabled
    ? deliveryConfig?.zones.find((z) => z.id === selectedDeliveryZoneId)
    : null;
  const baseDeliveryFee = selectedZone?.fee || 0;
  const bouquetTotal = effectiveProductPrice * quantity;
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

  const grandTotal = bouquetTotal + addonsTotal + deliveryFee + holidaySurchargeTotal;
  const priceFormatted = `${currency} ${grandTotal.toFixed(2)}`;

  const copyAmountToClipboard = () => {
    navigator.clipboard?.writeText(grandTotal.toFixed(2));
    setHasCopiedAmount(true);
    setTimeout(() => setHasCopiedAmount(false), 2500);
  };

  /**
   * Launches Touch 'n Go eWallet App on mobile devices via deep link
   * and copies the amount to the user's clipboard for effortless payment.
   */
  const handleOpenTngApp = () => {
    copyAmountToClipboard();
    setHasLaunchedApp(true);

    if (typeof window !== "undefined") {
      const deepLink = store.tngDeepLink || "tngewallet://";
      window.location.href = deepLink;
    }
  };

  /**
   * For Gateway mode: Redirects customer to dynamic merchant checkout
   */
  const handleProceedGateway = () => {
    if (typeof window !== "undefined" && store.gatewayCheckoutUrl) {
      const returnUrl = encodeURIComponent(`${window.location.origin}/checkout/success`);
      const checkoutUrl = `${store.gatewayCheckoutUrl}?amount=${grandTotal.toFixed(2)}&redirect_url=${returnUrl}`;
      window.location.href = checkoutUrl;
    }
  };

  const handleConfirmWhatsApp = () => {
    sendOrderViaWhatsApp(store, pricingDisplayMode);
  };

  const isGatewayMode = store.paymentMode === "gateway";
  const tngQrUrl = store.tngQrUrl || "/stores/autarix/tng-qr.webp";

  const renderAmountSummary = () => (
    <>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            {t("totalPayableAmount")}
          </span>
          <div className="mt-0.5 text-2xl font-black text-stone-900 tracking-tight">
            {priceFormatted}
          </div>
        </div>

        <button
          type="button"
          onClick={copyAmountToClipboard}
          className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-100 active:scale-95 transition-all cursor-pointer"
          title="Copy exact amount"
        >
          {hasCopiedAmount ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-bold">{t("copied")}</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-stone-500" />
              <span>{t("copy")}</span>
            </>
          )}
        </button>
      </div>

      {/* Itemized breakdown */}
      <div className="mt-3 space-y-1.5 border-t border-stone-100 pt-2.5 text-xs text-stone-600">
        {selectedProduct && (
          <div className="flex items-center justify-between">
            <span className="truncate font-medium text-stone-700 flex items-center gap-1.5">
              <span>{selectedLocalized?.name || selectedProduct.name}</span>
              {isHolidayInclusive && (
                <span className="text-[9px] font-semibold text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                  {t("holidayInclusiveBadge")}
                </span>
              )}
            </span>
            <span className="font-semibold text-stone-900 shrink-0">
              {currency} {effectiveProductPrice.toFixed(2)}
            </span>
          </div>
        )}

        {activeAddons.map((addon) => (
          <div
            key={addon.id}
            className="flex items-center justify-between text-[11px] text-stone-500"
          >
            <span className="truncate">
              + {locale === "zh" ? addon.nameZh || addon.name : addon.name}
            </span>
            <span className="font-medium shrink-0">
              +{currency} {addon.price.toFixed(2)}
            </span>
          </div>
        ))}

        {isDelivery && isDeliveryFeeEnabled && (
          <div className="flex items-center justify-between text-[11px] text-stone-500">
            <span className="truncate">
              {selectedZone
                ? locale === "zh"
                  ? selectedZone.nameZh || selectedZone.name
                  : selectedZone.name
                : t("deliveryFee")}
            </span>
            <span className="font-medium shrink-0">
              {isFreeDelivery
                ? t("freeDeliveryApplied")
                : `+${currency} ${deliveryFee.toFixed(2)}`}
            </span>
          </div>
        )}

        {holidayLineItemSurcharge > 0 && holidayRule && !isHolidayInclusive && (
          <div className="flex items-center justify-between text-[11px] text-rose-700">
            <span className="truncate font-medium">
              + {locale === "zh" ? holidayRule.nameZh || holidayRule.name : holidayRule.name}
              {holidayRule.surchargeType === "percentage" ? ` (+${holidayRule.surchargeAmount}%)` : ""}
            </span>
            <span className="font-medium shrink-0">
              +{currency} {holidayLineItemSurcharge.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex flex-col space-y-4 pb-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-stone-200/60 pb-2.5">
        <button
          type="button"
          onClick={() => setCheckoutStep(1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t("editOrderDetails")}</span>
        </button>

        <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>
            {isGatewayMode ? t("instantGatewayVerification") : t("proofVerification")}
          </span>
        </div>
      </div>

      {/* Animated Check & Celebration Effect (matching Screen 3) */}
      <div className="flex flex-col items-center text-center pt-1 pb-0.5">
        <SuccessCheck label={locale === "zh" ? "订单已提交" : "Order placed"}>
          <CelebrateAnimation loop pauseMs={2000} />
        </SuccessCheck>
        <p className="mt-2.5 text-sm font-bold text-stone-900 tracking-tight">
          {locale === "zh" ? "订单已提交！请完成下方付款" : "Order Placed! Complete Payment Below"}
        </p>
        <p className="mt-0.5 text-xs text-stone-500 leading-relaxed">
          {isGatewayMode
            ? locale === "zh"
              ? "您的花礼订单已保留，请点击下方按钮前往付款。"
              : "Your floral order is reserved — proceed below to pay securely."
            : locale === "zh"
            ? "请扫描 TNG 二维码付款，并通过 WhatsApp 发送付款截图。"
            : "Scan the Touch 'n Go QR below and send your receipt via WhatsApp."}
        </p>
      </div>

      {/* GATEWAY MODE: Automated 1-Click Checkout */}
      {isGatewayMode ? (
        <div className="space-y-4">
          {/* Payment Summary Box */}
          <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs">
            {renderAmountSummary()}
          </div>

          {/* Copy Notification Toast Banner */}
          {hasCopiedAmount && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                {t("amountCopiedBanner", { amount: priceFormatted })}
              </span>
            </div>
          )}

          <div className="rounded-2xl border border-blue-600/20 bg-blue-50/40 p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#0055B8] text-white">
              <QrCode className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">
              {t("tngAutomatedGateway")}
            </h3>
            <p className="mt-1 text-xs text-stone-600 leading-relaxed">
              {t("redirectGatewayDesc", { store: store.name })}
            </p>
          </div>

          <button
            type="button"
            onClick={handleProceedGateway}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0055B8] py-3.5 px-4 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-[#00479b] active:scale-98 transition-all cursor-pointer"
          >
            <span>{t("payViaTng", { amount: priceFormatted })}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* STATIC QR MODE: Unified QR Code + Amount Card + WhatsApp Proof Bridge */
        <div className="space-y-4">
          {/* Unified Touch 'n Go QR Code & Amount Card (QR code shown first, Amount below) */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs">
            {/* 1. Touch 'n Go QR Code Display (shown first) */}
            <div className="flex flex-col items-center">
               <div className="relative h-[300px] w-full rounded-xl overflow-hidden bg-white">
                  <Image
                    src={tngQrUrl}
                    alt={`${store.name} Touch 'n Go eWallet QR`}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>

              <p className="mt-2.5 text-center text-[11px] text-stone-500">
                {t("accountLabel")}{" "}
                <span className="font-bold text-stone-800">{store.tngAccountName || store.name}</span>
              </p>
            </div>

            {/* 2. Subtle Divider */}
            <div className="my-3.5 border-t border-stone-100" />

            {/* 3. Amount & Itemized Breakdown (grouped together) */}
            {renderAmountSummary()}
          </div>

          {/* Copy Notification Toast Banner */}
          {hasCopiedAmount && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                {t("amountCopiedBanner", { amount: priceFormatted })}
              </span>
            </div>
          )}

          {/* 3. Guidance Steps Card */}
          <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-3.5 text-xs">
            <p className="font-bold text-amber-950 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>{t("howToCompleteOrder")}</span>
            </p>
            <ol className="mt-2 list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-amber-900/90 pl-0.5">
              <li>{t("step2Guide", { amount: priceFormatted })}</li>
              <li>{t("step3Guide")}</li>
            </ol>
          </div>

          {/* 4. WhatsApp Confirmation Link */}
          <div className="pt-1">
            <a
              href={getWhatsAppUrl(store, pricingDisplayMode)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setCheckoutStep(3)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 px-4 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all duration-200 hover:bg-[#20ba59] active:scale-98 cursor-pointer no-underline"
            >
              <Image
                src="/icons/whatsapp.svg"
                alt="WhatsApp"
                width={20}
                height={20}
                className="h-5 w-5 brightness-0 invert shrink-0"
                unoptimized
              />
              <span>{t("confirmSendWhatsapp")}</span>
            </a>

            <p className="mt-2 text-center text-[11px] text-stone-400">
              {t("whatsappHelperText")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
