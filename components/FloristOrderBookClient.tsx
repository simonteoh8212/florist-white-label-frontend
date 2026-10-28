"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { StoreConfig } from "@/config/stores";
import { Order, FulfillmentStatus } from "@/lib/orders";
import {
  Lock,
  Unlock,
  Truck,
  Store,
  MapPin,
  Phone,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Search,
  ChevronDown,
  Calendar,
  DollarSign,
  PackageCheck,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  X,
  Clock,
  ShieldCheck,
  Send,
  Zap,
  ShieldAlert,
  ChevronUp,
  Pause,
  Play,
  Ban,
  Plus,
  ShoppingBag,
  CreditCard,
  Banknote,
  QrCode,
  PieChart,
  Globe,
  Loader2,
} from "lucide-react";
import { StoreEmergencyStatus } from "@/lib/storeStatus";

interface FloristOrderBookClientProps {
  store: StoreConfig;
}

export function FloristOrderBookClient({ store }: FloristOrderBookClientProps) {
  const primaryColor = store.primaryColor || "#BE185D";
  const currency = store.currency || "RM";

  // Auth State
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [activeTab, setActiveTab] = useState<"today" | "tomorrow" | "upcoming" | "all">("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Reschedule State (Strategy 3)
  const [rescheduleState, setRescheduleState] = useState<{
    orderId: string;
    deliveryDate: string;
    deliveryTimeSlot: string;
    customTimeSlot: string;
  } | null>(null);
  const [isSavingSlot, setIsSavingSlot] = useState(false);

  // Emergency & Capacity Controls State (Option A)
  const [storeStatus, setStoreStatus] = useState<StoreEmergencyStatus | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updatingStockProductId, setUpdatingStockProductId] = useState<string | null>(null);
  const [isResettingAllStock, setIsResettingAllStock] = useState(false);
  const [isEmergencyPanelOpen, setIsEmergencyPanelOpen] = useState(false);
  const [emergencyNoticeInput, setEmergencyNoticeInput] = useState("");

  // Channel Filter State (Web vs Walk-In vs Phone)
  const [channelFilter, setChannelFilter] = useState<"all" | "web" | "walk_in" | "phone">("all");

  // Quick Order (Walk-In Counter & Phone Order) State
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [quickOrderChannel, setQuickOrderChannel] = useState<"walk_in" | "phone" | "web">("walk_in");
  const [quickOrderProductType, setQuickOrderProductType] = useState<"catalog" | "custom">("catalog");
  const [quickSelectedProductId, setQuickSelectedProductId] = useState<string>(store.products[0]?.id || "");
  const [quickCustomTitle, setQuickCustomTitle] = useState("");
  const [quickCustomPrice, setQuickCustomPrice] = useState("");
  const [quickSelectedAddonIds, setQuickSelectedAddonIds] = useState<string[]>([]);
  const [quickFulfillment, setQuickFulfillment] = useState<"takeaway" | "pickup" | "delivery">("takeaway");
  const [quickDeliveryZoneId, setQuickDeliveryZoneId] = useState<string>(store.deliveryFeeConfig?.defaultZoneId || "");
  const [quickDeliveryAddress, setQuickDeliveryAddress] = useState("");
  const [quickDate, setQuickDate] = useState("");
  const [quickSlot, setQuickSlot] = useState("Immediate Takeaway");
  const [quickCustomerName, setQuickCustomerName] = useState("");
  const [quickCustomerPhone, setQuickCustomerPhone] = useState("");
  const [quickCardMessage, setQuickCardMessage] = useState("");
  const [quickNotes, setQuickNotes] = useState("");
  const [quickPaymentMode, setQuickPaymentMode] = useState<"cash" | "duitnow_qr" | "static_qr" | "bank_transfer">("cash");
  const [quickPaymentStatus, setQuickPaymentStatus] = useState<"paid" | "pending">("paid");
  const [isSubmittingQuickOrder, setIsSubmittingQuickOrder] = useState(false);

  // Dynamic storefront return link based on current domain:
  // If on subdomain (autarix.flowerapp.my or autarix.localhost), "/" returns to shop.
  // If on bare localhost (localhost:3000/store/autarix), "/store/autarix" returns to shop.
  const [storefrontHref, setStorefrontHref] = useState(`/store/${store.slug}`);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSubdomain =
        window.location.host.startsWith(`${store.slug}.`) ||
        !window.location.pathname.startsWith(`/store/${store.slug}`);
      if (isSubdomain) {
        setStorefrontHref("/");
      }
    }
  }, [store.slug]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) {
      if (isLocked) {
        setIsLocked(false);
        setAuthError("");
      }
      return;
    }
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setAuthError("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining, isLocked]);

  // Fetch orders with PIN
  const fetchOrders = useCallback(
    async (pinToUse: string) => {
      if (isLocked) return;
      setIsLoadingOrders(true);
      try {
        const res = await fetch(
          `/api/orders?slug=${encodeURIComponent(store.slug)}&pin=${encodeURIComponent(pinToUse)}`
        );
        const data = await res.json();
        if (res.ok && data.success) {
          setOrders(data.orders || []);
          setIsAuthenticated(true);
          setAuthError("");
          setIsLocked(false);
          setLockoutRemaining(0);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(`florist_pin_${store.slug}`, pinToUse);
          }
          // Also fetch store emergency status
          fetchStoreStatus();
        } else {
          if (data.isLocked && data.remainingSeconds) {
            setIsLocked(true);
            setLockoutRemaining(data.remainingSeconds);
            setAuthError(data.error || "Terminal locked due to failed attempts.");
          } else {
            setAuthError(data.error || "Invalid PIN. Please try again.");
          }
          setIsAuthenticated(false);
          setPin("");
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(`florist_pin_${store.slug}`);
          }
        }
      } catch (err) {
        console.error("Fetch orders failed:", err);
        setAuthError("Network error. Please try again.");
      } finally {
        setIsLoadingOrders(false);
        setIsVerifying(false);
      }
    },
    [store.slug, isLocked]
  );

  // Check saved session PIN on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(`florist_pin_${store.slug}`);
      if (saved) {
        setPin(saved);
        setIsVerifying(true);
        fetchOrders(saved);
      }
    }
  }, [store.slug, fetchOrders]);

  // Handle PIN input key clicks
  const handlePinDigit = (digit: string) => {
    if (isLocked || isVerifying) return;
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setAuthError("");
      if (nextPin.length === 4) {
        setIsVerifying(true);
        fetchOrders(nextPin);
      }
    }
  };

  const handlePinBackspace = () => {
    if (isLocked || isVerifying) return;
    setPin((prev) => prev.slice(0, -1));
    setAuthError("");
  };

  const handlePinClear = () => {
    if (isLocked || isVerifying) return;
    setPin("");
    setAuthError("");
  };

  // Keyboard support for PIN entry
  useEffect(() => {
    if (isAuthenticated || isLocked) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handlePinDigit(e.key);
      } else if (e.key === "Backspace") {
        handlePinBackspace();
      } else if (e.key === "Escape") {
        handlePinClear();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, isAuthenticated, isLocked]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPin("");
    setOrders([]);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`florist_pin_${store.slug}`);
    }
  };

  // Update order fulfillment status
  const handleStatusChange = async (orderId: string, newStatus: FulfillmentStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug: store.slug,
          pin: pin,
          orderId,
          fulfillmentStatus: newStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, fulfillmentStatus: newStatus } : o))
        );
        showToast(`Status updated to "${newStatus.toUpperCase()}"`);
      } else {
        showToast(data.error || "Failed to update status");
      }
    } catch {
      showToast("Network error updating status");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Fetch store emergency status
  const fetchStoreStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/store/status?slug=${encodeURIComponent(store.slug)}`);
      const data = await res.json();
      if (res.ok && data.success && data.status) {
        setStoreStatus(data.status);
        setEmergencyNoticeInput(data.status.emergencyNotice || "");
      }
    } catch (err) {
      console.warn("Failed to load store status:", err);
    }
  }, [store.slug]);

  // Handle emergency toggle & festive pricing strategy
  const handleToggleEmergency = async (
    updates: Partial<{
      isTodayPaused: boolean;
      isTomorrowBlocked: boolean;
      emergencyNotice: string;
      holidayPricingDisplay: "separate_surcharge" | "inclusive";
    }>
  ) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch("/api/store/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug: store.slug,
          pin,
          ...updates,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStoreStatus(data.status);
        if (updates.emergencyNotice !== undefined) {
          setEmergencyNoticeInput(data.status.emergencyNotice || "");
        }
        showToast(
          updates.holidayPricingDisplay
            ? `Peak pricing strategy switched to: ${
                updates.holidayPricingDisplay === "inclusive"
                  ? "Directly Charge in Product Price"
                  : "Separate Line Item Surcharge"
              }`
            : "Emergency & capacity settings updated!"
        );
      } else {
        showToast(data.error || "Failed to update emergency settings");
      }
    } catch {
      showToast("Network error updating status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 1-Tap toggle individual product stock status
  const handleToggleProductStock = async (productId: string) => {
    const currentOutOfStock = storeStatus?.outOfStockProductIds || [];
    const isCurrentlyOut = currentOutOfStock.includes(productId);
    const newOutOfStock = isCurrentlyOut
      ? currentOutOfStock.filter((id) => id !== productId)
      : [...currentOutOfStock, productId];

    const targetProduct = store.products.find((p) => p.id === productId);
    const productName = targetProduct ? targetProduct.name : "Product";

    setUpdatingStockProductId(productId);
    setIsUpdatingStatus(true);
    try {
      const res = await fetch("/api/store/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug: store.slug,
          pin,
          outOfStockProductIds: newOutOfStock,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStoreStatus(data.status);
        showToast(
          isCurrentlyOut
            ? `"${productName}" is back IN STOCK`
            : `"${productName}" marked as SOLD OUT`
        );
      } else {
        showToast(data.error || "Failed to update stock status");
      }
    } catch {
      showToast("Network error updating stock status");
    } finally {
      setIsUpdatingStatus(false);
      setUpdatingStockProductId(null);
    }
  };

  // Reset all products back in-stock
  const handleResetAllStock = async () => {
    setIsResettingAllStock(true);
    setIsUpdatingStatus(true);
    try {
      const res = await fetch("/api/store/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug: store.slug,
          pin,
          outOfStockProductIds: [],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStoreStatus(data.status);
        showToast("All bouquets marked back IN STOCK!");
      } else {
        showToast(data.error || "Failed to reset stock status");
      }
    } catch {
      showToast("Network error resetting stock");
    } finally {
      setIsUpdatingStatus(false);
      setIsResettingAllStock(false);
    }
  };

  // Available slots for store (normalized as string labels)
  const availableSlots = useMemo((): string[] => {
    if (store.deliveryTimeConfig?.slots && store.deliveryTimeConfig.slots.length > 0) {
      return store.deliveryTimeConfig.slots.map((s) =>
        typeof s === "string" ? s : s.label || s.id
      );
    }
    return [
      "10:00 AM – 11:00 AM",
      "11:00 AM – 12:00 PM",
      "12:00 PM – 01:00 PM",
      "01:00 PM – 02:00 PM",
      "02:00 PM – 03:00 PM",
      "03:00 PM – 04:00 PM",
      "04:00 PM – 05:00 PM",
      "05:00 PM – 06:00 PM",
      "06:00 PM – 07:00 PM",
      "07:00 PM – 08:00 PM",
    ];
  }, [store.deliveryTimeConfig]);

  // Clean phone number helper (e.g. 012... -> 6012...)
  const cleanPhone = (phone: string) => {
    let cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "60" + cleaned.slice(1);
    }
    return cleaned;
  };

  // Detect rush orders
  const isRushOrder = (order: Order) => {
    return Boolean(order.notes && (order.notes.includes("Rush") || order.notes.includes("加急")));
  };

  const openRescheduleModal = (order: Order) => {
    setRescheduleState({
      orderId: order.id,
      deliveryDate: order.deliveryDate,
      deliveryTimeSlot: order.deliveryTimeSlot,
      customTimeSlot: "",
    });
  };

  const closeRescheduleModal = () => {
    setRescheduleState(null);
  };

  // Pre-formatted polite WhatsApp reschedule proposal (strictly NO emojis, clean bullet dots only)
  const getRescheduleWhatsAppMessage = (
    order: Order,
    proposedDate: string,
    proposedSlot: string
  ) => {
    const targetDate = proposedDate || order.deliveryDate;
    const targetSlot = proposedSlot || order.deliveryTimeSlot;

    return [
      `Hi ${order.recipient.name},`,
      ``,
      `This is ${store.name} regarding your order #${order.id} for ${order.product.name}.`,
      ``,
      `Our florists are carefully arranging your fresh blooms right now! To ensure the highest floral presentation and arrange courier dispatch smoothly, could we arrange delivery during this time slot instead?`,
      ``,
      `\u2022 Order: #${order.id}`,
      `\u2022 Item: ${order.product.name}`,
      `\u2022 Proposed Slot: ${targetDate} (${targetSlot})`,
      order.fulfillmentMethod === "delivery" && order.recipient.deliveryAddress
        ? `\u2022 Delivery Address: ${order.recipient.deliveryAddress}`
        : `\u2022 Collection: Store Pickup at ${store.name}`,
      ``,
      `Please let us know if this time works for you. Thank you for your kind understanding!`,
      ``,
      `${store.name}`,
    ].join("\n");
  };

  const getRescheduleWhatsAppUrl = (
    order: Order,
    proposedDate: string,
    proposedSlot: string
  ) => {
    const phone = cleanPhone(order.recipient.phone);
    const text = getRescheduleWhatsAppMessage(order, proposedDate, proposedSlot);
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const copyRescheduleMessage = (order: Order, date: string, slot: string) => {
    const text = getRescheduleWhatsAppMessage(order, date, slot);
    navigator.clipboard.writeText(text);
    showToast("Reschedule WhatsApp message copied!");
  };

  // Save new delivery slot via PATCH /api/orders
  const handleSaveReschedule = async () => {
    if (!rescheduleState) return;
    if (rescheduleState.deliveryDate < todayStr) {
      showToast("Delivery date cannot be in the past.");
      return;
    }
    const targetSlot =
      rescheduleState.customTimeSlot.trim() || rescheduleState.deliveryTimeSlot;
    if (!targetSlot) {
      showToast("Please choose or enter a delivery slot.");
      return;
    }

    setIsSavingSlot(true);
    try {
      const currentOrder = orders.find((o) => o.id === rescheduleState.orderId);
      const existingNotes = currentOrder?.notes || "";
      const rescheduleAudit = `[Rescheduled: ${rescheduleState.deliveryDate} ${targetSlot}]`;
      const updatedNotes = existingNotes
        ? `${existingNotes} ${rescheduleAudit}`
        : rescheduleAudit;

      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug: store.slug,
          pin,
          orderId: rescheduleState.orderId,
          deliveryDate: rescheduleState.deliveryDate,
          deliveryTimeSlot: targetSlot,
          notes: updatedNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === rescheduleState.orderId
              ? {
                  ...o,
                  deliveryDate: rescheduleState.deliveryDate,
                  deliveryTimeSlot: targetSlot,
                  notes: updatedNotes,
                }
              : o
          )
        );
        showToast(`Slot updated to ${rescheduleState.deliveryDate} (${targetSlot})`);
        setRescheduleState(null);
      } else {
        showToast(data.error || "Failed to update delivery slot");
      }
    } catch (err) {
      console.error("Reschedule update failed:", err);
      showToast("Network error updating delivery slot");
    } finally {
      setIsSavingSlot(false);
    }
  };

  // Dates calculation helper
  const getRelativeDateStr = (daysAhead: number = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getRelativeDateStr(0);
  const tomorrowStr = getRelativeDateStr(1);

  // Filter orders by active tab and search
  const filteredOrders = useMemo(() => {
    let list = orders;

    // Tab filter
    if (activeTab === "today") {
      list = list.filter((o) => o.deliveryDate === todayStr);
    } else if (activeTab === "tomorrow") {
      list = list.filter((o) => o.deliveryDate === tomorrowStr);
    } else if (activeTab === "upcoming") {
      list = list.filter((o) => o.deliveryDate > tomorrowStr);
    }

    // Channel filter
    if (channelFilter !== "all") {
      list = list.filter((o) => (o.orderSource || "web") === channelFilter);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.recipient.name.toLowerCase().includes(q) ||
          o.recipient.phone.toLowerCase().includes(q) ||
          o.product.name.toLowerCase().includes(q) ||
          (o.recipient.deliveryAddress && o.recipient.deliveryAddress.toLowerCase().includes(q)) ||
          o.id.toLowerCase().includes(q)
      );
    }

    return list;
  }, [orders, activeTab, channelFilter, searchQuery, todayStr, tomorrowStr]);

  // Operational metrics
  const todayOrders = useMemo(() => orders.filter((o) => o.deliveryDate === todayStr), [orders, todayStr]);
  const tomorrowOrders = useMemo(() => orders.filter((o) => o.deliveryDate === tomorrowStr), [orders, tomorrowStr]);
  const upcomingOrders = useMemo(() => orders.filter((o) => o.deliveryDate > tomorrowStr), [orders, tomorrowStr]);

  const todayRevenue = useMemo(() => {
    return todayOrders
      .filter((o) => o.fulfillmentStatus !== "cancelled")
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [todayOrders]);

  const monthRevenue = useMemo(() => {
    const currentMonth = todayStr.slice(0, 7); // "YYYY-MM"
    return orders
      .filter(
        (o) =>
          o.deliveryDate.startsWith(currentMonth) &&
          o.fulfillmentStatus !== "cancelled"
      )
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders, todayStr]);

  // Channel breakdown for Today's Sales Reconciliation
  const todayChannelStats = useMemo(() => {
    const validToday = todayOrders.filter((o) => o.fulfillmentStatus !== "cancelled");
    const web = validToday.filter((o) => !o.orderSource || o.orderSource === "web");
    const walkIn = validToday.filter((o) => o.orderSource === "walk_in");
    const phone = validToday.filter((o) => o.orderSource === "phone");

    const webRevenue = web.reduce((sum, o) => sum + o.totalAmount, 0);
    const walkInRevenue = walkIn.reduce((sum, o) => sum + o.totalAmount, 0);
    const phoneRevenue = phone.reduce((sum, o) => sum + o.totalAmount, 0);

    const cashTotal = validToday
      .filter((o) => o.paymentMode === "cash")
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const duitnowTotal = validToday
      .filter((o) => o.paymentMode === "duitnow_qr")
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const tngTotal = validToday
      .filter((o) => !o.paymentMode || o.paymentMode === "static_qr")
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const transferTotal = validToday
      .filter((o) => o.paymentMode === "bank_transfer")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      webCount: web.length,
      webRevenue,
      walkInCount: walkIn.length,
      walkInRevenue,
      phoneCount: phone.length,
      phoneRevenue,
      cashTotal,
      duitnowTotal,
      tngTotal,
      transferTotal,
    };
  }, [todayOrders]);

  // Quick Order live calculations
  const quickProductObj = useMemo(() => {
    if (quickOrderProductType === "custom") {
      const price = parseFloat(quickCustomPrice) || 0;
      return {
        id: "custom_arr",
        name: quickCustomTitle.trim() || "Custom Floral Arrangement",
        price,
        image: store.logo,
      };
    }
    const found =
      store.products.find((p) => p.id === quickSelectedProductId) ||
      store.products[0];
    return {
      id: found.id,
      name: found.name,
      price: found.price,
      image: found.image,
    };
  }, [
    quickOrderProductType,
    quickCustomTitle,
    quickCustomPrice,
    quickSelectedProductId,
    store.products,
    store.logo,
  ]);

  const quickAddonsTotal = useMemo(() => {
    return (store.addons || [])
      .filter((a) => quickSelectedAddonIds.includes(a.id))
      .reduce((sum, a) => sum + a.price, 0);
  }, [store.addons, quickSelectedAddonIds]);

  const quickDeliveryFee = useMemo(() => {
    if (quickFulfillment !== "delivery") return 0;
    const zone = store.deliveryFeeConfig?.zones.find(
      (z) => z.id === quickDeliveryZoneId
    );
    return zone?.fee || 0;
  }, [quickFulfillment, quickDeliveryZoneId, store.deliveryFeeConfig]);

  const quickOrderTotal =
    quickProductObj.price + quickAddonsTotal + quickDeliveryFee;

  // Handle Create Quick Order
  const handleCreateQuickOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quickOrderTotal <= 0) {
      showToast("Please enter a valid price for the arrangement.");
      return;
    }
    const effectiveDate = quickDate || todayStr;
    if (effectiveDate < todayStr) {
      showToast("Delivery or pickup date cannot be in the past.");
      return;
    }

    setIsSubmittingQuickOrder(true);
    try {
      const isTakeaway = quickFulfillment === "takeaway";
      const isPickup = quickFulfillment === "pickup" || isTakeaway;
      const activeAddons = (store.addons || []).filter((a) =>
        quickSelectedAddonIds.includes(a.id)
      );
      const zoneObj = store.deliveryFeeConfig?.zones.find(
        (z) => z.id === quickDeliveryZoneId
      );

      const payload = {
        storeSlug: store.slug,
        pin,
        product: quickProductObj,
        addons: activeAddons,
        fulfillmentMethod: isPickup ? "pickup" : "delivery",
        deliveryZoneName: isPickup ? undefined : zoneObj?.name,
        deliveryFee: quickDeliveryFee,
        deliveryDate: quickDate || todayStr,
        deliveryTimeSlot: isTakeaway ? "Immediate Takeaway" : quickSlot || "Standard Slot",
        recipient: {
          name:
            quickCustomerName.trim() ||
            (quickOrderChannel === "walk_in"
              ? "Walk-In Customer"
              : "Customer"),
          phone:
            quickCustomerPhone.trim() ||
            (quickOrderChannel === "walk_in" ? "Walk-In Counter" : "-"),
          deliveryAddress: isPickup ? undefined : quickDeliveryAddress.trim(),
        },
        cardMessage: quickCardMessage.trim(),
        notes: quickNotes.trim()
          ? quickNotes.trim()
          : isTakeaway
          ? "Immediate counter takeaway"
          : "",
        totalAmount: quickOrderTotal,
        paymentMode: quickPaymentMode,
        paymentStatus:
          quickPaymentStatus === "paid"
            ? quickPaymentMode === "cash"
              ? "paid_cash"
              : quickPaymentMode === "duitnow_qr"
              ? "paid_duitnow"
              : quickPaymentMode === "bank_transfer"
              ? "paid_transfer"
              : "paid_tng"
            : "pending_verification",
        fulfillmentStatus: isTakeaway ? "completed" : "new",
        orderSource: quickOrderChannel,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success && data.order) {
        setOrders((prev) => [data.order, ...prev]);
        showToast(
          `Recorded ${
            quickOrderChannel === "walk_in" ? "Walk-In" : "Phone"
          } order #${data.order.id} (${currency} ${quickOrderTotal.toFixed(2)})`
        );
        setIsQuickOrderOpen(false);
        // Reset form fields
        setQuickCustomTitle("");
        setQuickCustomPrice("");
        setQuickCustomerName("");
        setQuickCustomerPhone("");
        setQuickDeliveryAddress("");
        setQuickCardMessage("");
        setQuickNotes("");
        setQuickSelectedAddonIds([]);
      } else {
        showToast(data.error || "Failed to record order.");
      }
    } catch (err) {
      console.error("Quick order creation failed:", err);
      showToast("Network error creating order.");
    } finally {
      setIsSubmittingQuickOrder(false);
    }
  };

  // Copy formatting for Lalamove / Grab riders
  const copyLalamoveInfo = (order: Order) => {
    const lines = [
      `[FLORIST DISPATCH - ${store.name}]`,
      `Recipient: ${order.recipient.name}`,
      `Contact: ${order.recipient.phone}`,
      `Address: ${order.recipient.deliveryAddress || "Self-Pickup at Store"}`,
      `Time Slot: ${order.deliveryDate} (${order.deliveryTimeSlot})`,
      `Item: ${order.product.name}`,
    ];

    if (order.addons && order.addons.length > 0) {
      lines.push(`Add-ons: ${order.addons.map((a) => a.name).join(", ")}`);
    }

    if (order.notes) {
      lines.push(`Delivery Notes: ${order.notes}`);
    }

    const text = lines.join("\n");
    navigator.clipboard.writeText(text);
    setCopiedId(order.id + "_rider");
    showToast("Copied details for Rider / Lalamove!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Copy card message
  const copyCardMessage = (order: Order) => {
    if (!order.cardMessage) return;
    navigator.clipboard.writeText(order.cardMessage);
    setCopiedId(order.id + "_card");
    showToast("Card message copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Status badge styling helper
  const getStatusBadge = (status: FulfillmentStatus) => {
    switch (status) {
      case "new":
        return {
          bg: "bg-amber-100 text-amber-900 border-amber-300",
          dot: "bg-amber-500",
          label: "New Order",
        };
      case "preparing":
        return {
          bg: "bg-purple-100 text-purple-900 border-purple-300",
          dot: "bg-purple-500",
          label: "Arranging",
        };
      case "ready":
        return {
          bg: "bg-cyan-100 text-cyan-900 border-cyan-300",
          dot: "bg-cyan-500",
          label: "Ready for Pickup",
        };
      case "dispatched":
        return {
          bg: "bg-blue-100 text-blue-900 border-blue-300",
          dot: "bg-blue-500",
          label: "Out with Rider",
        };
      case "completed":
        return {
          bg: "bg-emerald-100 text-emerald-900 border-emerald-300",
          dot: "bg-emerald-500",
          label: "Delivered & Done",
        };
      case "cancelled":
        return {
          bg: "bg-stone-100 text-stone-600 border-stone-300",
          dot: "bg-stone-400",
          label: "Cancelled",
        };
    }
  };

  // ==========================================
  // VIEW 1: PIN UNLOCK PAD SCREEN
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col justify-between px-4 py-8 max-w-md mx-auto relative select-none sm:my-8 sm:rounded-3xl sm:border sm:border-stone-200/80 sm:shadow-2xl sm:shadow-stone-200/60 sm:overflow-hidden">
        {/* Background ambient glow */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: primaryColor }}
        />

        {/* Top Header */}
        <div className="relative text-center pt-4">
          <div className="mx-auto h-16 w-16 relative rounded-2xl bg-white p-2.5 shadow-md shadow-stone-200/60 border border-stone-200/80 flex items-center justify-center">
            <Image
              src={store.logo}
              alt={store.name}
              width={56}
              height={56}
              className="object-contain"
            />
          </div>
          <h1 className="mt-3 text-lg font-extrabold tracking-tight text-stone-900">
            {store.name}
          </h1>
          <p className="text-xs text-stone-500 font-medium">
            Florist Staff Dispatch & Order Book
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200/80 px-3 py-1 text-[11px] font-semibold text-stone-700 shadow-2xs">
            <Lock className="h-3 w-3 text-stone-500" />
            <span>Enter 4-Digit Staff PIN</span>
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="relative my-6 flex flex-col items-center">
          <div className="flex items-center gap-3">
            {[0, 1, 2, 3].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`h-4 w-4 rounded-full transition-all duration-200 ${
                    isFilled
                      ? "scale-110 shadow-sm"
                      : "border-2 border-stone-300 bg-white/80 shadow-2xs"
                  }`}
                  style={{
                    backgroundColor: isFilled ? primaryColor : undefined,
                    borderColor: isFilled ? primaryColor : undefined,
                  }}
                />
              );
            })}
          </div>

          {isLocked ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/80 px-3.5 py-2 text-xs font-semibold text-rose-700 shadow-2xs animate-pulse">
              <Clock className="h-4 w-4 text-rose-500 shrink-0" />
              <span>Terminal locked. Try again in {formatCountdown(lockoutRemaining)}</span>
            </div>
          ) : authError ? (
            <div className="mt-4 flex items-center gap-1.5 text-xs text-rose-600 font-semibold animate-shake text-center px-4 bg-rose-50/80 border border-rose-200/60 rounded-xl py-1.5 shadow-2xs">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{authError}</span>
            </div>
          ) : null}

          {isVerifying && !isLocked && (
            <div className="mt-4 flex items-center gap-2 text-xs text-stone-500 font-medium">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-stone-600" />
              <span>Verifying PIN...</span>
            </div>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="relative grid grid-cols-3 gap-3 px-6 pb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              disabled={isLocked || isVerifying}
              onClick={() => handlePinDigit(num)}
              className="h-16 rounded-2xl bg-white hover:bg-stone-50 active:bg-stone-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center text-2xl font-bold text-stone-800 border border-stone-200/80 shadow-xs hover:shadow-sm cursor-pointer"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            disabled={isLocked || isVerifying}
            onClick={handlePinClear}
            className="h-16 rounded-2xl bg-stone-100/80 hover:bg-stone-200/80 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center text-xs font-bold text-stone-500 hover:text-stone-800 border border-stone-200/80 uppercase tracking-wider cursor-pointer shadow-2xs"
          >
            Clear
          </button>

          <button
            type="button"
            disabled={isLocked || isVerifying}
            onClick={() => handlePinDigit("0")}
            className="h-16 rounded-2xl bg-white hover:bg-stone-50 active:bg-stone-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center text-2xl font-bold text-stone-800 border border-stone-200/80 shadow-xs hover:shadow-sm cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            disabled={isLocked || isVerifying}
            onClick={handlePinBackspace}
            className="h-16 rounded-2xl bg-stone-100/80 hover:bg-stone-200/80 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center text-stone-500 hover:text-stone-800 border border-stone-200/80 cursor-pointer shadow-2xs"
            aria-label="Backspace"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Footer Link to Storefront */}
        <div className="text-center pt-2">
          <Link
            href={storefrontHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors py-1 px-3 rounded-full hover:bg-stone-200/50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Public Customer Store</span>
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: DISPATCH DESK & ORDER BOOK SCREEN
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-stone-900 pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-2xs">
        <div className="max-w-2xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 relative rounded-xl bg-stone-100 border border-stone-200/80 overflow-hidden flex items-center justify-center shrink-0">
              <Image
                src={store.logo}
                alt={store.name}
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-stone-900 leading-tight truncate">
                  {store.name}
                </h1>
              </div>
              <p className="text-[11px] text-stone-500 truncate">
                Staff Order Book &middot; PIN: {pin}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2 shrink-0">
            {/* Utility action buttons (Refresh, Shop, Lock) */}
            <div className="flex items-center gap-1.5 justify-end w-full sm:w-auto">
              <button
                type="button"
                onClick={() => fetchOrders(pin)}
                disabled={isLoadingOrders}
                className="p-1.5 sm:p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 active:scale-95 border border-stone-200/70 transition-all cursor-pointer"
                title="Refresh Orders"
              >
                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isLoadingOrders ? "animate-spin text-stone-900" : ""}`} />
              </button>

              <Link
                href={storefrontHref}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 active:scale-95 transition-all inline-flex items-center gap-1"
                title="Go to customer shop"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Shop</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 sm:p-2 rounded-xl text-stone-500 hover:text-rose-600 hover:bg-rose-50 active:scale-95 border border-stone-200/70 transition-all cursor-pointer"
                title="Lock / Logout"
              >
                <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>

            {/* Quick Order Button: Placed underneath Refresh/Shop/Lock on mobile, or inline on desktop */}
            <button
              type="button"
              onClick={() => setIsQuickOrderOpen(true)}
              className="w-full self-stretch sm:self-auto sm:w-auto px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-black active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer order-last sm:order-first"
              title="Record Walk-in takeaway or Phone call order"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Order</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* ============================================================ */}
        {/* EMERGENCY & CAPACITY CONTROLS (Option A Full Suite)          */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
          {/* Card Header & Live Status Indicators */}
          <div
            onClick={() => setIsEmergencyPanelOpen((prev) => !prev)}
            className="px-4 py-3 bg-stone-50/90 hover:bg-stone-100/80 transition-colors flex items-center justify-between cursor-pointer border-b border-stone-200/60"
          >
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg border ${
                  storeStatus?.isTodayPaused || storeStatus?.isTomorrowBlocked
                    ? "bg-rose-100 border-rose-300 text-rose-700 animate-pulse"
                    : "bg-emerald-100 border-emerald-300 text-emerald-700"
                }`}
              >
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-stone-900 leading-tight">
                  Emergency &amp; Capacity Controls
                </h3>
                <p className="text-[10px] text-stone-500">
                  Instant kill switch for same-day delivery, tomorrow block &amp; notice
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Today Status Pill */}
              {storeStatus?.isTodayPaused ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  <Pause className="h-2.5 w-2.5" />
                  <span>Today Paused</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <Check className="h-2.5 w-2.5" />
                  <span>Today Open</span>
                </span>
              )}

              {/* Tomorrow Status Pill */}
              {storeStatus?.isTomorrowBlocked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <Ban className="h-2.5 w-2.5" />
                  <span>Tomorrow Blocked</span>
                </span>
              )}

              {/* Banner Active Pill */}
              {storeStatus?.emergencyNotice && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                  <span>Banner On</span>
                </span>
              )}

              <div className="p-1 rounded-lg text-stone-400">
                {isEmergencyPanelOpen ? (
                  <ChevronUp className="h-4 w-4 text-stone-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-stone-600" />
                )}
              </div>
            </div>
          </div>

          {/* Expandable Controls Panel */}
          {isEmergencyPanelOpen && (
            <div className="p-4 space-y-4 text-xs bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Control 1: Today Same-Day Orders */}
                <div
                  className={`p-3 rounded-xl border transition-all ${
                    storeStatus?.isTodayPaused
                      ? "bg-rose-50/80 border-rose-200"
                      : "bg-stone-50/80 border-stone-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-stone-900">
                      1. Same-Day Deliveries (Today)
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        storeStatus?.isTodayPaused
                          ? "bg-rose-200 text-rose-900"
                          : "bg-emerald-200 text-emerald-900"
                      }`}
                    >
                      {storeStatus?.isTodayPaused ? "PAUSED" : "ACTIVE"}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mb-3 leading-relaxed">
                    {storeStatus?.isTodayPaused
                      ? "Same-day orders are currently paused on storefront. Customers must order for tomorrow onwards."
                      : "Store is currently accepting same-day orders. Tap below if overwhelmed or out of fresh stock."}
                  </p>
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() =>
                      handleToggleEmergency({
                        isTodayPaused: !storeStatus?.isTodayPaused,
                      })
                    }
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                      storeStatus?.isTodayPaused
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-rose-600 hover:bg-rose-700 text-white"
                    }`}
                  >
                    {storeStatus?.isTodayPaused ? (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        <span>Resume Same-Day Deliveries</span>
                      </>
                    ) : (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        <span>Emergency Pause Today</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Control 2: Tomorrow's Deliveries */}
                <div
                  className={`p-3 rounded-xl border transition-all ${
                    storeStatus?.isTomorrowBlocked
                      ? "bg-amber-50/80 border-amber-200"
                      : "bg-stone-50/80 border-stone-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-stone-900">
                      2. Deliveries (Tomorrow)
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        storeStatus?.isTomorrowBlocked
                          ? "bg-amber-200 text-amber-900"
                          : "bg-emerald-200 text-emerald-900"
                      }`}
                    >
                      {storeStatus?.isTomorrowBlocked ? "BLOCKED" : "OPEN"}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mb-3 leading-relaxed">
                    {storeStatus?.isTomorrowBlocked
                      ? "Tomorrow is blocked from checkout. Customers cannot select tomorrow as delivery date."
                      : "Tomorrow is open for orders. Tap below to block tomorrow (e.g. holiday, supplier delay, personal leave)."}
                  </p>
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() =>
                      handleToggleEmergency({
                        isTomorrowBlocked: !storeStatus?.isTomorrowBlocked,
                      })
                    }
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                      storeStatus?.isTomorrowBlocked
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-amber-600 hover:bg-amber-700 text-white"
                    }`}
                  >
                    {storeStatus?.isTomorrowBlocked ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Unblock &amp; Open Tomorrow</span>
                      </>
                    ) : (
                      <>
                        <Ban className="h-3.5 w-3.5" />
                        <span>Block Tomorrow</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Control 3: Storefront Emergency Announcement Banner */}
              <div className="pt-2 border-t border-stone-200/70">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    3. Storefront Emergency Announcement Banner
                  </label>
                  {storeStatus?.emergencyNotice && (
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleToggleEmergency({ emergencyNotice: "" })}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                    >
                      Clear Active Banner
                    </button>
                  )}
                </div>

                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Due to high demand, same-day orders are paused today. WhatsApp us for urgent inquiries."
                    value={emergencyNoticeInput}
                    onChange={(e) => setEmergencyNoticeInput(e.target.value)}
                    className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() =>
                      handleToggleEmergency({
                        emergencyNotice: emergencyNoticeInput.trim(),
                      })
                    }
                    className="py-2 px-4 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs shadow-2xs shrink-0 cursor-pointer"
                  >
                    {isUpdatingStatus ? "Saving..." : "Save Banner"}
                  </button>
                </div>

                {/* Preset Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold">
                    Quick Presets:
                  </span>
                  {[
                    "Orders at maximum capacity today. Deliveries for tomorrow onwards are warmly welcomed!",
                    "Fresh bloom shipment is delayed today. Re-opening for deliveries tomorrow morning.",
                    "Store is closed today for urgent facility maintenance. Please WhatsApp us for inquiries.",
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEmergencyNoticeInput(preset)}
                      className="text-[10px] rounded-lg border border-stone-200 bg-stone-50 px-2 py-0.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer text-left truncate max-w-xs"
                      title={preset}
                    >
                      Preset {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Control 4: Active Peak Holiday Rules & Pricing Strategies */}
              {store.holidayPeakConfig?.rules && store.holidayPeakConfig.rules.length > 0 && (
                <div className="pt-2 border-t border-stone-200/70">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-rose-600" />
                      <span>4. Festive Peak Surcharge Pricing Strategy</span>
                    </label>
                    <span className="text-[10px] text-stone-400 font-medium">
                      Live Customer Experience
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-500 mb-2.5 leading-relaxed">
                    Decide how festive holiday peak surcharges appear to your customers during checkout &amp; WhatsApp:
                  </p>

                  {/* 1-Tap Strategy Toggle Switcher */}
                  {(() => {
                    const activeStrategy =
                      storeStatus?.holidayPricingDisplay ||
                      store.holidayPeakConfig.rules[0]?.pricingDisplay ||
                      "separate_surcharge";

                    return (
                      <div className="space-y-2 mb-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Option 1: Separate Surcharge Line */}
                          <button
                            type="button"
                            disabled={isUpdatingStatus}
                            onClick={() =>
                              handleToggleEmergency({
                                holidayPricingDisplay: "separate_surcharge",
                              })
                            }
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                              activeStrategy === "separate_surcharge"
                                ? "bg-sky-50/90 border-sky-400 ring-2 ring-sky-200 shadow-2xs"
                                : "bg-stone-50/70 border-stone-200 hover:bg-stone-100 hover:border-stone-300"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                                <span>Separate Surcharge Line</span>
                              </span>
                              {activeStrategy === "separate_surcharge" && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-sky-200 text-sky-900 flex items-center gap-1">
                                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-600 leading-snug mb-2">
                              Bouquet shows base price (e.g. {currency} 168.00). Surcharge (+{currency} 35.00) is itemized separately at checkout.
                            </p>
                            <div className="text-[10px] font-semibold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md inline-block">
                              Best for: Transparency &amp; explaining flower market spikes
                            </div>
                          </button>

                          {/* Option 2: Charge Directly in Product Price */}
                          <button
                            type="button"
                            disabled={isUpdatingStatus}
                            onClick={() =>
                              handleToggleEmergency({
                                holidayPricingDisplay: "inclusive",
                              })
                            }
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                              activeStrategy === "inclusive"
                                ? "bg-purple-50/90 border-purple-400 ring-2 ring-purple-200 shadow-2xs"
                                : "bg-stone-50/70 border-stone-200 hover:bg-stone-100 hover:border-stone-300"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                                <span>Directly in Product Price</span>
                              </span>
                              {activeStrategy === "inclusive" && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-purple-200 text-purple-900 flex items-center gap-1">
                                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-600 leading-snug mb-2">
                              Surcharge rolled into price (e.g. {currency} 203.00) with [Holiday Seasonal Price] badge. Zero fee surprises.
                            </p>
                            <div className="text-[10px] font-semibold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md inline-block">
                              Best for: Zero checkout friction &amp; higher conversions
                            </div>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Active Rules List */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                      Scheduled Festive Windows:
                    </span>
                    {store.holidayPeakConfig.rules.map((rule) => {
                      const activeStrategy =
                        storeStatus?.holidayPricingDisplay ||
                        rule.pricingDisplay ||
                        "separate_surcharge";
                      const isInclusive = activeStrategy === "inclusive";

                      return (
                        <div
                          key={rule.id}
                          className="flex items-center justify-between p-2 rounded-xl border border-stone-200 bg-stone-50/70 text-xs"
                        >
                          <div>
                            <span className="font-bold text-stone-900 block text-[11px]">
                              {rule.name}
                            </span>
                            <span className="text-[10px] text-stone-500">
                              {rule.startDate} &ndash; {rule.endDate} &bull; Cap: {rule.maxDailyOrders || "Unlimited"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-rose-700 block text-[11px]">
                              {rule.surchargeType === "percentage" ? `+${rule.surchargeAmount}%` : `+${currency} ${rule.surchargeAmount}`}
                            </span>
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${isInclusive ? "bg-purple-100 text-purple-800 border border-purple-200" : "bg-sky-100 text-sky-800 border border-sky-200"}`}>
                              {isInclusive ? "All-Inclusive Price" : "Separate Surcharge"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Control 5: Bouquet Stock Availability (Instant Out-of-Stock Toggle) */}
              <div className="pt-2.5 border-t border-stone-200/70">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5 text-stone-700" />
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                      5. Bouquet Stock Availability
                    </label>
                  </div>
                  <div>
                    {(() => {
                      const outCount = storeStatus?.outOfStockProductIds?.length || 0;
                      return (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            outCount > 0
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {outCount > 0 ? `${outCount} Sold Out` : "All In Stock"}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <p className="text-[11px] text-stone-500 mb-2 leading-relaxed">
                  Ran out of blooms today? Tap any bouquet below to mark it <strong>Sold Out</strong> on your website. Tap again to restore when fresh stock arrives:
                </p>

                {/* Products Stock List */}
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                  {store.products.map((prod) => {
                    const isOut = Boolean(
                      storeStatus?.outOfStockProductIds?.includes(prod.id)
                    );
                    return (
                      <div
                        key={prod.id}
                        className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                          isOut
                            ? "bg-rose-50/70 border-rose-200/80"
                            : "bg-white border-stone-200/80 hover:border-stone-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-stone-100 border border-stone-200/60">
                            <Image
                              src={prod.image}
                              alt={prod.name}
                              fill
                              sizes="36px"
                              className={`object-cover ${isOut ? "grayscale opacity-75" : ""}`}
                            />
                            {isOut && (
                              <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                                <Ban className="h-3.5 w-3.5 text-white stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span
                              className={`block text-[11px] font-bold truncate ${
                                isOut ? "text-stone-500 line-through" : "text-stone-900"
                              }`}
                            >
                              {prod.name}
                            </span>
                            <span className="text-[10px] text-stone-500">
                              {currency} {prod.price.toFixed(2)} &bull; {prod.category || "Bouquet"}
                            </span>
                          </div>
                        </div>

                        {/* 1-Tap Toggle Pill with Loading Indicator */}
                        <button
                          type="button"
                          disabled={isUpdatingStatus || updatingStockProductId === prod.id}
                          onClick={() => handleToggleProductStock(prod.id)}
                          className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-2xs ${
                            updatingStockProductId === prod.id
                              ? "opacity-80 cursor-wait bg-stone-100 text-stone-600 border border-stone-300"
                              : isOut
                              ? "bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-95"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer active:scale-95"
                          }`}
                        >
                          {updatingStockProductId === prod.id ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin text-stone-600" />
                              <span>Updating...</span>
                            </>
                          ) : isOut ? (
                            <>
                              <Ban className="h-3 w-3 stroke-[2.5]" />
                              <span>Sold Out</span>
                            </>
                          ) : (
                            <>
                              <Check className="h-3 w-3 stroke-[3]" />
                              <span>In Stock</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Reset all button if any item is out */}
                {(storeStatus?.outOfStockProductIds?.length || 0) > 0 && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={isUpdatingStatus || isResettingAllStock}
                      onClick={handleResetAllStock}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-600 hover:text-stone-900 underline cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                    >
                      {isResettingAllStock ? (
                        <>
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          <span>Resetting All...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-2.5 w-2.5" />
                          <span>Reset: Mark All Bouquets In Stock</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* KPI Metrics Dashboard Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Card 1: Today Deliveries */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-3 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Today
              </span>
              <Clock className="h-3.5 w-3.5 text-stone-400" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-stone-900">
                {todayOrders.length}
              </span>
              <span className="text-[11px] text-stone-500 ml-1">orders</span>
            </div>
            <div className="mt-1 text-[11px] font-semibold text-emerald-700">
              {currency} {todayRevenue.toFixed(0)}
            </div>
          </div>

          {/* Card 2: Tomorrow Deliveries */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-3 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Tomorrow
              </span>
              <Calendar className="h-3.5 w-3.5 text-stone-400" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-stone-900">
                {tomorrowOrders.length}
              </span>
              <span className="text-[11px] text-stone-500 ml-1">orders</span>
            </div>
            <div className="mt-1 text-[11px] font-medium text-stone-500">
              Prep ready
            </div>
          </div>

          {/* Card 3: Month To Date Sales */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-3 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                This Month
              </span>
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-black text-stone-900">
                {currency} {monthRevenue.toFixed(0)}
              </span>
            </div>
            <div className="mt-1 text-[10px] text-stone-400">
              Gross sales
            </div>
          </div>
        </div>

        {/* Unified Sales Channel Reconciliation Strip (Today's Breakdown) */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-3.5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <PieChart className="h-4 w-4 text-stone-700" />
              <h3 className="text-xs font-bold text-stone-900">
                Today&apos;s Sales 
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsQuickOrderOpen(true)}
              className="text-[11px] font-bold text-stone-700 hover:text-stone-900 inline-flex items-center gap-1 cursor-pointer hover:underline"
            >
              <Plus className="h-3 w-3" />
              <span>Record</span>
            </button>
          </div>

          {/* 3 Channels Grid */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* Channel 1: Web Store */}
            <div className="rounded-xl bg-sky-50/70 border border-sky-100 p-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 uppercase tracking-wider">
                  <Globe className="h-2.5 w-2.5 text-sky-600" />
                  <span>Web Shop</span>
                </span>
                <span className="text-[10px] font-semibold text-sky-600 bg-sky-100/80 px-1.5 py-0.2 rounded-md">
                  {todayChannelStats.webCount}
                </span>
              </div>
              <div className="mt-1.5 font-bold text-stone-900 text-xs">
                {currency} {todayChannelStats.webRevenue.toFixed(0)}
              </div>
            </div>

            {/* Channel 2: Walk-In Retail */}
            <div className="rounded-xl bg-purple-50/70 border border-purple-100 p-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 uppercase tracking-wider">
                  <Store className="h-2.5 w-2.5 text-purple-600" />
                  <span>Walk-In</span>
                </span>
                <span className="text-[10px] font-semibold text-purple-600 bg-purple-100/80 px-1.5 py-0.2 rounded-md">
                  {todayChannelStats.walkInCount}
                </span>
              </div>
              <div className="mt-1.5 font-bold text-stone-900 text-xs">
                {currency} {todayChannelStats.walkInRevenue.toFixed(0)}
              </div>
            </div>

            {/* Channel 3: Phone Order */}
            <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                  <Phone className="h-2.5 w-2.5 text-amber-600" />
                  <span>Phone</span>
                </span>
                <span className="text-[10px] font-semibold text-amber-600 bg-amber-100/80 px-1.5 py-0.2 rounded-md">
                  {todayChannelStats.phoneCount}
                </span>
              </div>
              <div className="mt-1.5 font-bold text-stone-900 text-xs">
                {currency} {todayChannelStats.phoneRevenue.toFixed(0)}
              </div>
            </div>
          </div>

          {/* Payment Method Distribution Bar */}
          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-stone-600">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Payment:
            </span>
            <div className="inline-flex items-center gap-1">
              <Banknote className="h-3 w-3 text-emerald-600" />
              <span>Cash:</span>
              <strong className="text-stone-900 font-bold">{currency} {todayChannelStats.cashTotal.toFixed(0)}</strong>
            </div>
            <div className="inline-flex items-center gap-1">
              <QrCode className="h-3 w-3 text-pink-600" />
              <span>DuitNow QR:</span>
              <strong className="text-stone-900 font-bold">{currency} {todayChannelStats.duitnowTotal.toFixed(0)}</strong>
            </div>
            <div className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-sky-600" />
              <span>TNG / QR:</span>
              <strong className="text-stone-900 font-bold">{currency} {todayChannelStats.tngTotal.toFixed(0)}</strong>
            </div>
            {todayChannelStats.transferTotal > 0 && (
              <div className="inline-flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-blue-600" />
                <span>Bank:</span>
                <strong className="text-stone-900 font-bold">{currency} {todayChannelStats.transferTotal.toFixed(0)}</strong>
              </div>
            )}
          </div>
        </div>

        {/* View Tabs & Search Bar */}
        <div className="space-y-2.5">
          {/* Tabs */}
          <div className="flex items-center rounded-2xl bg-stone-200/70 p-1 text-xs font-semibold text-stone-600">
            <button
              type="button"
              onClick={() => setActiveTab("today")}
              className={`flex-1 rounded-xl py-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "today"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "hover:text-stone-900"
              }`}
            >
              <span>Today</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === "today"
                    ? "bg-stone-900 text-white"
                    : "bg-stone-300 text-stone-700"
                }`}
              >
                {todayOrders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tomorrow")}
              className={`flex-1 rounded-xl py-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "tomorrow"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "hover:text-stone-900"
              }`}
            >
              <span>Tomorrow</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === "tomorrow"
                    ? "bg-stone-900 text-white"
                    : "bg-stone-300 text-stone-700"
                }`}
              >
                {tomorrowOrders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("upcoming")}
              className={`flex-1 rounded-xl py-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "upcoming"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "hover:text-stone-900"
              }`}
            >
              <span>Upcoming</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === "upcoming"
                    ? "bg-stone-900 text-white"
                    : "bg-stone-300 text-stone-700"
                }`}
              >
                {upcomingOrders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`flex-1 rounded-xl py-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "all"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "hover:text-stone-900"
              }`}
            >
              <span>All</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === "all"
                    ? "bg-stone-900 text-white"
                    : "bg-stone-300 text-stone-700"
                }`}
              >
                {orders.length}
              </span>
            </button>
          </div>

          {/* Channel Source Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 mr-0.5">
              Source:
            </span>
            <button
              type="button"
              onClick={() => setChannelFilter("all")}
              className={`px-2.5 py-1 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-xs ${
                channelFilter === "all"
                  ? "bg-stone-900 text-white font-bold shadow-2xs"
                  : "bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50"
              }`}
            >
              All Channels
            </button>
            <button
              type="button"
              onClick={() => setChannelFilter("web")}
              className={`px-2.5 py-1 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-xs inline-flex items-center gap-1 ${
                channelFilter === "web"
                  ? "bg-sky-700 text-white font-bold shadow-2xs"
                  : "bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50"
              }`}
            >
              <Globe className="h-3 w-3" />
              <span>Web Orders</span>
            </button>
            <button
              type="button"
              onClick={() => setChannelFilter("walk_in")}
              className={`px-2.5 py-1 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-xs inline-flex items-center gap-1 ${
                channelFilter === "walk_in"
                  ? "bg-purple-700 text-white font-bold shadow-2xs"
                  : "bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50"
              }`}
            >
              <Store className="h-3 w-3" />
              <span>Walk-In</span>
            </button>
            <button
              type="button"
              onClick={() => setChannelFilter("phone")}
              className={`px-2.5 py-1 rounded-xl font-medium transition-all cursor-pointer whitespace-nowrap text-xs inline-flex items-center gap-1 ${
                channelFilter === "phone"
                  ? "bg-amber-700 text-white font-bold shadow-2xs"
                  : "bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50"
              }`}
            >
              <Phone className="h-3 w-3" />
              <span>Phone Orders</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search recipient name, phone, address, or bouquet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-stone-200/90 bg-white pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
              <PackageCheck className="h-6 w-6 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">
              No orders found
            </h3>
            <p className="mt-1 text-xs text-stone-500 max-w-xs mx-auto">
              {searchQuery
                ? `No results matching "${searchQuery}". Try clearing search.`
                : activeTab === "today"
                ? "No deliveries scheduled for today yet."
                : "No orders found in this category."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusBadge = getStatusBadge(order.fulfillmentStatus);
              const isUpdating = updatingOrderId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all hover:shadow-xs"
                >
                  {/* Card Header: Slot & Status */}
                  <div className="bg-stone-50/80 px-4 py-2.5 border-b border-stone-200/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900 flex-wrap">
                      {/* Channel Badge */}
                      {order.orderSource === "walk_in" ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold">
                          <Store className="h-2.5 w-2.5 text-purple-600 shrink-0" />
                          <span>Walk-In</span>
                        </span>
                      ) : order.orderSource === "phone" ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold">
                          <Phone className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                          <span>Phone Order</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-semibold">
                          <Globe className="h-2.5 w-2.5 text-sky-600 shrink-0" />
                          <span>Web</span>
                        </span>
                      )}

                      <Clock className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                      <span>{order.deliveryDate}</span>
                      <span className="text-stone-400">&bull;</span>
                      <span className="text-stone-800">{order.deliveryTimeSlot}</span>

                      {isRushOrder(order) && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                          <Zap className="h-2.5 w-2.5 text-amber-600 fill-amber-500 shrink-0" />
                          <span>Rush Order</span>
                        </span>
                      )}

                      {order.holidayName && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold">
                          <span>{order.holidayName}</span>
                          {order.holidaySurcharge ? <span>(+{currency} {order.holidaySurcharge.toFixed(0)})</span> : null}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => openRescheduleModal(order)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-stone-300 text-[10px] font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer shadow-2xs ml-1"
                        title="Change delivery time slot or WhatsApp proposal"
                      >
                        <Clock className="h-2.5 w-2.5 text-stone-500" />
                        <span>Reschedule</span>
                      </button>
                    </div>

                    {/* Status Pill & Dropdown */}
                    <div className="relative inline-flex items-center">
                      <select
                        value={order.fulfillmentStatus}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as FulfillmentStatus)
                        }
                        disabled={isUpdating}
                        className={`text-[11px] font-bold rounded-lg border px-2.5 py-1 appearance-none pr-6 cursor-pointer focus:outline-none transition-colors ${statusBadge.bg}`}
                      >
                        <option value="new">New Order</option>
                        <option value="preparing">Arranging Bouquet</option>
                        <option value="ready">Ready for Pickup / Rider</option>
                        <option value="dispatched">Out with Rider</option>
                        <option value="completed">Delivered &amp; Done</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 text-stone-600" />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3.5">
                    {/* Rush Order Alert Banner with 1-Tap Reschedule Call-to-Action */}
                    {isRushOrder(order) && (
                      <div className="flex items-center justify-between rounded-xl border border-amber-300/80 bg-amber-50/90 p-2.5 text-xs text-amber-950 shadow-2xs">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <Zap className="h-4 w-4 text-amber-600 fill-amber-500 shrink-0" />
                          <div className="text-[11px] leading-tight">
                            <span className="font-bold">⚡ Same-Day Rush:</span>{" "}
                            <span className="text-amber-900">Ordered close to slot window.</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openRescheduleModal(order)}
                          className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                        >
                          <Clock className="h-3 w-3" />
                          <span>Reschedule</span>
                        </button>
                      </div>
                    )}

                    {/* Product & Addons Strip */}
                    <div className="flex items-start gap-3">
                      <div className="relative h-16 w-16 rounded-xl bg-stone-100 overflow-hidden border border-stone-200/70 shrink-0">
                        <Image
                          src={order.product.image}
                          alt={order.product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-stone-900 leading-snug">
                            {order.product.name}
                          </h4>
                          <span className="text-xs font-bold text-stone-900 shrink-0">
                            {currency} {order.product.price.toFixed(2)}
                          </span>
                        </div>

                        {/* Add-ons badges */}
                        {order.addons && order.addons.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {order.addons.map((addon) => (
                              <span
                                key={addon.id}
                                className="inline-flex items-center gap-1 rounded-md bg-stone-100 border border-stone-200 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700"
                              >
                                <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                                <span>{addon.name}</span>
                                <span className="text-stone-400 font-normal">
                                  (+{currency} {addon.price.toFixed(0)})
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recipient & Delivery Details */}
                    <div className="rounded-xl bg-stone-50 p-3 border border-stone-200/60 space-y-2 text-xs">
                      {/* Recipient Name & Phone */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-stone-900 text-sm">
                            {order.recipient.name}
                          </div>
                          {order.fulfillmentMethod === "delivery" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded-md border border-sky-200">
                              <Truck className="h-2.5 w-2.5" />
                              <span>Delivery</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md border border-emerald-200">
                              <Store className="h-2.5 w-2.5" />
                              <span>Self-Pickup</span>
                            </span>
                          )}
                        </div>

                        {/* Quick Call & WhatsApp Links */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openRescheduleModal(order)}
                            className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 shadow-2xs transition-colors cursor-pointer"
                            title="Reschedule delivery slot"
                          >
                            <Clock className="h-3.5 w-3.5" />
                          </button>
                          <a
                            href={`tel:${order.recipient.phone}`}
                            className="p-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50 shadow-2xs transition-colors"
                            title="Call recipient"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/${cleanPhone(order.recipient.phone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C7E] hover:bg-[#25D366]/20 shadow-2xs transition-colors"
                            title="WhatsApp recipient"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Address for Delivery */}
                      {order.fulfillmentMethod === "delivery" && order.recipient.deliveryAddress && (
                        <div className="pt-1 border-t border-stone-200/50">
                          <div className="flex items-start gap-1.5 text-stone-700">
                            <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0 mt-0.5" />
                            <div className="flex-1 text-[11px] leading-relaxed">
                              <span>{order.recipient.deliveryAddress}</span>
                              {order.deliveryZoneName && (
                                <span className="block text-[10px] font-semibold text-stone-500 mt-0.5">
                                  Zone: {order.deliveryZoneName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick Rider Action Bar */}
                          <div className="mt-2.5 flex items-center gap-2 pt-1 border-t border-stone-200/40">
                            <button
                              type="button"
                              onClick={() => copyLalamoveInfo(order)}
                              className="flex-1 py-1.5 px-2.5 rounded-lg bg-white border border-stone-300 text-[11px] font-semibold text-stone-800 hover:bg-stone-100 flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 transition-all cursor-pointer"
                            >
                              {copiedId === order.id + "_rider" ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span className="text-emerald-700 font-bold">Copied for Rider!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 text-stone-500" />
                                  <span>Copy for Lalamove / Grab</span>
                                </>
                              )}
                            </button>

                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                order.recipient.deliveryAddress
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1.5 px-2.5 rounded-lg bg-white border border-stone-300 text-[11px] font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 flex items-center justify-center gap-1 shadow-2xs transition-colors"
                              title="Open in Google Maps"
                            >
                              <ExternalLink className="h-3 w-3 text-stone-500" />
                              <span>Maps</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Notes / Special Instructions */}
                      {order.notes && (
                        <div className="text-[11px] text-amber-900 bg-amber-50/70 p-2 rounded-lg border border-amber-200/50">
                          <strong className="font-semibold">Notes:</strong> {order.notes}
                        </div>
                      )}
                    </div>

                    {/* Greeting Card Message Box */}
                    {order.cardMessage && (
                      <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-3">
                        <div className="flex items-center justify-between text-[11px] font-bold text-rose-950 uppercase tracking-wider mb-1">
                          <span>Florist Card Message</span>
                          <button
                            type="button"
                            onClick={() => copyCardMessage(order)}
                            className="inline-flex items-center gap-1 font-semibold text-[10px] text-rose-700 hover:text-rose-900 hover:underline cursor-pointer"
                          >
                            {copiedId === order.id + "_card" ? (
                              <>
                                <Check className="h-2.5 w-2.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-2.5 w-2.5 text-rose-500" />
                                <span>Copy Text</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs italic text-stone-800 leading-relaxed pl-2 border-l-2 border-rose-400">
                          &ldquo;{order.cardMessage}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Order Financials Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                      {order.paymentMode === "cash" ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Banknote className="h-3 w-3 text-emerald-600" />
                          <span>Paid in Cash</span>
                        </div>
                      ) : order.paymentMode === "duitnow_qr" ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-pink-800 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                          <QrCode className="h-3 w-3 text-pink-600" />
                          <span>Paid via DuitNow QR</span>
                        </div>
                      ) : order.paymentMode === "bank_transfer" ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          <CreditCard className="h-3 w-3 text-blue-600" />
                          <span>Bank Transfer</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          <span>Paid via Touch &apos;n Go</span>
                        </div>
                      )}

                      <div className="flex items-baseline gap-1.5 flex-wrap justify-end">
                        {order.holidaySurcharge && order.holidaySurcharge > 0 ? (
                          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            Incl. {order.holidayName || "Holiday"} (+{currency} {order.holidaySurcharge.toFixed(0)})
                          </span>
                        ) : null}
                        <span className="text-[11px] text-stone-400">Grand Total:</span>
                        <span className="text-sm font-bold text-stone-900">
                          {currency} {order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* MODAL: RESCHEDULE DELIVERY SLOT & 1-TAP WHATSAPP NEGOTIATION */}
      {/* ============================================================ */}
      {rescheduleState && (() => {
        const targetOrder = orders.find((o) => o.id === rescheduleState.orderId);
        if (!targetOrder) return null;

        const effectiveSlot =
          rescheduleState.customTimeSlot.trim() || rescheduleState.deliveryTimeSlot;
        const waProposalUrl = getRescheduleWhatsAppUrl(
          targetOrder,
          rescheduleState.deliveryDate,
          effectiveSlot
        );
        const waMessageText = getRescheduleWhatsAppMessage(
          targetOrder,
          rescheduleState.deliveryDate,
          effectiveSlot
        );

        return (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-scale-up">
              {/* Header */}
              <div className="px-5 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/80">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-900">
                      Reschedule Delivery Slot
                    </h3>
                    {isRushOrder(targetOrder) && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                        <Zap className="h-2.5 w-2.5 text-amber-600 fill-amber-500" />
                        <span>Rush</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Order #{targetOrder.id} &bull; {targetOrder.recipient.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeRescheduleModal}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Current Scheduled Time */}
                <div className="rounded-xl bg-stone-100/80 p-3 border border-stone-200/70 flex items-center justify-between">
                  <div className="text-stone-600">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Currently Scheduled
                    </span>
                    <span className="font-bold text-stone-900 text-xs">
                      {targetOrder.deliveryDate} ({targetOrder.deliveryTimeSlot})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-stone-500 block">
                      {targetOrder.product.name}
                    </span>
                    <span className="text-[11px] font-bold text-stone-900">
                      {currency} {targetOrder.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Step 1: Change Date */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    1. Select Delivery Date
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() =>
                        setRescheduleState((prev) =>
                          prev ? { ...prev, deliveryDate: todayStr } : prev
                        )
                      }
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        rescheduleState.deliveryDate === todayStr
                          ? "bg-stone-900 text-white border-stone-900 shadow-2xs"
                          : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                      }`}
                    >
                      Today ({todayStr})
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRescheduleState((prev) =>
                          prev ? { ...prev, deliveryDate: tomorrowStr } : prev
                        )
                      }
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        rescheduleState.deliveryDate === tomorrowStr
                          ? "bg-stone-900 text-white border-stone-900 shadow-2xs"
                          : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                      }`}
                    >
                      Tomorrow ({tomorrowStr})
                    </button>
                  </div>
                  <input
                    type="date"
                    min={todayStr}
                    value={rescheduleState.deliveryDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && val < todayStr) {
                        setRescheduleState((prev) =>
                          prev ? { ...prev, deliveryDate: todayStr } : prev
                        );
                        showToast("Cannot select a date in the past.");
                      } else {
                        setRescheduleState((prev) =>
                          prev ? { ...prev, deliveryDate: val } : prev
                        );
                      }
                    }}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                {/* Step 2: Choose Slot */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                      2. Select New Time Slot
                    </label>
                    <span className="text-[10px] text-stone-400">
                      Click to choose standard slot
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-1 rounded-xl bg-stone-50 border border-stone-200/60">
                    {availableSlots.map((slot) => {
                      const isSelected =
                        !rescheduleState.customTimeSlot &&
                        rescheduleState.deliveryTimeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() =>
                            setRescheduleState((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    deliveryTimeSlot: slot,
                                    customTimeSlot: "",
                                  }
                                : prev
                            )
                          }
                          className={`px-2.5 py-2 rounded-lg text-left text-xs font-medium border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-white font-bold text-stone-900 border-stone-900 shadow-xs"
                              : "bg-white/80 text-stone-700 border-stone-200/70 hover:bg-white"
                          }`}
                        >
                          <span className="truncate">{slot}</span>
                          {isSelected && <Check className="h-3 w-3 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Or Custom Slot Input */}
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Or enter custom slot (e.g. 04:30 PM sharp, or Afternoon 3-4pm)"
                      value={rescheduleState.customTimeSlot}
                      onChange={(e) =>
                        setRescheduleState((prev) =>
                          prev ? { ...prev, customTimeSlot: e.target.value } : prev
                        )
                      }
                      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>

                {/* Step 3: Polite WhatsApp Proposal Preview */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                      3. WhatsApp Reschedule Proposal (Preview)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        copyRescheduleMessage(
                          targetOrder,
                          rescheduleState.deliveryDate,
                          effectiveSlot
                        )
                      }
                      className="text-[11px] font-semibold text-stone-500 hover:text-stone-900 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copy Message</span>
                    </button>
                  </div>

                  <div className="rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 p-3 text-[11px] font-mono whitespace-pre-line text-stone-800 leading-relaxed max-h-36 overflow-y-auto">
                    {waMessageText}
                  </div>
                </div>
              </div>

              {/* Bottom Actions Footer */}
              <div className="p-4 border-t border-stone-200 bg-stone-50/70 flex flex-col sm:flex-row items-center gap-2 justify-between">
                <a
                  href={waProposalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>1-Tap WhatsApp Customer</span>
                </a>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={closeRescheduleModal}
                    className="flex-1 sm:flex-none py-2.5 px-3.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveReschedule}
                    disabled={isSavingSlot}
                    className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingSlot ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Save &amp; Update Slot</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================ */}
      {/* MODAL: QUICK ORDER (WALK-IN & PHONE ORDER COUNTER POS)       */}
      {/* ============================================================ */}
      {isQuickOrderOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/90">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-stone-900 text-white">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 leading-tight">
                    Quick Record Order (Counter POS)
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Record walk-in retail &amp; phone orders directly into daily sales
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsQuickOrderOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateQuickOrder} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Channel Selector: Walk-In vs Phone */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                  1. Order Channel / Origin
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickOrderChannel("walk_in");
                      setQuickFulfillment("takeaway");
                      setQuickSlot("Immediate Takeaway");
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      quickOrderChannel === "walk_in"
                        ? "bg-purple-700 text-white border-purple-700 shadow-2xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <Store className="h-4 w-4" />
                    <span>Walk-In Counter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuickOrderChannel("phone");
                      setQuickFulfillment("delivery");
                      setQuickSlot("Standard Slot");
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      quickOrderChannel === "phone"
                        ? "bg-amber-700 text-white border-amber-700 shadow-2xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <Phone className="h-4 w-4" />
                    <span>Phone Call Order</span>
                  </button>
                </div>
              </div>

              {/* Product Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    2. Product &amp; Price
                  </label>
                  <div className="flex items-center gap-1 rounded-lg bg-stone-100 p-0.5 text-[10px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setQuickOrderProductType("catalog")}
                      className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        quickOrderProductType === "catalog"
                          ? "bg-white text-stone-900 shadow-2xs"
                          : "text-stone-500 hover:text-stone-900"
                      }`}
                    >
                      Store Catalog
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickOrderProductType("custom")}
                      className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        quickOrderProductType === "custom"
                          ? "bg-white text-stone-900 shadow-2xs"
                          : "text-stone-500 hover:text-stone-900"
                      }`}
                    >
                      Custom Arrangement
                    </button>
                  </div>
                </div>

                {quickOrderProductType === "catalog" ? (
                  <div className="space-y-1.5">
                    <select
                      value={quickSelectedProductId}
                      onChange={(e) => setQuickSelectedProductId(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 font-medium focus:outline-none focus:ring-1 focus:ring-stone-900"
                    >
                      {store.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - {currency} {p.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Arrangement Name (e.g. 5 Red Roses Hand Bouquet)"
                        value={quickCustomTitle}
                        onChange={(e) => setQuickCustomTitle(e.target.value)}
                        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
                      />
                    </div>
                    <div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">
                          {currency}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={quickCustomPrice}
                          onChange={(e) => setQuickCustomPrice(e.target.value)}
                          className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3 py-2 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Add-ons Checklist */}
                {store.addons && store.addons.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] font-semibold text-stone-400 block mb-1">
                      Optional Add-ons:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {store.addons.map((addon) => {
                        const isChecked = quickSelectedAddonIds.includes(addon.id);
                        return (
                          <button
                            key={addon.id}
                            type="button"
                            onClick={() => {
                              setQuickSelectedAddonIds((prev) =>
                                isChecked
                                  ? prev.filter((id) => id !== addon.id)
                                  : [...prev, addon.id]
                              );
                            }}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                              isChecked
                                ? "bg-stone-900 text-white border-stone-900 shadow-2xs"
                                : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                            }`}
                          >
                            <span>{addon.name}</span>
                            <span className={isChecked ? "text-stone-300" : "text-stone-400"}>
                              (+{currency} {addon.price.toFixed(0)})
                            </span>
                            {isChecked && <Check className="h-3 w-3 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Fulfillment Method */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                  3. Fulfillment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickFulfillment("takeaway");
                      setQuickSlot("Immediate Takeaway");
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      quickFulfillment === "takeaway"
                        ? "bg-stone-900 text-white border-stone-900 shadow-2xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Instant Takeaway</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuickFulfillment("pickup");
                      if (quickSlot === "Immediate Takeaway") setQuickSlot("Standard Slot");
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      quickFulfillment === "pickup"
                        ? "bg-stone-900 text-white border-stone-900 shadow-2xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <Store className="h-4 w-4" />
                    <span>Self-Pickup Later</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuickFulfillment("delivery");
                      if (quickSlot === "Immediate Takeaway") setQuickSlot("Standard Slot");
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      quickFulfillment === "delivery"
                        ? "bg-stone-900 text-white border-stone-900 shadow-2xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <Truck className="h-4 w-4" />
                    <span>Delivery (Courier)</span>
                  </button>
                </div>

                {/* Delivery Zone & Address Fields if Delivery */}
                {quickFulfillment === "delivery" && (
                  <div className="mt-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        Delivery Zone &amp; Fee
                      </span>
                      <span className="text-[11px] font-bold text-stone-900">
                        Fee: {currency} {quickDeliveryFee.toFixed(2)}
                      </span>
                    </div>

                    <select
                      value={quickDeliveryZoneId}
                      onChange={(e) => setQuickDeliveryZoneId(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 font-medium focus:outline-none focus:ring-1 focus:ring-stone-900"
                    >
                      {store.deliveryFeeConfig?.zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name} (+{currency} {zone.fee.toFixed(2)})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Delivery full street address / unit number..."
                      value={quickDeliveryAddress}
                      onChange={(e) => setQuickDeliveryAddress(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                )}
              </div>

              {/* Schedule Date & Slot */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={quickDate || todayStr}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && val < todayStr) {
                        setQuickDate(todayStr);
                        showToast("Cannot select a date in the past.");
                      } else {
                        setQuickDate(val);
                      }
                    }}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Time Slot
                  </label>
                  <select
                    value={quickSlot}
                    onChange={(e) => setQuickSlot(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    {quickFulfillment === "takeaway" && (
                      <option value="Immediate Takeaway">Immediate Takeaway</option>
                    )}
                    <option value="Standard Slot">Standard Slot</option>
                    {availableSlots.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer / Recipient Details */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  4. Customer / Recipient
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={
                      quickOrderChannel === "walk_in"
                        ? "Customer Name (Optional for Walk-In)"
                        : "Recipient Name *"
                    }
                    value={quickCustomerName}
                    onChange={(e) => setQuickCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (e.g. +60123456789)"
                    value={quickCustomerPhone}
                    onChange={(e) => setQuickCustomerPhone(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                {/* Card Message (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-stone-400">
                      Greeting Card Message (Optional):
                    </span>
                    <div className="flex items-center gap-1">
                      {["Happy Birthday!", "Happy Anniversary!", "Congrats!"].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setQuickCardMessage(preset)}
                          className="text-[9px] px-1.5 py-0.2 rounded-md bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Short message printed on florist card..."
                    value={quickCardMessage}
                    onChange={(e) => setQuickCardMessage(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              {/* Payment Method & Register Reconciliation */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                  5. Payment Method &amp; Inflow
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuickPaymentMode("cash")}
                    className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      quickPaymentMode === "cash"
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <Banknote className="h-4 w-4" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickPaymentMode("duitnow_qr")}
                    className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      quickPaymentMode === "duitnow_qr"
                        ? "bg-pink-700 text-white border-pink-700 shadow-2xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <QrCode className="h-4 w-4" />
                    <span>DuitNow</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickPaymentMode("static_qr")}
                    className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      quickPaymentMode === "static_qr"
                        ? "bg-sky-700 text-white border-sky-700 shadow-2xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>TNG QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickPaymentMode("bank_transfer")}
                    className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      quickPaymentMode === "bank_transfer"
                        ? "bg-blue-700 text-white border-blue-700 shadow-2xs"
                        : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Bank</span>
                  </button>
                </div>
              </div>

              {/* Order Total Review Strip */}
              <div className="rounded-2xl bg-stone-100 p-3.5 border border-stone-200/80 space-y-1">
                <div className="flex items-center justify-between text-stone-600 text-[11px]">
                  <span>Item ({quickProductObj.name}):</span>
                  <span>{currency} {quickProductObj.price.toFixed(2)}</span>
                </div>
                {quickAddonsTotal > 0 && (
                  <div className="flex items-center justify-between text-stone-600 text-[11px]">
                    <span>Add-ons:</span>
                    <span>+{currency} {quickAddonsTotal.toFixed(2)}</span>
                  </div>
                )}
                {quickDeliveryFee > 0 && (
                  <div className="flex items-center justify-between text-stone-600 text-[11px]">
                    <span>Courier Delivery Fee:</span>
                    <span>+{currency} {quickDeliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-1.5 border-t border-stone-200 flex items-center justify-between font-black text-sm text-stone-900">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700 text-base">
                    {currency} {quickOrderTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsQuickOrderOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingQuickOrder || quickOrderTotal <= 0}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingQuickOrder ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Recording Order...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Record &amp; Add to Today&apos;s Sales</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Bottom Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-full shadow-xl text-xs font-semibold flex items-center gap-2 animate-fade-in border border-white/10">
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
