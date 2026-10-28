export type FulfillmentStatus =
  | "new"
  | "preparing"
  | "ready"
  | "dispatched"
  | "completed"
  | "cancelled";

export interface OrderAddonItem {
  id: string;
  name: string;
  nameZh?: string;
  price: number;
}

export interface Order {
  id: string;
  storeSlug: string;
  createdAt: string; // ISO string
  product: {
    id: string;
    name: string;
    nameZh?: string;
    price: number;
    image: string;
    quantity?: number;
  };
  addons: OrderAddonItem[];
  fulfillmentMethod: "delivery" | "pickup";
  deliveryZoneName?: string;
  deliveryFee: number;
  deliveryDate: string; // YYYY-MM-DD
  deliveryTimeSlot: string; // e.g. "10:00 AM – 11:00 AM"
  recipient: {
    name: string;
    phone: string;
    deliveryAddress?: string;
  };
  cardMessage?: string;
  notes?: string;
  totalAmount: number;
  paymentMode: "static_qr" | "gateway" | "cash" | "duitnow_qr" | "bank_transfer";
  paymentStatus:
    | "paid_tng"
    | "paid_cash"
    | "paid_duitnow"
    | "paid_transfer"
    | "pending_verification";
  fulfillmentStatus: FulfillmentStatus;
  orderSource?: "web" | "walk_in" | "phone";
  holidaySurcharge?: number;
  holidayName?: string;
}

// ---------------------------------------------------------------------------
// Supabase REST Integration (Zero-dependency via native fetch)
// ---------------------------------------------------------------------------

function getSupabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/^["']|["']$/g, "");
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim().replace(/^["']|["']$/g, "");

  if (
    url &&
    key &&
    !url.includes("your-project-id") &&
    !key.includes("your-") &&
    url.startsWith("http")
  ) {
    return { url: url.replace(/\/+$/, ""), key };
  }
  return null;
}

/**
 * Columns in the Supabase 'orders' PostgreSQL table.
 */
interface SupabaseOrderRow {
  id: string;
  store_slug: string;
  created_at: string;
  product_id: string;
  product_name: string;
  product_price: number;
  product_image?: string;
  addons: OrderAddonItem[];
  fulfillment_method: "delivery" | "pickup";
  delivery_zone_name?: string;
  delivery_fee: number;
  delivery_date: string;
  delivery_time_slot: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address?: string;
  card_message?: string;
  notes?: string;
  total_amount: number;
  payment_mode: string;
  payment_status: string;
  fulfillment_status: FulfillmentStatus;
}

interface OrderMetadata {
  orderSource?: "web" | "walk_in" | "phone";
  holidaySurcharge?: number;
  holidayName?: string;
  quantity?: number;
}

const META_TAG_REGEX = /<!--order-meta:([\s\S]*?)-->/;

function encodeNotesWithMetadata(notes?: string, meta?: OrderMetadata): string {
  let cleanNotes = (notes || "").replace(META_TAG_REGEX, "").trim();
  const validMeta: Record<string, unknown> = {};

  if (meta?.orderSource && meta.orderSource !== "web") {
    validMeta.orderSource = meta.orderSource;
  }
  if (meta?.holidaySurcharge && meta.holidaySurcharge > 0) {
    validMeta.holidaySurcharge = meta.holidaySurcharge;
  }
  if (meta?.holidayName) {
    validMeta.holidayName = meta.holidayName;
  }
  if (meta?.quantity && meta.quantity > 1) {
    validMeta.quantity = meta.quantity;
  }

  if (Object.keys(validMeta).length > 0) {
    const metaString = `<!--order-meta:${JSON.stringify(validMeta)}-->`;
    return cleanNotes ? `${cleanNotes} ${metaString}` : metaString;
  }

  return cleanNotes;
}

function decodeNotesAndMetadata(rawNotes?: string): {
  cleanNotes: string;
  meta: OrderMetadata;
} {
  if (!rawNotes) {
    return { cleanNotes: "", meta: {} };
  }

  const match = rawNotes.match(META_TAG_REGEX);
  if (!match) {
    return { cleanNotes: rawNotes, meta: {} };
  }

  let meta: OrderMetadata = {};
  try {
    meta = JSON.parse(match[1]);
  } catch {
    // ignore parse error if malformed
  }

  const cleanNotes = rawNotes.replace(META_TAG_REGEX, "").trim();
  return { cleanNotes, meta };
}

function mapRowToOrder(row: SupabaseOrderRow): Order {
  const { cleanNotes, meta } = decodeNotesAndMetadata(row.notes);

  return {
    id: row.id,
    storeSlug: row.store_slug,
    createdAt: row.created_at,
    product: {
      id: row.product_id,
      name: row.product_name,
      price: Number(row.product_price),
      image: row.product_image || "",
      quantity: meta.quantity || 1,
    },
    addons: row.addons || [],
    fulfillmentMethod: row.fulfillment_method,
    deliveryZoneName: row.delivery_zone_name,
    deliveryFee: Number(row.delivery_fee) || 0,
    deliveryDate: row.delivery_date,
    deliveryTimeSlot: row.delivery_time_slot,
    recipient: {
      name: row.recipient_name,
      phone: row.recipient_phone,
      deliveryAddress: row.delivery_address,
    },
    cardMessage: row.card_message,
    notes: cleanNotes,
    totalAmount: Number(row.total_amount),
    paymentMode: (row.payment_mode || "static_qr") as any,
    paymentStatus: (row.payment_status || "paid_tng") as any,
    fulfillmentStatus: row.fulfillment_status,
    orderSource: (row as any).order_source || meta.orderSource || "web",
    holidaySurcharge: (row as any).holiday_surcharge !== undefined
      ? Number((row as any).holiday_surcharge)
      : meta.holidaySurcharge,
    holidayName: (row as any).holiday_name || meta.holidayName,
  };
}

function mapOrderToRow(order: Order): SupabaseOrderRow {
  const encodedNotes = encodeNotesWithMetadata(order.notes, {
    orderSource: order.orderSource,
    holidaySurcharge: order.holidaySurcharge,
    holidayName: order.holidayName,
    quantity: order.product?.quantity,
  });

  return {
    id: order.id,
    store_slug: order.storeSlug,
    created_at: order.createdAt,
    product_id: order.product.id,
    product_name: order.product.name,
    product_price: order.product.price,
    product_image: order.product.image || "",
    addons: order.addons || [],
    fulfillment_method: order.fulfillmentMethod,
    delivery_zone_name: order.deliveryZoneName || undefined,
    delivery_fee: order.deliveryFee || 0,
    delivery_date: order.deliveryDate,
    delivery_time_slot: order.deliveryTimeSlot,
    recipient_name: order.recipient?.name || "-",
    recipient_phone: order.recipient?.phone || "-",
    delivery_address: order.recipient?.deliveryAddress || undefined,
    card_message: order.cardMessage || undefined,
    notes: encodedNotes || undefined,
    total_amount: order.totalAmount,
    payment_mode: order.paymentMode || "static_qr",
    payment_status: order.paymentStatus || "paid_tng",
    fulfillment_status: order.fulfillmentStatus || "new",
  };
}

/**
 * Returns all orders for a specific tenant store slug from Supabase.
 */
export async function getOrdersByStore(storeSlug: string): Promise<Order[]> {
  const sb = getSupabaseConfig();
  if (!sb) {
    console.warn("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    return [];
  }

  try {
    const res = await fetch(
      `${sb.url}/rest/v1/orders?store_slug=eq.${encodeURIComponent(
        storeSlug
      )}&order=created_at.desc`,
      {
        headers: {
          apikey: sb.key,
          Authorization: `Bearer ${sb.key}`,
        },
        cache: "no-store",
      }
    );

    if (res.ok) {
      const rows: SupabaseOrderRow[] = await res.json();
      return rows.map(mapRowToOrder);
    }

    const errText = await res.text();
    console.error(`Supabase fetch failed with status ${res.status}:`, errText);
    return [];
  } catch (err) {
    console.error("Supabase getOrdersByStore network error:", err);
    return [];
  }
}

/**
 * Creates and records a new order directly in Supabase.
 */
export async function recordNewOrder(
  data: Omit<Order, "id" | "createdAt" | "fulfillmentStatus"> & {
    fulfillmentStatus?: FulfillmentStatus;
  }
): Promise<Order> {
  const newOrder: Order = {
    ...data,
    id: `ord_${data.storeSlug}_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    fulfillmentStatus: data.fulfillmentStatus || "new",
  };

  const sb = getSupabaseConfig();
  if (!sb) {
    throw new Error(
      "Database not configured: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  const row = mapOrderToRow(newOrder);
  const res = await fetch(`${sb.url}/rest/v1/orders`, {
    method: "POST",
    headers: {
      apikey: sb.key,
      Authorization: `Bearer ${sb.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Supabase insert failed with status ${res.status}:`, errText);
    throw new Error(`Failed to record order in Supabase: ${res.status} ${errText}`);
  }

  const inserted: SupabaseOrderRow[] = await res.json();
  if (inserted && inserted[0]) {
    return mapRowToOrder(inserted[0]);
  }

  return newOrder;
}

export interface OrderUpdatePayload {
  fulfillmentStatus?: FulfillmentStatus;
  deliveryTimeSlot?: string;
  deliveryDate?: string;
  notes?: string;
}

/**
 * Updates an order's fulfillment status, rescheduled delivery time slot, date, or notes in Supabase.
 */
export async function updateOrderDetails(
  orderId: string,
  updates: OrderUpdatePayload
): Promise<Order | null> {
  const sb = getSupabaseConfig();
  if (!sb) {
    throw new Error("Supabase is not configured.");
  }

  try {
    const supabaseUpdates: Record<string, unknown> = {};
    if (updates.fulfillmentStatus) supabaseUpdates.fulfillment_status = updates.fulfillmentStatus;
    if (updates.deliveryTimeSlot) supabaseUpdates.delivery_time_slot = updates.deliveryTimeSlot;
    if (updates.deliveryDate) supabaseUpdates.delivery_date = updates.deliveryDate;
    if (updates.notes !== undefined) supabaseUpdates.notes = updates.notes;

    const res = await fetch(
      `${sb.url}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,
      {
        method: "PATCH",
        headers: {
          apikey: sb.key,
          Authorization: `Bearer ${sb.key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(supabaseUpdates),
      }
    );

    if (res.ok) {
      const updatedRows: SupabaseOrderRow[] = await res.json();
      if (updatedRows && updatedRows[0]) {
        return mapRowToOrder(updatedRows[0]);
      }
    } else {
      const errText = await res.text();
      console.error(`Supabase updateOrderDetails failed (${res.status}):`, errText);
    }
  } catch (err) {
    console.error("Supabase updateOrderDetails error:", err);
  }

  return null;
}

/**
 * Updates an order's fulfillment status (e.g. "preparing", "dispatched", "completed").
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: FulfillmentStatus
): Promise<Order | null> {
  return updateOrderDetails(orderId, { fulfillmentStatus: newStatus });
}

/**
 * Returns the count of confirmed/active orders for a given store, date, and delivery time slot.
 * Used to enforce slot capacity limits and prevent overbooking under high concurrency.
 */
export async function getSlotOrderCount(
  storeSlug: string,
  deliveryDate: string,
  deliveryTimeSlot: string
): Promise<number> {
  const sb = getSupabaseConfig();
  if (!sb) return 0;

  try {
    const res = await fetch(
      `${sb.url}/rest/v1/orders?store_slug=eq.${encodeURIComponent(
        storeSlug
      )}&delivery_date=eq.${encodeURIComponent(
        deliveryDate
      )}&delivery_time_slot=eq.${encodeURIComponent(
        deliveryTimeSlot
      )}&fulfillment_status=neq.cancelled&select=id`,
      {
        headers: {
          apikey: sb.key,
          Authorization: `Bearer ${sb.key}`,
          Prefer: "count=exact",
        },
        cache: "no-store",
      }
    );

    if (res.ok) {
      const contentRange = res.headers.get("content-range");
      if (contentRange) {
        const total = contentRange.split("/")[1];
        if (total && !isNaN(Number(total))) {
          return Number(total);
        }
      }
      const data = await res.json();
      return Array.isArray(data) ? data.length : 0;
    }
  } catch (err) {
    console.error("Error fetching slot order count from Supabase:", err);
  }
  return 0;
}

/**
 * Wipes all orders from Supabase.
 */
export async function clearAllOrders(): Promise<{
  supabaseCleared: boolean;
  localCleared: boolean;
}> {
  let supabaseCleared = false;

  const sb = getSupabaseConfig();
  if (sb) {
    try {
      const res = await fetch(
        `${sb.url}/rest/v1/orders?id=neq.empty_placeholder_string`,
        {
          method: "DELETE",
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
          },
        }
      );
      supabaseCleared = res.ok;
    } catch (err) {
      console.error("Error clearing Supabase orders:", err);
    }
  }

  return { supabaseCleared, localCleared: true };
}
