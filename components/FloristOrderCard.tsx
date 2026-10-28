"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Order, FulfillmentStatus } from "@/lib/orders";
import { MessageCircle, Phone, MapPin, Copy, Check } from "lucide-react";

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

function formatWhen(dateStr: string, slotStr: string): string {
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(now);
  const tom = new Date(now);
  tom.setDate(tom.getDate() + 1);
  const tomStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(tom);

  let dayLabel = "";
  if (dateStr === todayStr) {
    dayLabel = "Today";
  } else if (dateStr === tomStr) {
    dayLabel = "Tomorrow";
  } else {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (y && m && d) {
      dayLabel = new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(y, m - 1, d)));
    } else {
      dayLabel = dateStr;
    }
  }
  return `${dayLabel}, ${slotStr}`;
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
  const isRescheduled = Boolean(order.notes && order.notes.includes("[Rescheduled:"));
  const cleanNotes = (order.notes || "").replace(/\[Rescheduled:[^\]]+\]\s*/g, "").trim();
  const hasRealNote = Boolean((order.cardMessage && order.cardMessage.trim()) || cleanNotes);

  const fee = isDelivery ? order.deliveryFee || 0 : 0;
  const bouquetTotal = Math.max(0, order.totalAmount - fee);
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
        isDelivery && order.recipient.deliveryAddress ? `Drop-off: ${order.recipient.deliveryAddress}` : "Pickup",
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
  const shortId = order.id.replace(/^ord_/, "").slice(0, 8);
  const src = order.orderSource ? `${order.orderSource.replace("_", " ")} order` : "Web order";

  return (
    <article className={`oc ${className}`} data-st={stage === -1 ? "cancel" : stage}>
      {/* 1. WHEN & 2. STATUS */}
      <div className="top">
        <div className="when">
          {formatWhen(order.deliveryDate, order.deliveryTimeSlot)}
          {isRescheduled && <span className="tg">Rescheduled</span>}
        </div>
        <span key={pulse} className={`st ${pulse ? "pulse" : ""}`}>
          <i />
          <em>{stage === -1 ? "Cancelled" : STAGES[mode][stage]}</em>
        </span>
      </div>

      {/* 3. THE ORDER */}
      <div className="mid">
        <div className="th">
          <Image src={order.product.image} alt={order.product.name} fill sizes="60px" className="object-cover" />
        </div>
        <div>
          <h3>{order.product.name}{qty > 1 ? ` × ${qty}` : ""}</h3>
          <p>
            {mode} · To {order.recipient.name}
            {isDelivery && order.deliveryZoneName ? `, ${order.deliveryZoneName}` : ""}
          </p>
        </div>
      </div>

      {/* 4. TOTAL, 5. PAYMENT & 6. ONE PRIMARY BUTTON */}
      <div className="foot">
        <div>
          <b className="tot">{rm(order.totalAmount)}</b>
          <span className={`pd ${isPaid ? "" : "un"}`}>{isPaid ? "✓ Paid" : "Unpaid"} · {payMethod}</span>
        </div>
        <button type="button" className="go" disabled={done || busy} onClick={advance}>
          {stage === -1 ? "Cancelled" : ACTIONS[mode][stage]}
          {stage === 3 ? " ✓" : ""}
        </button>
      </div>

      {/* 7. DETAILS TOGGLE */}
      <button type="button" className="more" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        Details{hasRealNote ? " · 1 note" : ""} <span>⌄</span>
      </button>

      {/* DETAILS PANEL (Smooth 0.3s grid expansion) */}
      <div className={`dt ${open ? "open" : ""}`}>
        <div>
          <div className="in">
            {isDelivery && order.recipient.deliveryAddress && (
              <div className="row">
                <span>Address</span>
                <span>{order.recipient.deliveryAddress}</span>
              </div>
            )}
            <div className="row">
              <span>Bouquet</span>
              <span>{rm(bouquetTotal)}</span>
            </div>
            {fee > 0 && (
              <div className="row">
                <span>Delivery</span>
                <span>{rm(fee)}</span>
              </div>
            )}
            <div className={`acts ${isDelivery ? "" : "acts-3"}`}>
              <a href={`https://wa.me/${cleanPhone(order.recipient.phone)}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle />
                WhatsApp
              </a>
              <a href={`tel:${order.recipient.phone}`}>
                <Phone />
                Call
              </a>
              {isDelivery && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.recipient.deliveryAddress || "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin />
                  Maps
                </a>
              )}
              <button type="button" onClick={copyForRider}>
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            {order.cardMessage && (
              <div className="row">
                <span>Card Message</span>
                <span>&ldquo;{order.cardMessage}&rdquo;</span>
              </div>
            )}
            {cleanNotes && (
              <div className="row">
                <span>Note</span>
                <span>{cleanNotes}</span>
              </div>
            )}
            <div className="meta">
              <span>#{shortId} · {src}</span>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                {!done && onStatusChange && (
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      if (confirm("Are you sure you want to cancel this order?")) {
                        onStatusChange(order.id, "cancelled");
                      }
                    }}
                  >
                    Cancel order
                  </button>
                )}
                {onOpenReschedule && (
                  <button type="button" onClick={() => onOpenReschedule(order)}>
                    Reschedule
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
