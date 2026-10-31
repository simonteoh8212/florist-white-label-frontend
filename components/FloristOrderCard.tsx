"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Order, FulfillmentStatus } from "@/lib/orders";
import {
  MessageCircle,
  Phone,
  MapPin,
  Copy,
  Check,
  ChevronDown,
  Loader2,
  Zap,
} from "lucide-react";

export interface FloristOrderCardProps {
  order: Order;
  currency?: string;
  onStatusChange?: (orderId: string, newStatus: FulfillmentStatus) => Promise<void> | void;
  onOpenReschedule?: (order: Order) => void;
  onCopyLalamove?: (order: Order) => void;
  cleanPhone?: (phone: string) => string;
  showToast?: (msg: string) => void;
  className?: string;
}

const STAGES = {
  Delivery: ["New order", "Preparing", "Out for delivery", "Delivered"],
  Pickup: ["New order", "Preparing", "Ready for pickup", "Collected"],
} as const;

const ACTIONS = {
  Delivery: ["Start preparing", "Send out", "Mark delivered", "Completed"],
  Pickup: ["Start preparing", "Mark ready", "Mark collected", "Completed"],
} as const;

const NEXT_STATUS: Record<"Delivery" | "Pickup", Record<number, FulfillmentStatus>> = {
  Delivery: { 0: "preparing", 1: "dispatched", 2: "completed" },
  Pickup: { 0: "preparing", 1: "ready", 2: "completed" },
};

function getTodayTomorrowKL(): { todayStr: string; tomStr: string } {
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
  }).format(now);
  const tom = new Date(now);
  tom.setDate(tom.getDate() + 1);
  const tomStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
  }).format(tom);
  return { todayStr, tomStr };
}

function formatDayLabel(dateStr: string): { dayLabel: string; isToday: boolean } {
  const { todayStr, tomStr } = getTodayTomorrowKL();

  if (dateStr === todayStr) {
    return { dayLabel: "Today", isToday: true };
  }
  if (dateStr === tomStr) {
    return { dayLabel: "Tomorrow", isToday: false };
  }

  const [y, m, d] = dateStr.split("-").map(Number);
  if (y && m && d) {
    const formatted = new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(y, m - 1, d)));
    return { dayLabel: formatted, isToday: false };
  }
  return { dayLabel: dateStr, isToday: false };
}

/**
 * Formats time slots cleanly for single-line scanning:
 * e.g. "07:00 PM – 08:00 PM" -> "7:00 – 8:00 PM"
 *      "11:00 AM – 12:00 PM" -> "11:00 AM – 12:00 PM"
 */
function formatCompactSlot(slotStr: string): string {
  const trimmed = (slotStr || "").trim();
  const match = trimmed.match(
    /^0?(\d{1,2}:\d{2})\s*(AM|PM)\s*[–—-]\s*0?(\d{1,2}:\d{2})\s*(AM|PM)$/i
  );
  if (!match) return trimmed;
  const [, start, p1, end, p2] = match;
  const mer1 = p1.toUpperCase();
  const mer2 = p2.toUpperCase();
  if (mer1 === mer2) {
    return `${start} – ${end} ${mer2}`;
  }
  return `${start} ${mer1} – ${end} ${mer2}`;
}

function formatShortOrderId(id: string, storeSlug?: string): string {
  let clean = id.replace(/^ord_/, "");
  if (storeSlug && clean.startsWith(`${storeSlug}_`)) {
    clean = clean.slice(storeSlug.length + 1);
  } else if (clean.includes("_")) {
    const parts = clean.split("_");
    clean = parts[parts.length - 1] || clean;
  }
  return clean.slice(-6).toUpperCase();
}

function formatOrderSource(source?: Order["orderSource"]): string {
  if (source === "walk_in") return "Walk-in order";
  if (source === "phone") return "Phone order";
  return "Web order";
}

