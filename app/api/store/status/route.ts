import { NextRequest, NextResponse } from "next/server";
import { getStoreBySlug } from "@/config/stores";
import {
  getStoreEmergencyStatus,
  updateStoreEmergencyStatus,
} from "@/lib/storeStatus";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Missing store slug." },
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

    const status = await getStoreEmergencyStatus(slug);
    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("Error in GET /api/store/status:", err);
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
      pin,
      isTodayPaused,
      isTomorrowBlocked,
      emergencyNotice,
      holidayPricingDisplay,
      outOfStockProductIds,
    } = body;

    if (!storeSlug || !pin) {
      return NextResponse.json(
        { success: false, error: "Missing storeSlug or staff PIN." },
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

    if (!correctPin || pin.trim() !== correctPin.trim()) {
      return NextResponse.json(
        { success: false, error: "Incorrect 4-digit PIN." },
        { status: 401 }
      );
    }

    const updated = await updateStoreEmergencyStatus(store.slug, {
      ...(typeof isTodayPaused === "boolean" && { isTodayPaused }),
      ...(typeof isTomorrowBlocked === "boolean" && { isTomorrowBlocked }),
      ...(typeof emergencyNotice === "string" && { emergencyNotice }),
      ...((holidayPricingDisplay === "separate_surcharge" || holidayPricingDisplay === "inclusive") && {
        holidayPricingDisplay,
      }),
      ...(Array.isArray(outOfStockProductIds) && { outOfStockProductIds }),
    });

    return NextResponse.json({ success: true, status: updated });
  } catch (err) {
    console.error("Error in POST /api/store/status:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
