import { NextRequest, NextResponse } from "next/server";
import { getOrdersByStore } from "@/lib/orders";
import { getStoreBySlug } from "@/config/stores";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug")?.trim();
    const date = searchParams.get("date")?.trim();

    if (!slug || !date) {
      return NextResponse.json(
        { success: false, error: "Missing required query parameters (slug, date)." },
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

    const allOrders = await getOrdersByStore(slug);
    const dateOrders = allOrders.filter(
      (o) => o.deliveryDate === date && o.fulfillmentStatus !== "cancelled"
    );

    return NextResponse.json({
      success: true,
      storeSlug: slug,
      date,
      ordersCount: dateOrders.length,
    });
  } catch (error) {
    console.error("Error in GET /api/store/capacity:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch date capacity." },
      { status: 500 }
    );
  }
}
