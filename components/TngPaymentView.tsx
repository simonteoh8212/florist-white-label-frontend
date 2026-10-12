"use client";

import React, { useState } from "react";
import Image from "next/image";
import { floristConfig } from "@/config/florist.config";
import { useCartStore } from "@/store/cartStore";
import { sendOrderViaWhatsApp } from "@/utils/whatsapp";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";

export const TngPaymentView: React.FC = () => {
  const selectedProduct = useCartStore((state) => state.selectedProduct);
  const setCheckoutStep = useCartStore((state) => state.setCheckoutStep);

  const [hasCopiedAmount, setHasCopiedAmount] = useState(false);
  const [hasLaunchedApp, setHasLaunchedApp] = useState(false);

  const priceFormatted = selectedProduct
    ? `${floristConfig.currency} ${selectedProduct.price.toFixed(2)}`
    : `${floristConfig.currency} 0.00`;

  const copyAmountToClipboard = () => {
    if (selectedProduct) {
      navigator.clipboard?.writeText(selectedProduct.price.toFixed(2));
      setHasCopiedAmount(true);
      setTimeout(() => setHasCopiedAmount(false), 2500);
    }
  };

  /**
   * Launches Touch 'n Go eWallet App on mobile devices via deep link
   * and copies the amount to the user's clipboard for effortless payment.
   */
  const handleOpenTngApp = () => {
    copyAmountToClipboard();
    setHasLaunchedApp(true);

    if (typeof window !== "undefined") {
      const deepLink = floristConfig.tngDeepLink || "tngewallet://";
      // Trigger deep link to open Touch 'n Go eWallet app
      window.location.href = deepLink;
    }
  };

  /**
   * For Gateway mode: Redirects customer to dynamic merchant checkout
   */
  const handleProceedGateway = () => {
    if (typeof window !== "undefined" && floristConfig.gatewayCheckoutUrl) {
      const returnUrl = encodeURIComponent(`${window.location.origin}/checkout/success`);
      const checkoutUrl = `${floristConfig.gatewayCheckoutUrl}?amount=${selectedProduct?.price || 0}&redirect_url=${returnUrl}`;
      window.location.href = checkoutUrl;
    }
  };

  const handleConfirmWhatsApp = () => {
    sendOrderViaWhatsApp();
  };

  const isGatewayMode = floristConfig.paymentMode === "gateway";

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
          <span>Edit Order Details</span>
        </button>

        <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>
            {isGatewayMode ? "Instant Gateway Verification" : "Proof Verification"}
          </span>
        </div>
      </div>

      {/* Payment Summary Box */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Total Payable Amount
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
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-stone-500" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {selectedProduct && (
          <div className="mt-3 flex items-center gap-2 border-t border-stone-100 pt-2.5 text-xs text-stone-600">
            <span className="font-semibold text-stone-900">Arrangement:</span>
            <span className="truncate font-medium">{selectedProduct.name}</span>
          </div>
        )}
      </div>

      {/* Copy Notification Toast Banner */}
      {hasCopiedAmount && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            Amount <strong>{priceFormatted}</strong> copied! Ready to paste into your eWallet.
          </span>
        </div>
      )}

      {/* GATEWAY MODE: Automated 1-Click Checkout */}
      {isGatewayMode ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-600/20 bg-blue-50/40 p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#0055B8] text-white">
              <QrCode className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">
              Touch &apos;n Go Automated Gateway
            </h3>
            <p className="mt-1 text-xs text-stone-600 leading-relaxed">
              You will be redirected directly to the Touch &apos;n Go checkout. Once verified, you will automatically return here.
            </p>
          </div>

          <button
            type="button"
            onClick={handleProceedGateway}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0055B8] py-3.5 px-4 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-[#00479b] active:scale-98 transition-all cursor-pointer"
          >
            <span>Pay {priceFormatted} via Touch &apos;n Go</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* STATIC QR MODE: Deep Link Button + QR Code + WhatsApp Proof Bridge */
        <div className="space-y-4">
          {/* 1. Open TNG App Mobile Deep Link Button */}
          <div>
            <button
              type="button"
              onClick={handleOpenTngApp}
              className="flex w-full items-center justify-between rounded-xl bg-[#0055B8] p-3.5 text-white shadow-md shadow-blue-600/20 hover:bg-[#00479b] active:scale-98 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                  <Smartphone className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">
                    Open Touch &apos;n Go eWallet App
                  </div>
                  <div className="text-[10px] text-blue-100 font-medium">
                    Copies {priceFormatted} & launches TNG App
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-white/80 shrink-0" />
            </button>

            {hasLaunchedApp && (
              <p className="mt-1.5 text-center text-[10px] text-stone-500">
                Opening Touch &apos;n Go... If app didn&apos;t open automatically, scan QR below.
              </p>
            )}
          </div>

          {/* 2. Touch 'n Go QR Code Display Card */}
          <div className="relative flex flex-col items-center rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs">
            <div className="mb-2.5 flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-stone-700">
              <QrCode className="h-3.5 w-3.5 text-stone-600" />
              <span className="text-[11px] font-bold tracking-wide">
                Or Scan Payment QR Code
              </span>
            </div>

            {/* QR Code Container */}
            <div className="relative h-48 w-48 overflow-hidden rounded-2xl border-2 border-stone-100 bg-stone-50 p-2 shadow-inner">
              <div className="relative h-full w-full rounded-xl overflow-hidden bg-white">
                <Image
                  src={floristConfig.tngQrUrl}
                  alt="Touch 'n Go eWallet Payment QR Code"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <p className="mt-2.5 text-center text-[11px] text-stone-500">
              Account: <span className="font-bold text-stone-800">{floristConfig.tngAccountName || floristConfig.storeName}</span>
            </p>

            <a
              href={floristConfig.tngQrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900 underline underline-offset-2"
            >
              <span>View QR Fullscreen</span>
              <ExternalLink className="h-3 w-3 text-stone-400" />
            </a>
          </div>

          {/* 3. Guidance Steps Card */}
          <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-3.5 text-xs">
            <p className="font-bold text-amber-950 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>How to complete order</span>
            </p>
            <ol className="mt-2 list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-amber-900/90 pl-0.5">
              <li>Tap <strong>&quot;Open Touch &apos;n Go eWallet&quot;</strong> above (amount is copied).</li>
              <li>Transfer <span className="font-bold">{priceFormatted}</span> & take a screenshot of your receipt.</li>
              <li>Tap below to send your order details & receipt proof via WhatsApp!</li>
            </ol>
          </div>

          {/* 4. WhatsApp Confirmation Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleConfirmWhatsApp}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 px-4 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all duration-200 hover:bg-[#20ba59] active:scale-98 cursor-pointer"
            >
              <MessageCircle className="h-5 w-5 fill-white text-[#25D366]" />
              <span>Confirm & Send WhatsApp</span>
            </button>

            <p className="mt-2 text-center text-[11px] text-stone-400">
              Your WhatsApp will open with a pre-filled order summary ready to attach your payment receipt.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
