"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  StoreConfig,
  checkIfSlotIsRush,
  isSlotPassed,
  getSlotTimeStatus,
} from "@/config/stores";
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
  Info,
  Bell,
  MoreHorizontal,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { StoreEmergencyStatus } from "@/lib/storeStatus";
import { SlidingPillTabs, SlidingPillItem } from "@/components/SlidingPillTabs";
import { FloristOrderCard } from "@/components/FloristOrderCard";
import toast from "react-hot-toast";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";

interface FloristOrderBookClientProps {
  store: StoreConfig;
}

export function FloristOrderBookClient({ store }: FloristOrderBookClientProps) {
  const primaryColor = store.primaryColor || "#BE185D";
  const currency = store.currency || "RM";

  // Dates calculation helper (Asia/Kuala_Lumpur)
  const getRelativeDateStr = (daysAhead: number = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kuala_Lumpur",
    }).format(d);
  };

  const todayStr = getRelativeDateStr(0);
  const tomorrowStr = getRelativeDateStr(1);

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [showFinancialSummary, setShowFinancialSummary] = useState(false);
  const [orderViewMode, setOrderViewMode] = useState<"compact" | "detailed">("detailed");

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
  const [activeInfoTooltip, setActiveInfoTooltip] = useState<string | null>(null);

  // Top Screen Redesign State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [isCapacitySheetOpen, setIsCapacitySheetOpen] = useState(false);
  const [dailyLimit, setDailyLimit] = useState<number>(() => store.holidayPeakConfig?.rules?.[0]?.maxDailyOrders || 40);
  const [limitPulse, setLimitPulse] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Anti-Spam Debounce, AbortController & Zero-Op refs for Emergency Switches
  const committedStatusRef = useRef<StoreEmergencyStatus | null>(null);
  const pendingEmergencyUpdatesRef = useRef<Partial<{
    isTodayPaused: boolean;
    isTomorrowBlocked: boolean;
    emergencyNotice: string;
    holidayPricingDisplay: "separate_surcharge" | "inclusive";
  }>>({});
  const emergencyDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const emergencyAbortRef = useRef<AbortController | null>(null);
  const stockAbortRef = useRef<AbortController | null>(null);

  // Clean up debounce timer and any in-flight requests on unmount
  useEffect(() => {
    return () => {
      if (emergencyDebounceTimerRef.current) {
        clearTimeout(emergencyDebounceTimerRef.current);
      }
      if (emergencyAbortRef.current) {
        emergencyAbortRef.current.abort();
      }
      if (stockAbortRef.current) {
        stockAbortRef.current.abort();
      }
    };
  }, []);

  // Dismiss dropdown menu, capacity sheet, and pause confirm on outside click & Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        setIsCapacitySheetOpen(false);
        setShowPauseConfirm(false);
      }
    };
    if (isMenuOpen || isCapacitySheetOpen || showPauseConfirm) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isMenuOpen, isCapacitySheetOpen, showPauseConfirm]);

  // Close info tooltip on outside click
  useEffect(() => {
    if (!activeInfoTooltip) return;
    const handleClickOutside = () => setActiveInfoTooltip(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [activeInfoTooltip]);

  // Channel Filter State (Web vs Walk-In vs Phone)
  const [channelFilter, setChannelFilter] = useState<"all" | "web" | "walk_in" | "phone">("all");

  // Reusable Sliding Pill Items for Source Filter
  const channelTabItems = useMemo(
    (): SlidingPillItem<"all" | "web" | "walk_in" | "phone">[] => [
      {
        id: "all",
        label: "All Channels",
        activeColor: "#1c1917",
      },
      {
        id: "web",
        label: "Web Orders",
        icon: <Globe className="h-3 w-3" />,
        activeColor: "#0369a1",
      },
      {
        id: "walk_in",
        label: "Walk-In",
        icon: <Store className="h-3 w-3" />,
        activeColor: "#7e22ce",
      },
      {
        id: "phone",
        label: "Phone Orders",
        icon: <Phone className="h-3 w-3" />,
        activeColor: "#b45309",
      },
    ],
    []
  );

  // Quick Order (Walk-In Counter & Phone Order) State
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [isQuickOrderClosing, setIsQuickOrderClosing] = useState(false);
  const [isRescheduleClosing, setIsRescheduleClosing] = useState(false);
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
    const isError =
      msg.toLowerCase().includes("fail") ||
      msg.toLowerCase().includes("error") ||
      msg.toLowerCase().includes("cannot") ||
      msg.toLowerCase().includes("revert") ||
      msg.toLowerCase().includes("invalid") ||
      msg.toLowerCase().includes("past");
    if (isError) {
      toast.error(msg);
    } else {
      toast.success(msg);
    }
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
        committedStatusRef.current = data.status;
        setEmergencyNoticeInput(data.status.emergencyNotice || "");
      }
    } catch (err) {
      console.warn("Failed to load store status:", err);
    }
  }, [store.slug]);

  // Handle emergency toggle & festive pricing strategy (Debounced + Optimistic UI + AbortController + Zero-Op)
  const handleToggleEmergency = useCallback(
    async (
      updates: Partial<{
        isTodayPaused: boolean;
        isTomorrowBlocked: boolean;
        emergencyNotice: string;
        holidayPricingDisplay: "separate_surcharge" | "inclusive";
      }>,
      options?: { immediate?: boolean }
    ) => {
      // 1. Optimistically update local state immediately so switches animate instantly (0ms lag)
      setStoreStatus((prev) => {
        if (!prev) {
          return {
            storeSlug: store.slug,
            isTodayPaused: updates.isTodayPaused ?? false,
            isTomorrowBlocked: updates.isTomorrowBlocked ?? false,
            emergencyNotice: updates.emergencyNotice ?? "",
            updatedAt: new Date().toISOString(),
            ...updates,
          } as StoreEmergencyStatus;
        }
        return {
          ...prev,
          ...updates,
        };
      });

      // 2. Accumulate updates into pending updates ref
      pendingEmergencyUpdatesRef.current = {
        ...pendingEmergencyUpdatesRef.current,
        ...updates,
      };

      // 3. Clear any existing debounce timer
      if (emergencyDebounceTimerRef.current) {
        clearTimeout(emergencyDebounceTimerRef.current);
        emergencyDebounceTimerRef.current = null;
      }

      const executeFlush = async () => {
        const payload = { ...pendingEmergencyUpdatesRef.current };
        pendingEmergencyUpdatesRef.current = {};

        if (Object.keys(payload).length === 0) return;

        // Zero-Op Detection: if user spammed ON -> OFF -> ON, check if final state matches server
        const committed = committedStatusRef.current;
        if (committed) {
          let hasRealChange = false;
          for (const [key, val] of Object.entries(payload)) {
            if (committed[key as keyof StoreEmergencyStatus] !== val) {
              hasRealChange = true;
              break;
            }
          }
          if (!hasRealChange) {
            // Ending state matches current server state: 0 network requests sent!
            return;
          }
        }

        // Abort previous in-flight request to eliminate race conditions
        if (emergencyAbortRef.current) {
          emergencyAbortRef.current.abort();
        }
        const controller = new AbortController();
        emergencyAbortRef.current = controller;

        setIsUpdatingStatus(true);
        try {
          const res = await fetch("/api/store/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              storeSlug: store.slug,
              pin,
              ...payload,
            }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            committedStatusRef.current = data.status;
            setStoreStatus(data.status);
            if (payload.emergencyNotice !== undefined) {
              setEmergencyNoticeInput(data.status.emergencyNotice || "");
            }
            showToast(
              payload.holidayPricingDisplay
                ? `Peak pricing strategy switched to: ${
                    payload.holidayPricingDisplay === "inclusive"
                      ? "Directly Charge in Product Price"
                      : "Separate Line Item Surcharge"
                  }`
                : payload.isTodayPaused !== undefined
                ? payload.isTodayPaused
                  ? "Same-day orders paused"
                  : "Same-day orders are open"
                : payload.isTomorrowBlocked !== undefined
                ? payload.isTomorrowBlocked
                  ? "Tomorrow orders blocked"
                  : "Tomorrow orders open"
                : "Settings updated"
            );
          } else {
            // Revert optimistically applied update to last confirmed server state
            if (committedStatusRef.current) {
              setStoreStatus(committedStatusRef.current);
            }
            showToast(data.error || "Failed to update status. Reverted.");
          }
        } catch (err: unknown) {
          // If aborted by a newer request, quietly exit without rollback
          if (err instanceof Error && err.name === "AbortError") {
            return;
          }
          if (committedStatusRef.current) {
            setStoreStatus(committedStatusRef.current);
          }
          showToast("Network error. Changes reverted.");
        } finally {
          if (emergencyAbortRef.current === controller) {
            emergencyAbortRef.current = null;
            setIsUpdatingStatus(false);
          }
        }
      };

      if (options?.immediate) {
        // Immediate execution for explicit "Save" button
        await executeFlush();
      } else {
        // 400ms trailing-edge debounce for rapid switch clicks
        emergencyDebounceTimerRef.current = setTimeout(() => {
          executeFlush();
        }, 400);
      }
    },
    [pin, store.slug, showToast]
  );

  // 1-Tap toggle individual product stock status (Optimistic UI + AbortController)
  const handleToggleProductStock = async (productId: string) => {
    const previousStatus = storeStatus;
    const currentOutOfStock = storeStatus?.outOfStockProductIds || [];
    const isCurrentlyOut = currentOutOfStock.includes(productId);
    const newOutOfStock = isCurrentlyOut
      ? currentOutOfStock.filter((id) => id !== productId)
      : [...currentOutOfStock, productId];

    const targetProduct = store.products.find((p) => p.id === productId);
    const productName = targetProduct ? targetProduct.name : "Product";

    // Optimistically update stock array immediately
    setStoreStatus((prev) => (prev ? { ...prev, outOfStockProductIds: newOutOfStock } : prev));
    setUpdatingStockProductId(productId);
    setIsUpdatingStatus(true);

    if (stockAbortRef.current) {
      stockAbortRef.current.abort();
    }
    const controller = new AbortController();
    stockAbortRef.current = controller;

    try {
      const res = await fetch("/api/store/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          storeSlug: store.slug,
          pin,
          outOfStockProductIds: newOutOfStock,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        committedStatusRef.current = data.status;
        setStoreStatus(data.status);
        showToast(
          isCurrentlyOut
            ? `"${productName}" is back IN STOCK`
            : `"${productName}" marked as SOLD OUT`
        );
      } else {
        setStoreStatus(previousStatus);
        showToast(data.error || "Failed to update stock status. Reverted.");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setStoreStatus(previousStatus);
      showToast("Network error updating stock status. Reverted.");
    } finally {
      if (stockAbortRef.current === controller) {
        stockAbortRef.current = null;
        setIsUpdatingStatus(false);
        setUpdatingStockProductId(null);
      }
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

  // Filtered slots for reschedule modal: hides past slots when Today is selected
  const availableSlotsForReschedule = useMemo((): string[] => {
    if (!rescheduleState) return availableSlots;
    const targetDate = rescheduleState.deliveryDate;
    if (targetDate !== todayStr) {
      // Tomorrow or future date: all configured slots are available
      return availableSlots;
    }
    // Today: filter out any slot whose cutoff / end time has already passed
    return availableSlots.filter(
      (slot) => !isSlotPassed(targetDate, slot, store.deliveryTimeConfig?.slots)
    );
  }, [
    rescheduleState?.deliveryDate,
    todayStr,
    availableSlots,
    store.deliveryTimeConfig?.slots,
  ]);

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
    // 1. Must be scheduled for today (future or past dates are never same-day rush)
    if (order.deliveryDate !== todayStr) {
      return false;
    }

    // 2. Must have had rush marked in notes
    const hasRushTag = Boolean(
      order.notes &&
        (order.notes.includes("Rush") || order.notes.includes("加急"))
    );
    if (!hasRushTag) {
      return false;
    }

    // 3. If the order was rescheduled, re-check against the rescheduled slot!
    if (order.notes && order.notes.includes("[Rescheduled:")) {
      return checkIfSlotIsRush(
        order.deliveryDate,
        order.deliveryTimeSlot,
        store.deliveryTimeConfig?.rushThresholdMinutes ?? 45,
        store.deliveryTimeConfig?.slots
      );
    }

    return true;
  };

  const openRescheduleModal = (order: Order) => {
    const targetDate = order.deliveryDate >= todayStr ? order.deliveryDate : todayStr;
    const isPast = isSlotPassed(targetDate, order.deliveryTimeSlot, store.deliveryTimeConfig?.slots);

    // If current slot has already passed for today, pre-select the first available upcoming slot
    let initialSlot = order.deliveryTimeSlot;
    if (isPast && targetDate === todayStr) {
      const validSlots = availableSlots.filter(
        (s) => !isSlotPassed(targetDate, s, store.deliveryTimeConfig?.slots)
      );
      initialSlot = validSlots[0] || "";
    }

    setIsRescheduleClosing(false);
    setRescheduleState({
      orderId: order.id,
      deliveryDate: targetDate,
      deliveryTimeSlot: initialSlot,
      customTimeSlot: "",
    });
  };

  const closeRescheduleModal = useCallback(() => {
    if (isRescheduleClosing || !rescheduleState) return;
    setIsRescheduleClosing(true);
    setTimeout(() => {
      setRescheduleState(null);
      setIsRescheduleClosing(false);
    }, 260);
  }, [isRescheduleClosing, rescheduleState]);

  const openQuickOrder = useCallback(() => {
    setIsQuickOrderClosing(false);
    setIsQuickOrderOpen(true);
  }, []);

  const handleCloseQuickOrder = useCallback(() => {
    if (isQuickOrderClosing || !isQuickOrderOpen) return;
    setIsQuickOrderClosing(true);
    setTimeout(() => {
      setIsQuickOrderOpen(false);
      setIsQuickOrderClosing(false);
    }, 260);
  }, [isQuickOrderClosing, isQuickOrderOpen]);

  // Dismiss any open pop-up modal on "Escape" key & lock background scroll while modal is active
  useEffect(() => {
    const isAnyModalOpen = Boolean(rescheduleState || isQuickOrderOpen || activeInfoTooltip);
    if (!isAnyModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (rescheduleState) {
          closeRescheduleModal();
        }
        if (isQuickOrderOpen) {
          handleCloseQuickOrder();
        }
        if (activeInfoTooltip) {
          setActiveInfoTooltip(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    if (rescheduleState || isQuickOrderOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [rescheduleState, isQuickOrderOpen, activeInfoTooltip, closeRescheduleModal, handleCloseQuickOrder]);

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

    const slotStatus = getSlotTimeStatus(
      rescheduleState.deliveryDate,
      targetSlot,
      store.deliveryTimeConfig?.rushThresholdMinutes ?? 45,
      store.deliveryTimeConfig?.slots
    );

    if (slotStatus === "past") {
      showToast("Cannot reschedule to a time slot that has already passed.");
      return;
    }

    setIsSavingSlot(true);
    try {
      const currentOrder = orders.find((o) => o.id === rescheduleState.orderId);
      const existingNotes = currentOrder?.notes || "";
      const isNewSlotRush = checkIfSlotIsRush(
        rescheduleState.deliveryDate,
        targetSlot,
        store.deliveryTimeConfig?.rushThresholdMinutes ?? 45,
        store.deliveryTimeConfig?.slots
      );

      // Clean existing notes from old Rush tag and old Rescheduled audit tags
      const cleanNotes = existingNotes
        .replace(
          /\[\s*(?:⚡\s*)?(?:Same-Day\s+Rush\s+Slot|Rush\s+Slot|加急(?:派送|订单)?)\s*\]/gi,
          ""
        )
        .replace(/\[Rescheduled:[^\]]+\]/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      const noteTags: string[] = [];
      if (isNewSlotRush) {
        noteTags.push("[⚡ Same-Day Rush Slot]");
      }
      noteTags.push(
        `[Rescheduled: ${rescheduleState.deliveryDate} ${targetSlot}]`
      );

      const updatedNotes = cleanNotes
        ? `${noteTags.join(" ")} ${cleanNotes}`
        : noteTags.join(" ");

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
        showToast(
          isNewSlotRush
            ? `Slot updated to ${rescheduleState.deliveryDate} (${targetSlot}) • ⚡ Rush Order`
            : `Slot updated to ${rescheduleState.deliveryDate} (${targetSlot})`
        );
        closeRescheduleModal();
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

  // Count of pending new unfulfilled orders
  const newOrdersCount = useMemo(() => {
    return orders.filter((o) => o.fulfillmentStatus === "new").length;
  }, [orders]);

  // Smoothly scroll down to the product orders list below
  const scrollToOrders = useCallback(() => {
    setTimeout(() => {
      const el = document.getElementById("orders-list-section");
      if (el) {
        const headerOffset = 64; // height of sticky header
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + (window.scrollY || window.pageYOffset || 0) - headerOffset;

        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: "smooth",
        });
      }
    }, 60);
  }, []);

  // 1-Tap Notification Bell: jump directly to incoming new orders
  const handleBellClick = useCallback(() => {
    const newOrders = orders.filter((o) => o.fulfillmentStatus === "new");
    if (newOrders.length === 0) {
      showToast("All orders are fulfilled or in progress (0 new orders).");
      scrollToOrders();
      return;
    }

    setSearchQuery("");
    setChannelFilter("all");

    const hasNewToday = newOrders.some((o) => o.deliveryDate === todayStr);
    const hasNewTomorrow = newOrders.some((o) => o.deliveryDate === tomorrowStr);

    if (hasNewToday) {
      setActiveTab("today");
    } else if (hasNewTomorrow) {
      setActiveTab("tomorrow");
    } else {
      setActiveTab("all");
    }

    scrollToOrders();
    showToast(
      `Jumped to ${newOrders.length} new pending ${
        newOrders.length === 1 ? "order" : "orders"
      }`
    );
  }, [orders, todayStr, tomorrowStr, scrollToOrders]);

  // Reusable Sliding Pill Items for Date View Tabs
  const dateTabItems = useMemo(
    (): SlidingPillItem<"today" | "tomorrow" | "upcoming" | "all">[] => [
      {
        id: "today",
        label: "Today",
        badge: (isActive) => (
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold transition-colors ${
              isActive
                ? "bg-[var(--brand,#be185d)] text-white"
                : "bg-stone-200 text-stone-600"
            }`}
          >
            {todayOrders.length}
          </span>
        ),
      },
      {
        id: "tomorrow",
        label: "Tomorrow",
        badge: (isActive) => (
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold transition-colors ${
              isActive
                ? "bg-[var(--brand,#be185d)] text-white"
                : "bg-stone-200 text-stone-600"
            }`}
          >
            {tomorrowOrders.length}
          </span>
        ),
      },
      {
        id: "upcoming",
        label: "Upcoming",
        badge: (isActive) => (
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold transition-colors ${
              isActive
                ? "bg-[var(--brand,#be185d)] text-white"
                : "bg-stone-200 text-stone-600"
            }`}
          >
            {upcomingOrders.length}
          </span>
        ),
      },
      {
        id: "all",
        label: "All",
        badge: (isActive) => (
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold transition-colors ${
              isActive
                ? "bg-[var(--brand,#be185d)] text-white"
                : "bg-stone-200 text-stone-600"
            }`}
          >
            {orders.length}
          </span>
        ),
      },
    ],
    [todayOrders.length, tomorrowOrders.length, upcomingOrders.length, orders.length]
  );

  const todayRevenue = useMemo(() => {
    return todayOrders
      .filter((o) => o.fulfillmentStatus !== "cancelled")
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [todayOrders]);

  // Count-up animation for todayRevenue (0.7s ease-out)
  const [animatedRevenue, setAnimatedRevenue] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      setAnimatedRevenue(todayRevenue);
      return;
    }
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setAnimatedRevenue(todayRevenue);
      return;
    }

    const startValue = 0;
    const targetValue = todayRevenue;
    const duration = 700; // 0.7s
    const startTime = performance.now();

    let animationFrameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedRevenue(Math.round(startValue + (targetValue - startValue) * easeOut));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [todayRevenue]);

  const todayDateFormatted = useMemo(() => {
    const now = new Date();
    const weekdayMonthDay = new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kuala_Lumpur",
    }).format(now);
    return `Today · ${weekdayMonthDay}`;
  }, []);

  const isTodayPaused = Boolean(storeStatus?.isTodayPaused);
  const isTomorrowBlocked = Boolean(storeStatus?.isTomorrowBlocked);

  const handleSameDaySwitchClick = () => {
    if (isTodayPaused) {
      handleToggleEmergency({ isTodayPaused: false });
    } else {
      setShowPauseConfirm(true);
    }
  };

  const confirmPauseSameDay = () => {
    setShowPauseConfirm(false);
    handleToggleEmergency({ isTodayPaused: true });
  };

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
        deliveryDate: effectiveDate,
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
        notes: (() => {
          const slot = isTakeaway ? "Immediate Takeaway" : quickSlot || "Standard Slot";
          const isRush =
            !isTakeaway &&
            checkIfSlotIsRush(
              effectiveDate,
              slot,
              store.deliveryTimeConfig?.rushThresholdMinutes ?? 45,
              store.deliveryTimeConfig?.slots
            );
          const rawNote = quickNotes.trim();
          if (isRush) {
            return rawNote ? `[⚡ Same-Day Rush Slot] ${rawNote}` : "[⚡ Same-Day Rush Slot]";
          }
          return rawNote || (isTakeaway ? "Immediate counter takeaway" : "");
        })(),
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
        handleCloseQuickOrder();
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
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 pb-16">
      {/* 1. HEADER (One row, 44px controls) */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e7e5e4] shadow-2xs">
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Left: 44px round logo + shop name + Staff order book */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="lg">
              <Image
                src={store.logo}
                alt={store.name}
                width={36}
                height={36}
                className="object-contain"
              />
            </div>
            <div className="hn">
              <b>{store.name}</b>
              <small>Staff order book</small>
            </div>
          </div>

          {/* Right: Bell with count badge & ⋯ dropdown menu */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Bell button */}
            <button
              type="button"
              onClick={handleBellClick}
              className="ib"
              aria-label="Notifications"
              title={
                newOrdersCount > 0
                  ? `${newOrdersCount} New pending ${newOrdersCount === 1 ? "order" : "orders"}. Tap to jump.`
                  : "No pending new orders"
              }
            >
              <Bell className="h-5 w-5" />
              <span className={`bg ${newOrdersCount > 0 ? "" : "gone"}`}>
                {newOrdersCount}
              </span>
            </button>

            {/* ⋯ More button with anchored dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((v) => !v)}
                className="ib"
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                aria-label="More options"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>

              {isMenuOpen && (
                <div className="mn" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false);
                      fetchOrders(pin);
                    }}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingOrders ? "animate-spin" : ""}`} />
                    <span>Refresh orders</span>
                  </button>

                  <Link
                    href={storefrontHref}
                    role="menuitem"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View shop</span>
                  </Link>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Lock className="h-4 w-4 text-red-600" />
                    <span>Lock app</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-28 space-y-4">
        {/* 2. AVAILABILITY BAR */}
        <section className={`av ${isTodayPaused ? "off" : ""}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="avl">
              <i />
              <div>
                <b className="text-sm font-bold block text-stone-900 leading-tight">
                  {isTodayPaused ? "Same-day orders paused" : "Taking same-day orders"}
                </b>
                <span className="text-xs text-stone-500 block">
                  {isTodayPaused
                    ? "Customers are asked to choose tomorrow"
                    : "Customers can book delivery today"}
                </span>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={!isTodayPaused}
              aria-label="Toggle same-day orders"
              onClick={handleSameDaySwitchClick}
              className={`sw ${!isTodayPaused ? "on" : ""}`}
            >
              <i />
            </button>
          </div>

          {/* Confirm row if turning off */}
          {showPauseConfirm && (
            <div className="cf">
              <span>Pause same-day orders?</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="cx"
                  onClick={() => setShowPauseConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="pz"
                  onClick={confirmPauseSameDay}
                >
                  Pause
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 3. CAPACITY AND NOTICE LINK */}
        <div>
          <button
            type="button"
            onClick={() => setIsCapacitySheetOpen(true)}
            className="text-[13px] font-bold text-[var(--brand,#be185d)] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Capacity and notice</span>
            <span>&rsaquo;</span>
          </button>
        </div>

        {/* CAPACITY AND NOTICE DRAWER (Draggable vaul bottom sheet) */}
        <Drawer
          open={isCapacitySheetOpen}
          onOpenChange={setIsCapacitySheetOpen}
          repositionInputs={false}
        >
          <DrawerContent className="max-w-lg mx-auto overflow-hidden bg-[#faf9f6] border-t border-stone-200 flex flex-col h-auto max-h-[90vh] max-h-[90svh]">
            {/* Header */}
            <DrawerHeader className="relative border-b border-stone-200/80 bg-white px-5 pt-3 pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <DrawerTitle className="text-base font-bold text-stone-900 tracking-tight">
                    Capacity &amp; Notice
                  </DrawerTitle>
                  <DrawerDescription className="text-xs text-stone-500 mt-0.5">
                    Manage real-time order intake and customer announcements
                  </DrawerDescription>
                </div>
                <DrawerClose asChild>
                  <button
                    type="button"
                    className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </DrawerClose>
              </div>
            </DrawerHeader>

            {/* Scrollable Body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4 text-xs">
              {/* Row 1: Same-day switch */}
              <div className="flex items-center justify-between gap-3 py-1.5 border-b border-stone-100 pb-3.5">
                <div>
                  <b className="text-sm font-semibold text-stone-900 block">Same-day orders</b>
                  <span className="text-xs text-stone-500">Allow customers to book delivery today</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!isTodayPaused}
                  onClick={() => {
                    const nextVal = !isTodayPaused;
                    handleToggleEmergency({ isTodayPaused: nextVal });
                  }}
                  className={`sw ${!isTodayPaused ? "on" : ""}`}
                >
                  <i />
                </button>
              </div>

              {/* Row 2: Tomorrow switch */}
              <div className="flex items-center justify-between gap-3 py-1.5 border-b border-stone-100 pb-3.5">
                <div>
                  <b className="text-sm font-semibold text-stone-900 block">Tomorrow orders</b>
                  <span className="text-xs text-stone-500">Block if you are closed</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!isTomorrowBlocked}
                  onClick={() => {
                    const nextVal = !isTomorrowBlocked;
                    handleToggleEmergency({ isTomorrowBlocked: nextVal });
                  }}
                  className={`sw ${!isTomorrowBlocked ? "on" : ""}`}
                >
                  <i />
                </button>
              </div>

              {/* Row 3: Daily order limit */}
              <div className="flex items-center justify-between gap-3 py-1.5 border-b border-stone-100 pb-3.5">
                <div>
                  <b className="text-sm font-semibold text-stone-900 block">Daily order limit</b>
                  <span className="text-xs text-stone-500">
                    {todayOrders.filter((o) => o.fulfillmentStatus !== "cancelled").length} of {dailyLimit} used today
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={dailyLimit <= todayOrders.filter((o) => o.fulfillmentStatus !== "cancelled").length}
                    onClick={() => {
                      const minVal = todayOrders.filter((o) => o.fulfillmentStatus !== "cancelled").length;
                      setDailyLimit((l) => Math.max(minVal, l - 1));
                      setLimitPulse((p) => p + 1);
                    }}
                    className="w-9 h-9 rounded-full border border-stone-200 bg-stone-100 text-stone-800 font-bold text-base flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-200 active:scale-95 transition-all cursor-pointer"
                  >
                    &minus;
                  </button>
                  <span
                    key={limitPulse}
                    className={`text-base font-black text-stone-900 w-8 text-center tabular-nums ${
                      limitPulse ? "pop-num" : ""
                    }`}
                  >
                    {dailyLimit}
                  </span>
                  <button
                    type="button"
                    disabled={dailyLimit >= 60}
                    onClick={() => {
                      setDailyLimit((l) => Math.min(60, l + 1));
                      setLimitPulse((p) => p + 1);
                    }}
                    className="w-9 h-9 rounded-full border border-stone-200 bg-stone-100 text-stone-800 font-bold text-base flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-200 active:scale-95 transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Row 4: Customer notice input */}
              <div className="pt-1">
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  Customer notice
                </label>
                <input
                  type="text"
                  placeholder="Notice for customers, e.g. Closed early on Sunday"
                  value={emergencyNoticeInput}
                  onChange={(e) => setEmergencyNoticeInput(e.target.value)}
                  className="w-full text-xs rounded-xl border border-stone-200/90 bg-white px-3.5 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 shadow-2xs transition-all"
                />
              </div>
            </div>

            {/* Bottom Fixed Area (like Image 3) */}
            <DrawerFooter>
              <button
                type="button"
                onClick={() => {
                  handleToggleEmergency(
                    { emergencyNotice: emergencyNoticeInput.trim() },
                    { immediate: true }
                  );
                  setIsCapacitySheetOpen(false);
                  showToast("Settings saved");
                }}
                className="w-full min-h-[46px] rounded-full bg-[var(--brand,#be185d)] hover:opacity-95 text-white font-bold text-sm shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center"
              >
                Save
              </button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* 4. TODAY CARD */}
        <section className="td">
          {/* Row 1: Date & Count Chip */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-stone-500 font-semibold">{todayDateFormatted}</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--brand,#be185d)_12%,transparent)] text-[var(--brand,#be185d)]">
              {todayOrders.filter((o) => o.fulfillmentStatus !== "cancelled").length} orders
            </span>
          </div>

          {/* Row 2: Revenue */}
          <div className="rev">
            {currency} {animatedRevenue.toLocaleString("en-MY", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>

          {/* Row 3: Stacked Bar & Legend */}
          <div>
            <div className="bar">
              {todayOrders.filter((o) => o.fulfillmentStatus !== "cancelled").length === 0 ? (
                <div className="w-full bg-stone-200 h-full rounded-full" />
              ) : (
                <>
                  {todayChannelStats.webCount > 0 && (
                    <div
                      style={{
                        width: `${(todayChannelStats.webCount / todayOrders.filter((o) => o.fulfillmentStatus !== "cancelled").length) * 100}%`,
                        backgroundColor: "var(--brand, #be185d)",
                      }}
                      className="h-full transition-all duration-300"
                    />
                  )}
                  {todayChannelStats.walkInCount > 0 && (
                    <div
                      style={{
                        width: `${(todayChannelStats.walkInCount / todayOrders.filter((o) => o.fulfillmentStatus !== "cancelled").length) * 100}%`,
                        backgroundColor: "#10b981",
                      }}
                      className="h-full transition-all duration-300"
                    />
                  )}
                  {todayChannelStats.phoneCount > 0 && (
                    <div
                      style={{
                        width: `${(todayChannelStats.phoneCount / todayOrders.filter((o) => o.fulfillmentStatus !== "cancelled").length) * 100}%`,
                        backgroundColor: "#3b82f6",
                      }}
                      className="h-full transition-all duration-300"
                    />
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between pt-2.5 text-xs text-stone-500 font-medium">
              <div>
                {[
                  todayChannelStats.webCount > 0 ? `${todayChannelStats.webCount} Web` : null,
                  todayChannelStats.walkInCount > 0 ? `${todayChannelStats.walkInCount} Walk-In` : null,
                  todayChannelStats.phoneCount > 0 ? `${todayChannelStats.phoneCount} Phone` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "0 orders"}
              </div>

              <button
                type="button"
                onClick={openQuickOrder}
                className="font-bold text-[var(--brand,#be185d)] hover:underline cursor-pointer"
              >
                + Record sale
              </button>
            </div>
          </div>
        </section>

        {/* View Tabs & Search Bar */}
        <div className="space-y-2.5">
          {/* Date View Tabs (Reusable SlidingPillTabs) */}
          <SlidingPillTabs
            variant="segmented"
            items={dateTabItems}
            activeId={activeTab}
            onChange={(id) => {
              setActiveTab(id);
              scrollToOrders();
            }}
            activeColor="#ffffff"
            activeTextColor="#1c1917"
            pillClassName="rounded-xl shadow-xs"
          />

          {/* Channel Source Filter Pills (Reusable SlidingPillTabs) */}
          <SlidingPillTabs
            items={channelTabItems}
            activeId={channelFilter}
            onChange={(id) => {
              setChannelFilter(id);
              scrollToOrders();
            }}
            prefix={
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0 mr-0.5">
                SOURCE:
              </span>
            }
            size="sm"
            inactiveClassName="bg-stone-100 text-stone-600 hover:bg-stone-200/80"
          />

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search recipient name, phone, address, or bouquet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-stone-200/90 bg-white pl-10 pr-4 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 shadow-2xs"
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
          <div className="space-y-3.5">
            {filteredOrders.map((order) => (
              <FloristOrderCard
                key={order.id}
                order={order}
                currency={currency}
                onStatusChange={handleStatusChange}
                onOpenReschedule={openRescheduleModal}
                onCopyLalamove={copyLalamoveInfo}
                cleanPhone={cleanPhone}
                showToast={showToast}
              />
            ))}
          </div>
        )}
      </main>
      {/* 5. FLOATING NEW ORDER BUTTON */}
      <button
        type="button"
        onClick={openQuickOrder}
        className="fab"
        aria-label="New order"
      >
        <span className="text-lg leading-none font-black">＋</span>
        <span>New order</span>
      </button>


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
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Reschedule Delivery Slot"
            onClick={closeRescheduleModal}
            className={`fixed inset-0 z-50 bk backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto cursor-pointer ${
              isRescheduleClosing ? "modal-backdrop-exit" : "modal-backdrop-enter"
            }`}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden cursor-default ${
                isRescheduleClosing ? "modal-content-exit" : "modal-content-enter"
              }`}
            >
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
                      onClick={() => {
                        const validTodaySlots = availableSlots.filter(
                          (s) =>
                            !isSlotPassed(
                              todayStr,
                              s,
                              store.deliveryTimeConfig?.slots
                            )
                        );
                        setRescheduleState((prev) =>
                          prev
                            ? {
                                ...prev,
                                deliveryDate: todayStr,
                                deliveryTimeSlot:
                                  prev.deliveryTimeSlot &&
                                  !isSlotPassed(
                                    todayStr,
                                    prev.deliveryTimeSlot,
                                    store.deliveryTimeConfig?.slots
                                  )
                                    ? prev.deliveryTimeSlot
                                    : validTodaySlots[0] || "",
                              }
                            : prev
                        );
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        rescheduleState.deliveryDate === todayStr
                          ? "bg-[var(--brand,#be185d)] text-white border-[var(--brand,#be185d)] shadow-2xs"
                          : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                      }`}
                    >
                      Today ({todayStr})
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRescheduleState((prev) =>
                          prev
                            ? {
                                ...prev,
                                deliveryDate: tomorrowStr,
                                deliveryTimeSlot:
                                  prev.deliveryTimeSlot ||
                                  availableSlots[0] ||
                                  "",
                              }
                            : prev
                        )
                      }
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        rescheduleState.deliveryDate === tomorrowStr
                          ? "bg-[var(--brand,#be185d)] text-white border-[var(--brand,#be185d)] shadow-2xs"
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
                        const isTargetToday = val === todayStr;
                        const validSlots = isTargetToday
                          ? availableSlots.filter(
                              (s) =>
                                !isSlotPassed(
                                  todayStr,
                                  s,
                                  store.deliveryTimeConfig?.slots
                                )
                            )
                          : availableSlots;

                        setRescheduleState((prev) =>
                          prev
                            ? {
                                ...prev,
                                deliveryDate: val,
                                deliveryTimeSlot:
                                  prev.deliveryTimeSlot &&
                                  (!isTargetToday ||
                                    !isSlotPassed(
                                      val,
                                      prev.deliveryTimeSlot,
                                      store.deliveryTimeConfig?.slots
                                    ))
                                    ? prev.deliveryTimeSlot
                                    : validSlots[0] || "",
                              }
                            : prev
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

                  {availableSlotsForReschedule.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-1 rounded-xl bg-stone-50 border border-stone-200/60">
                      {availableSlotsForReschedule.map((slot) => {
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
                            {isSelected && (
                              <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3.5 text-center space-y-2">
                      <p className="text-xs font-semibold text-stone-700">
                        All standard delivery slots for today have ended.
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setRescheduleState((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  deliveryDate: tomorrowStr,
                                  deliveryTimeSlot: availableSlots[0] || "",
                                }
                              : prev
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--brand,#be185d)] text-white text-xs font-semibold hover:opacity-95 transition-all cursor-pointer"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Switch to Tomorrow ({tomorrowStr})</span>
                      </button>
                    </div>
                  )}

                  {/* Or Custom Slot Input */}
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Or enter custom slot (e.g. 07:30 PM sharp, or Evening 7-8pm)"
                      value={rescheduleState.customTimeSlot}
                      onChange={(e) =>
                        setRescheduleState((prev) =>
                          prev ? { ...prev, customTimeSlot: e.target.value } : prev
                        )
                      }
                      className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  {/* Dynamic Rush / Past Status Impact Indicator */}
                  {(() => {
                    const slotStatus = getSlotTimeStatus(
                      rescheduleState.deliveryDate,
                      effectiveSlot,
                      store.deliveryTimeConfig?.rushThresholdMinutes ?? 45,
                      store.deliveryTimeConfig?.slots
                    );
                    return (
                      <div className="mt-2.5">
                        {slotStatus === "past" ? (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 text-xs">
                            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                            <div>
                              <span className="font-bold">⚠️ Time Slot Passed:</span>{" "}
                              <span className="text-rose-900">
                                This time has already ended today. Please select an upcoming slot.
                              </span>
                            </div>
                          </div>
                        ) : slotStatus === "rush" ? (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs">
                            <Zap className="h-4 w-4 text-amber-600 fill-amber-500 shrink-0" />
                            <div>
                              <span className="font-bold">⚡ Same-Day Rush Slot:</span>{" "}
                              <span className="text-amber-900">
                                Starts within {store.deliveryTimeConfig?.rushThresholdMinutes ?? 45} mins. Rush badge will remain active.
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs">
                            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                            <div>
                              <span className="font-bold">Standard Delivery Window:</span>{" "}
                              <span className="text-emerald-900">
                                {isRushOrder(targetOrder)
                                  ? "Lead time exceeds 45 mins. Saving will clear Rush Order status."
                                  : "Provides sufficient advance lead time for florist preparation."}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
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

                  {(() => {
                    const slotStatus = getSlotTimeStatus(
                      rescheduleState.deliveryDate,
                      effectiveSlot,
                      store.deliveryTimeConfig?.rushThresholdMinutes ?? 45,
                      store.deliveryTimeConfig?.slots
                    );
                    const isSaveDisabled =
                      isSavingSlot || slotStatus === "past" || !effectiveSlot;

                    return (
                      <button
                        type="button"
                        onClick={handleSaveReschedule}
                        disabled={isSaveDisabled}
                        className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-[var(--brand,#be185d)] hover:opacity-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                    );
                  })()}
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
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quick Record Order"
          onClick={handleCloseQuickOrder}
          className={`fixed inset-0 z-50 bk backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto cursor-pointer ${
            isQuickOrderClosing ? "modal-backdrop-exit" : "modal-backdrop-enter"
          }`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden cursor-default ${
              isQuickOrderClosing ? "modal-content-exit" : "modal-content-enter"
            }`}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/90">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-[color-mix(in_srgb,var(--brand,#be185d)_12%,white)] text-[var(--brand,#be185d)] border border-[color-mix(in_srgb,var(--brand,#be185d)_25%,transparent)]">
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
                onClick={handleCloseQuickOrder}
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
                                ? "bg-[var(--brand,#be185d)] text-white border-[var(--brand,#be185d)] shadow-2xs"
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
                        ? "bg-[var(--brand,#be185d)] text-white border-[var(--brand,#be185d)] shadow-2xs"
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
                        ? "bg-[var(--brand,#be185d)] text-white border-[var(--brand,#be185d)] shadow-2xs"
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
                        ? "bg-[var(--brand,#be185d)] text-white border-[var(--brand,#be185d)] shadow-2xs"
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
                  onClick={handleCloseQuickOrder}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingQuickOrder || quickOrderTotal <= 0}
                  className="px-5 py-2.5 rounded-xl bg-[var(--brand,#be185d)] hover:opacity-95 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
    </div>
  );
}