export function FloristOrderCard({
  order,
  currency = "RM",
  onStatusChange,
  onOpenReschedule,
  onCopyLalamove,
  cleanPhone = (p) => p.replace(/[^0-9]/g, "").replace(/^0/, "60"),
  showToast,
  className = "",
}: FloristOrderCardProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [copied, setCopied] = useState(false);

  const isDelivery = order.fulfillmentMethod === "delivery";
  const mode = isDelivery ? "Delivery" : "Pickup";

  // Map fulfillmentStatus to 4 stages (0, 1, 2, 3) or -1 for cancelled
  const stage =
    order.fulfillmentStatus === "cancelled"
      ? -1
      : order.fulfillmentStatus === "completed"
      ? 3
      : order.fulfillmentStatus === "dispatched" || order.fulfillmentStatus === "ready"
      ? 2
      : order.fulfillmentStatus === "preparing"
      ? 1
      : 0;

  const done = stage === 3 || stage === -1;
  const { dayLabel, isToday } = formatDayLabel(order.deliveryDate);

  const rawNotes = order.notes || "";
  const isRescheduled = rawNotes.includes("[Rescheduled:");
  const isRush =
    isToday &&
    !done &&
    (rawNotes.includes("Rush") || rawNotes.includes("加急"));

  const cleanNotes = rawNotes
    .replace(/\[Rescheduled:[^\]]+\]\s*/g, "")
    .replace(/\[⚡[^\]]+\]\s*/g, "")
    .trim();

  const hasCardMessage = Boolean(order.cardMessage && order.cardMessage.trim());
  const noteCount = (hasCardMessage ? 1 : 0) + (cleanNotes ? 1 : 0);

  const fee = isDelivery ? order.deliveryFee || 0 : 0;
  const addons = order.addons || [];
  const addonsTotal = addons.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const bouquetTotal = Math.max(0, order.totalAmount - fee - addonsTotal);
  const rm = (n: number) => `${currency} ${n.toFixed(2)}`;

  const isPaid = order.paymentStatus !== "pending_verification";
  const payMethod =
    order.paymentMode === "cash"
      ? "Cash"
      : order.paymentMode === "duitnow_qr"
      ? "DuitNow QR"
      : order.paymentMode === "bank_transfer"
      ? "Bank Transfer"
      : "Touch ’n Go";

  const advance = async () => {
    if (done || busy || !onStatusChange) return;
    const nextSt = NEXT_STATUS[mode][stage];
    if (!nextSt) return;
    setBusy(true);
    try {
      await onStatusChange(order.id, nextSt);
      setPulse((p) => p + 1);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
      showToast?.("Status updated");
    } catch {
      showToast?.("Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const copyForRider = () => {
    if (onCopyLalamove) {
      onCopyLalamove(order);
    } else {
      const txt = [
        `Recipient: ${order.recipient.name}`,
        `Contact: ${order.recipient.phone}`,
        `Time: ${order.deliveryDate} (${order.deliveryTimeSlot})`,
        isDelivery && order.recipient.deliveryAddress
          ? `Drop-off: ${order.recipient.deliveryAddress}`
          : "Pickup",
      ]
        .filter(Boolean)
        .join("\n");
      navigator.clipboard.writeText(txt);
    }
    setCopied(true);
    showToast?.("Copied for the rider");
    setTimeout(() => setCopied(false), 2000);
  };

  const qty = order.product.quantity || 1;
  const shortId = formatShortOrderId(order.id, order.storeSlug);
  const srcLabel = formatOrderSource(order.orderSource);
  const compactSlot = formatCompactSlot(order.deliveryTimeSlot);

  const cleanedDigits = cleanPhone(order.recipient.phone || "");
  const hasValidPhone = cleanedDigits.length >= 6;
  const hasAddress = Boolean(isDelivery && order.recipient.deliveryAddress?.trim());

  const handleSurfaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const selection = typeof window !== "undefined" ? window.getSelection() : null;
    if (selection && selection.toString().length > 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a")) return;
    setOpen((v) => !v);
  };

  return (
    <article
      className={`oc ${done ? "is-done" : ""} ${className}`}
      data-st={stage === -1 ? "cancel" : stage}
    >
      {/* Tappable Upper Production Summary (When + Bouquet + Recipient) */}
      <div className="oc-tap-zone" onClick={handleSurfaceClick}>
        {/* 1. SINGLE-LINE WHEN & CALM STATUS */}
        <div className="oc-head">
          <div className="oc-when-inline">
            <span className="oc-day">{dayLabel}</span>
            <span className="oc-slot">{compactSlot}</span>
            {isRush && (
              <span className="oc-tag oc-tag-strong">
                <Zap className="oc-tag-icon" aria-hidden="true" />
                Rush
              </span>
            )}
            {isRescheduled && <span className="oc-tag">Rescheduled</span>}
          </div>

          <span key={pulse} className={`oc-st ${pulse ? "pulse" : ""}`}>
            <i aria-hidden="true" />
            <span>{stage === -1 ? "Cancelled" : STAGES[mode][stage]}</span>
          </span>
        </div>

        {/* 2. HERO BOUQUET & RECIPIENT (2 clean lines max) */}
        <div className="oc-mid">
          <div className="oc-th">
            <Image
              src={order.product.image}
              alt={order.product.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
          <div className="oc-info">
            <h3>
              <span>{order.product.name}</span>
              {qty > 1 && <span className="oc-qty-badge">&times;{qty}</span>}
            </h3>
            <p className="oc-recip">
              {mode} &middot; {order.recipient.name}
              {addons.length > 0 && (
                <span>
                  {" "}
                  &middot; +{addons.length} {addons.length === 1 ? "add-on" : "add-ons"}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 3. UNIFIED ACTION BAR: Details (+ exceptions only) on Left, ONE Focal CTA on Right */}
      <div className="oc-foot">
        <button
          type="button"
          className="oc-more"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="oc-more-label">
            <span>Details</span>
            {noteCount > 0 && (
              <span className="oc-more-sub">
                &middot; {noteCount} {noteCount === 1 ? "note" : "notes"}
              </span>
            )}
            <ChevronDown
              className={`oc-chev ${open ? "is-open" : ""}`}
              aria-hidden="true"
            />
          </span>
          {!isPaid && <span className="oc-unpaid-tag">Unpaid</span>}
        </button>

        <button
          type="button"
          className={`oc-go ${busy ? "is-busy" : ""}`}
          disabled={done || busy}
          onClick={advance}
        >
          {busy && <Loader2 className="oc-go-spin" aria-hidden="true" />}
          <span>{stage === -1 ? "Cancelled" : ACTIONS[mode][stage]}</span>
          {stage === 3 && <Check className="oc-go-check" aria-hidden="true" />}
        </button>
      </div>

      {/* 4. EXPANDABLE DETAILS DRAWER (Address, Notes, Financials & Dispatch Actions) */}
      <div className={`oc-dt ${open ? "open" : ""}`}>
        <div>
          <div className="oc-in">
            {/* Unified Neutral Quick Actions */}
            <div className={`oc-acts ${isDelivery ? "" : "acts-3"}`}>
              {hasValidPhone ? (
                <a
                  href={`https://wa.me/${cleanedDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle aria-hidden="true" />
                  <span>WhatsApp</span>
                </a>
              ) : (
                <button type="button" disabled title="No phone number recorded">
                  <MessageCircle aria-hidden="true" />
                  <span>WhatsApp</span>
                </button>
              )}

              {hasValidPhone ? (
                <a href={`tel:${order.recipient.phone}`}>
                  <Phone aria-hidden="true" />
                  <span>Call</span>
                </a>
              ) : (
                <button type="button" disabled title="No phone number recorded">
                  <Phone aria-hidden="true" />
                  <span>Call</span>
                </button>
              )}

              {isDelivery &&
                (hasAddress ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      order.recipient.deliveryAddress || ""
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin aria-hidden="true" />
                    <span>Maps</span>
                  </a>
                ) : (
                  <button type="button" disabled title="No delivery address recorded">
                    <MapPin aria-hidden="true" />
                    <span>Maps</span>
                  </button>
                ))}

              <button type="button" onClick={copyForRider}>
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Clean Monochrome Key-Value Breakdown */}
            <div className="oc-rows">
              {isDelivery && (order.recipient.deliveryAddress || order.deliveryZoneName) && (
                <div className="oc-row">
                  <span>Address</span>
                  <span>
                    {order.recipient.deliveryAddress || order.deliveryZoneName}
                  </span>
                </div>
              )}

              {hasCardMessage && (
                <div className="oc-row">
                  <span>Card message</span>
                  <span>&ldquo;{order.cardMessage}&rdquo;</span>
                </div>
              )}

              {cleanNotes && (
                <div className="oc-row">
                  <span>Note</span>
                  <span>{cleanNotes}</span>
                </div>
              )}

              {addons.length > 0 && (
                <div className="oc-row">
                  <span>Add-ons ({addons.map((a) => a.name).join(", ")})</span>
                  <span className="oc-num">{rm(addonsTotal)}</span>
                </div>
              )}

              {(addons.length > 0 || fee > 0) && (
                <div className="oc-row">
                  <span>Bouquet</span>
                  <span className="oc-num">{rm(bouquetTotal)}</span>
                </div>
              )}

              {fee > 0 && (
                <div className="oc-row">
                  <span>Delivery</span>
                  <span className="oc-num">{rm(fee)}</span>
                </div>
              )}

              <div className="oc-row">
                <span>Payment</span>
                <span>
                  {isPaid ? "Paid" : "Unpaid"} &middot; {payMethod}
                </span>
              </div>

              <div className="oc-row oc-row-total">
                <span>Total</span>
                <span className="oc-num">{rm(order.totalAmount)}</span>
              </div>

              
            </div>

            {/* Footer Meta & Quiet Secondary Management Actions */}
            <div className="oc-manage">
              <span className="oc-meta-id">
                #{shortId} &middot; {srcLabel}
              </span>
              <div className="oc-manage-btns">
                {onOpenReschedule && (
                  <button
                    type="button"
                    onClick={() => onOpenReschedule(order)}
                  >
                    Reschedule
                  </button>
                )}
                {!done && onStatusChange && (
                  <button
                    type="button"
                    className="oc-cancel-btn"
                    onClick={() => {
                      if (confirm("Are you sure you want to cancel this order?")) {
                        onStatusChange(order.id, "cancelled");
                      }
                    }}
                  >
                    Cancel order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
