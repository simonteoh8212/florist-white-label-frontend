"use client";

import React, { useEffect, useState } from "react";
import { StoreConfig } from "@/config/stores";
import {
  AlertCircle,
  Clock,
  Heart,
  HelpCircle,
  Lock,
  RefreshCw,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";

interface StorePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: StoreConfig;
  initialTab?: "all" | "substitution" | "delivery" | "refund" | "privacy";
}

export const StorePolicyModal: React.FC<StorePolicyModalProps> = ({
  isOpen,
  onClose,
  store,
  initialTab = "all",
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Close on Escape key press and lock background scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const primaryColor = store.primaryColor || "#BE185D";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-policy-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl transition-all overflow-hidden border border-stone-200/80 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/80 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-2xs border border-stone-200/80"
              style={{ color: primaryColor }}
            >
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="store-policy-modal-title"
                className="text-sm font-bold text-stone-900 leading-tight"
              >
                Store Policy &amp; Terms
              </h2>
              <p className="text-[11px] text-stone-500">
                {store.name}
                {store.ssmNumber ? ` • SSM: ${store.ssmNumber}` : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-stone-400 hover:bg-stone-100 hover:text-stone-700 shadow-2xs transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs text-stone-600 leading-relaxed">
          {/* Policy Section 1: Flower Substitution */}
          <section className="rounded-2xl border border-stone-200/80 bg-stone-50/40 p-4">
            <div className="flex items-center gap-2 text-stone-900 font-bold mb-2">
              <RefreshCw className="h-4 w-4 text-rose-500" />
              <h3 className="text-xs uppercase tracking-wider">
                1. Flower &amp; Foliage Substitution Policy
              </h3>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Fresh flowers are natural seasonal products. Stems, blooms, and wrapping materials are subject to daily market availability.
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-[11px] text-stone-600">
              <li>
                In the event that specific flowers are unavailable, our artisan florists will substitute them with blooms of <strong>equal or greater value</strong>.
              </li>
              <li>
                We will faithfully preserve the bouquet&apos;s overall <strong>color palette, aesthetic, and style</strong>.
              </li>
            </ul>
          </section>

          {/* Policy Section 2: Delivery & Fulfillment */}
          <section className="rounded-2xl border border-stone-200/80 bg-stone-50/40 p-4">
            <div className="flex items-center gap-2 text-stone-900 font-bold mb-2">
              <Truck className="h-4 w-4 text-sky-600" />
              <h3 className="text-xs uppercase tracking-wider">
                2. Delivery &amp; Fulfillment Terms
              </h3>
            </div>
            <div className="space-y-2 text-[11px] text-stone-600">
              <p>
                <strong>Delivery Windows:</strong> We make every effort to deliver within your selected preferred slot. However, unforeseen road conditions, bad weather, or festive traffic may cause slight variations.
              </p>
              <p>
                <strong>Recipient Unreachable:</strong> If the recipient cannot be contacted and no one is available to receive the delivery, our driver may leave the arrangement in a safe spot (security guardhouse / concierge) with photo proof, or return it to our atelier. A re-delivery fee will apply for subsequent attempts.
              </p>
              <p>
                <strong>Delivery Fees:</strong> Standard delivery fees are calculated based on travel distance from our atelier and will be confirmed via WhatsApp.
              </p>
            </div>
          </section>

          {/* Policy Section 3: Return, Refund & Perishable Goods */}
          <section className="rounded-2xl border border-stone-200/80 bg-stone-50/40 p-4">
            <div className="flex items-center gap-2 text-stone-900 font-bold mb-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <h3 className="text-xs uppercase tracking-wider">
                3. Cancellations &amp; Quality Complaints
              </h3>
            </div>
            <div className="space-y-2 text-[11px] text-stone-600">
              <p>
                Under Malaysian Consumer Protection Regulations, fresh flowers and perishable botanicals are exempt from standard returns once prepared.
              </p>
              <ul className="space-y-1 list-disc list-inside text-[11px]">
                <li>
                  <strong>Cancellation Window:</strong> Order cancellations must be made at least <strong>24 hours</strong> before the scheduled fulfillment date for a full refund or store credit.
                </li>
                <li>
                  <strong>Quality Disputes:</strong> If flowers arrive damaged or wilted, notify us via WhatsApp within <strong>4 hours of delivery</strong> with clear photos for immediate replacement or resolution.
                </li>
              </ul>
            </div>
          </section>

          {/* Policy Section 4: Personal Data Protection Act (PDPA 2010) */}
          <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-4">
            <div className="flex items-center gap-2 text-stone-900 font-bold mb-2">
              <Lock className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs uppercase tracking-wider text-emerald-950">
                4. Personal Data Protection Notice (PDPA 2010)
              </h3>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              We respect your privacy and adhere to the <strong>Personal Data Protection Act 2010 (Malaysia)</strong>.
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-[11px] text-stone-600">
              <li>
                Sender and recipient contact details, addresses, and greetings are collected <strong>strictly for order fulfillment</strong> and driver dispatch.
              </li>
              <li>
                We do not sell, rent, or trade your personal data to external third parties.
              </li>
              <li>
                Your data is stored securely and accessible only by authorized atelier personnel.
              </li>
            </ul>
          </section>

          {/* Policy Section 5: Platform Intermediary & Software Disclaimer */}
          <section className="rounded-2xl border border-stone-200/80 bg-stone-100/60 p-4">
            <div className="flex items-center gap-2 text-stone-900 font-bold mb-2">
              <ShieldCheck className="h-4 w-4 text-stone-600" />
              <h3 className="text-xs uppercase tracking-wider text-stone-800">
                5. Platform Provider Disclaimer (flowerapp.my)
              </h3>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              <strong>flowerapp.my</strong> is an independent e-commerce software enablement platform. flowerapp.my is a technology provider and is <strong>not</strong> the merchant, seller, florist, or delivery carrier.
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside text-[11px] text-stone-600">
              <li>
                All floral products, pricing, orders, and delivery arrangements are solely the responsibility of <strong>{store.name}</strong>.
              </li>
              <li>
                All payments (via Touch &apos;n Go eWallet, DuitNow QR, bank transfer, or payment gateway) are transacted directly between the customer and {store.name}. flowerapp.my does not hold or process customer funds.
              </li>
              <li>
                Customer support, refund inquiries, and delivery updates must be directed to the florist via their official WhatsApp contact.
              </li>
            </ul>
          </section>

          {/* Business Entity Notice */}
          <div className="text-center text-[10px] text-stone-400 pt-1 space-y-0.5">
            {store.companyName && (
              <p>
                Operated by {store.companyName}
                {store.ssmNumber ? ` (SSM: ${store.ssmNumber})` : ""}
              </p>
            )}
            <p className="text-[9px] text-stone-400">
              Powered by flowerapp.my • White-Label Software Solutions
            </p>
          </div>
        </div>

        {/* Footer Action */}
        <div className="border-t border-stone-100 bg-stone-50/50 p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-2.5 px-4 text-xs font-bold text-white shadow-xs transition-all active:scale-98 hover:opacity-95 cursor-pointer text-center"
            style={{ backgroundColor: primaryColor }}
          >
            I Understand &amp; Agree
          </button>
        </div>
      </div>
    </div>
  );
};
