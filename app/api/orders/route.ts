import { NextRequest, NextResponse } from "next/server";
import { getStoreBySlug } from "@/config/stores";
import {
  getOrdersByStore,
  recordNewOrder,
  updateOrderStatus,
  updateOrderDetails,
  FulfillmentStatus,
} from "@/lib/orders";

interface RateLimitEntry {
  failedAttempts: number;
  lockedUntil: number; // ms timestamp
}

// Memory-based rate limiter (persists across requests in node process)
const pinAttemptMap = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug") || searchParams.get("storeSlug");
    const pin = searchParams.get("pin");

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Store slug is required." },
        { status: 400 }
      );
    }

    const store = getStoreBySlug(slug);
    if (!store) {
      return NextResponse.json(
        { success: false, error: "Store not found." },
        { status: 404 }
      );
    }

    const envPinKey = `STORE_PIN_${store.slug.toUpperCase()}`;
    const correctPin = process.env[envPinKey] || store.adminPin;

    if (!correctPin) {
      return NextResponse.json(
        { success: false, error: "Store staff PIN is not configured on server." },
        { status: 500 }
      );
    }

    // Rate limiting & Brute-force protection
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const rateLimitKey = `${ip}_${store.slug}`;
    const attemptInfo = pinAttemptMap.get(rateLimitKey);
    const now = Date.now();

    if (attemptInfo && attemptInfo.lockedUntil > now) {
      const remainingSeconds = Math.ceil((attemptInfo.lockedUntil - now) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `Terminal locked due to failed PIN attempts. Try again in ${remainingSeconds}s.`,
          isLocked: true,
          remainingSeconds,
        },
        { status: 429 }
      );
    }

    if (!pin) {
      return NextResponse.json(
        { success: false, error: "PIN is required." },
        { status: 401 }
      );
    }

    if (pin.trim() !== correctPin.trim()) {
      // Artificial delay to prevent automated high-speed brute-force attacks
      await new Promise((resolve) => setTimeout(resolve, 600));

      const currentAttempts = (attemptInfo?.failedAttempts || 0) + 1;
      if (currentAttempts >= MAX_ATTEMPTS) {
        pinAttemptMap.set(rateLimitKey, {
          failedAttempts: currentAttempts,
          lockedUntil: now + LOCKOUT_DURATION_MS,
        });
        return NextResponse.json(
          {
            success: false,
            error: "Too many failed attempts. Terminal locked for 5 minutes.",
            isLocked: true,
            remainingSeconds: 300,
          },
          { status: 429 }
        );
      } else {
        pinAttemptMap.set(rateLimitKey, {
          failedAttempts: currentAttempts,
          lockedUntil: 0,
        });
        const remaining = MAX_ATTEMPTS - currentAttempts;
        return NextResponse.json(
          {
            success: false,
            error: `Incorrect 4-digit PIN. (${remaining} ${remaining === 1 ? "attempt" : "attempts"} remaining)`,
            remainingAttempts: remaining,
          },
          { status: 401 }
        );
      }
    }

    // PIN is correct! Clear failed attempts
    pinAttemptMap.delete(rateLimitKey);

    const orders = await getOrdersByStore(slug);

    return NextResponse.json({
      success: true,
      store: {
        name: store.name,
        slug: store.slug,
        logo: store.logo,
        primaryColor: store.primaryColor || "#BE185D",
        currency: store.currency || "RM",
        whatsapp: store.whatsapp,
        pickupAddress: store.pickupAddress,
      },
      orders,
    });
  } catch (error) {
    console.error("Error in GET /api/orders:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      storeSlug,
      product,
      addons = [],
      fulfillmentMethod = "delivery",
      deliveryZoneName,
      deliveryFee = 0,
      deliveryDate,
      deliveryTimeSlot,
      recipient,
      cardMessage,
      notes,
      totalAmount,
      paymentMode = "static_qr",
      paymentStatus = "paid_tng",
      orderSource = "web",
      fulfillmentStatus = "new",
      holidaySurcharge,
      holidayName,
    } = body;

    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kuala_Lumpur",
    }).format(new Date());
    const effectiveDate = deliveryDate || todayStr;

    if (effectiveDate < todayStr) {
      return NextResponse.json(
        { success: false, error: "Delivery or pickup date cannot be in the past." },
        { status: 400 }
      );
    }
    const effectiveSlot = deliveryTimeSlot || (orderSource === "walk_in" ? "Immediate Takeaway" : "Standard Slot");
    const effectiveRecipient = recipient || {
      name: orderSource === "walk_in" ? "Walk-In Customer" : "Phone Customer",
      phone: "-",
    };

    if (!storeSlug || !product) {
      return NextResponse.json(
        { success: false, error: "Missing required order fields (storeSlug, product)." },
        { status: 400 }
      );
    }

    const store = getStoreBySlug(storeSlug);
    if (!store) {
      return NextResponse.json(
        { success: false, error: "Store not found." },
        { status: 404 }
      );
    }

    const newOrder = await recordNewOrder({
      storeSlug: store.slug,
      product,
      addons,
      fulfillmentMethod,
      deliveryZoneName,
      deliveryFee: Number(deliveryFee) || 0,
      deliveryDate: effectiveDate,
      deliveryTimeSlot: effectiveSlot,
      recipient: effectiveRecipient,
      cardMessage: cardMessage || "",
      notes: notes || "",
      totalAmount: Number(totalAmount) || Number(product.price),
      paymentMode,
      paymentStatus,
      orderSource,
      fulfillmentStatus,
      holidaySurcharge: holidaySurcharge ? Number(holidaySurcharge) : undefined,
      holidayName,
    });

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/orders:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      storeSlug,
      pin,
      orderId,
      fulfillmentStatus,
      deliveryTimeSlot,
      deliveryDate,
      notes,
    } = body;

    if (
      !storeSlug ||
      !orderId ||
      (!fulfillmentStatus && !deliveryTimeSlot && !deliveryDate && notes === undefined)
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    const store = getStoreBySlug(storeSlug);
    if (!store) {
      return NextResponse.json(
        { success: false, error: "Store not found." },
        { status: 404 }
      );
    }

    const envPinKey = `STORE_PIN_${store.slug.toUpperCase()}`;
    const correctPin = process.env[envPinKey] || store.adminPin;

    if (!correctPin || !pin || pin.trim() !== correctPin.trim()) {
      return NextResponse.json(
        { success: false, error: "Incorrect 4-digit PIN." },
        { status: 401 }
      );
    }

    if (deliveryDate) {
      const todayStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kuala_Lumpur",
      }).format(new Date());
      if (deliveryDate < todayStr) {
        return NextResponse.json(
          { success: false, error: "Rescheduled date cannot be in the past." },
          { status: 400 }
        );
      }
    }

    const updated = await updateOrderDetails(orderId, {
      fulfillmentStatus,
      deliveryTimeSlot,
      deliveryDate,
      notes,
    });
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error("Error in PATCH /api/orders:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
