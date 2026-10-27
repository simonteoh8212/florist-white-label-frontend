import fs from "fs";
import path from "path";

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

// Memory cache fallback for serverless or read-only environments
let inMemoryOrders: Order[] | null = null;

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "orders.json");

function getInitialDemoOrders(): Order[] {
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
  const yesterdayStr = getRelativeDateStr(-1);

  return [
    {
      id: "ord_autarix_101",
      storeSlug: "autarix",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      product: {
        id: "prod-02",
        name: "Pastel Peony & Hydrangea Dream",
        nameZh: "梦幻粉蓝绣球与芍药花束",
        price: 168,
        image:
          "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80",
      },
      addons: [
        {
          id: "led_lights",
          name: "Warm Fairy LED Lights",
          nameZh: "暖光 LED 氛围小彩灯",
          price: 10,
        },
        {
          id: "foil_balloon",
          name: "Happy Birthday Foil Balloon",
          nameZh: "生日快乐铝箔精美气球",
          price: 18,
        },
      ],
      fulfillmentMethod: "delivery",
      deliveryZoneName: "Georgetown / Ayer Itam / Farlim / Jelutong",
      deliveryFee: 10,
      deliveryDate: todayStr,
      deliveryTimeSlot: "10:00 AM – 11:00 AM",
      recipient: {
        name: "Sarah Tan",
        phone: "+60165541234",
        deliveryAddress: "12, Jalan Kelawai, 10250 Georgetown, Pulau Pinang",
      },
      cardMessage:
        "Happy 25th Birthday Sarah! Wishing you endless joy, love, and sunshine. Love always, Bryan.",
      notes: "Please call upon arrival at the guardhouse.",
      totalAmount: 206,
      paymentMode: "static_qr",
      paymentStatus: "paid_tng",
      fulfillmentStatus: "preparing",
      orderSource: "web",
    },
    {
      id: "ord_autarix_102",
      storeSlug: "autarix",
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      product: {
        id: "prod-01",
        name: "Crimson Velvet Roses",
        nameZh: "浓情红丝绒厄瓜多尔玫瑰花束",
        price: 188,
        image:
          "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
      },
      addons: [
        {
          id: "ferrero_box",
          name: "Ferrero Rocher Chocolates (3 pcs)",
          nameZh: "金莎巧克力心意礼盒 (3粒装)",
          price: 15,
        },
      ],
      fulfillmentMethod: "delivery",
      deliveryZoneName: "Bayan Lepas / Gelugor / Tg Tokong / Gurney",
      deliveryFee: 18,
      deliveryDate: todayStr,
      deliveryTimeSlot: "02:00 PM – 03:00 PM",
      recipient: {
        name: "Kelly Lim",
        phone: "+60124419876",
        deliveryAddress:
          "Unit 8-3-2, The Light Linear, Jalan Pantai Sinaran, 11700 Gelugor, Pulau Pinang",
      },
      cardMessage:
        "Happy 3rd Anniversary my dearest Kelly. Thank you for being my rock and greatest blessing.",
      notes: "Leave with front desk concierge if not in unit.",
      totalAmount: 221,
      paymentMode: "bank_transfer",
      paymentStatus: "paid_transfer",
      fulfillmentStatus: "new",
      orderSource: "phone",
    },
    {
      id: "ord_autarix_103",
      storeSlug: "autarix",
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      product: {
        id: "prod-05",
        name: "Dutch Sunset Tulip Bloom Box",
        nameZh: "落日晚霞渐变郁金香圆盒",
        price: 158,
        image:
          "https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=800&q=80",
      },
      addons: [],
      fulfillmentMethod: "pickup",
      deliveryFee: 0,
      deliveryDate: todayStr,
      deliveryTimeSlot: "05:00 PM – 06:00 PM",
      recipient: {
        name: "Amanda Chew",
        phone: "+60178823344",
      },
      cardMessage:
        "Congratulations on your clinic grand opening Dr. Amanda! Proud of you!",
      notes: "Will pick up around 5:20 PM after work.",
      totalAmount: 158,
      paymentMode: "duitnow_qr",
      paymentStatus: "paid_duitnow",
      fulfillmentStatus: "ready",
      orderSource: "walk_in",
    },
    {
      id: "ord_autarix_104",
      storeSlug: "autarix",
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      product: {
        id: "prod-03",
        name: "Sunny Sunflowers & Chamomile",
        nameZh: "向阳而生向日葵与洋甘菊手作花束",
        price: 138,
        image:
          "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80",
      },
      addons: [
        {
          id: "led_lights",
          name: "Warm Fairy LED Lights",
          nameZh: "暖光 LED 氛围小彩灯",
          price: 10,
        },
      ],
      fulfillmentMethod: "delivery",
      deliveryZoneName: "Penang Mainland (Butterworth / Bukit Mertajam)",
      deliveryFee: 30,
      deliveryDate: tomorrowStr,
      deliveryTimeSlot: "11:00 AM – 12:00 PM",
      recipient: {
        name: "Jason Ooi",
        phone: "+60192237788",
        deliveryAddress:
          "45, Lorong Limbungan Indah 2, Taman Limbungan Indah, 12100 Butterworth, Pulau Pinang",
      },
      cardMessage:
        "Speedy recovery Jason! Rest up, take it easy and get well soon.",
      totalAmount: 178,
      paymentMode: "static_qr",
      paymentStatus: "paid_tng",
      fulfillmentStatus: "new",
    },
    {
      id: "ord_autarix_100",
      storeSlug: "autarix",
      createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
      product: {
        id: "prod-04",
        name: "Enchanted Lilac Glass Dome",
        nameZh: "紫丁香物语永生花晶透玻璃罩",
        price: 198,
        image:
          "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80",
      },
      addons: [],
      fulfillmentMethod: "delivery",
      deliveryZoneName: "Georgetown / Ayer Itam / Farlim / Jelutong",
      deliveryFee: 10,
      deliveryDate: yesterdayStr,
      deliveryTimeSlot: "03:00 PM – 04:00 PM",
      recipient: {
        name: "Chloe Teoh",
        phone: "+60164491122",
        deliveryAddress: "88, Jalan Kelawai, Georgetown",
      },
      cardMessage: "Wishing you peaceful moments and everlasting joy.",
      totalAmount: 208,
      paymentMode: "static_qr",
      paymentStatus: "paid_tng",
      fulfillmentStatus: "completed",
    },

    // Greenland demo orders
    {
      id: "ord_greenland_201",
      storeSlug: "greenland",
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      product: {
        id: "prod-gl-01",
        name: "Cascading White Phalaenopsis Orchid Bowl",
        price: 268,
        image:
          "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80",
      },
      addons: [
        {
          id: "calligraphy_card",
          name: "Handcrafted Calligraphy Greeting Card",
          price: 12,
        },
      ],
      fulfillmentMethod: "delivery",
      deliveryZoneName: "Mont Kiara / Sri Hartamas / Dutamas",
      deliveryFee: 10,
      deliveryDate: todayStr,
      deliveryTimeSlot: "11:30 AM (Exact Delivery)",
      recipient: {
        name: "Datin Melissa Wong",
        phone: "+60193321100",
        deliveryAddress:
          "Penthouse 32-1, 10 Mont Kiara, Jalan Kiara 1, 50480 Kuala Lumpur",
      },
      cardMessage:
        "Warmest housewarming congratulations to Datin Melissa and family!",
      totalAmount: 290,
      paymentMode: "static_qr",
      paymentStatus: "paid_tng",
      fulfillmentStatus: "preparing",
    },
  ];
}

function loadOrdersFromFile(): Order[] {
  if (inMemoryOrders) return inMemoryOrders;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      inMemoryOrders = JSON.parse(raw);
      return inMemoryOrders || [];
    }
  } catch (err) {
    console.error("Error loading orders from file:", err);
  }

  // Initialize with demo orders if file does not exist
  inMemoryOrders = getInitialDemoOrders();
  saveOrdersToFile(inMemoryOrders);
  return inMemoryOrders;
}

function saveOrdersToFile(orders: Order[]): void {
  inMemoryOrders = orders;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing orders to file:", err);
  }
}

// ---------------------------------------------------------------------------
// Supabase REST Integration (Zero-dependency via native fetch)
// ---------------------------------------------------------------------------

function getSupabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

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
  order_source?: string;
  holiday_surcharge?: number;
  holiday_name?: string;
}

function mapRowToOrder(row: SupabaseOrderRow): Order {
  return {
    id: row.id,
    storeSlug: row.store_slug,
    createdAt: row.created_at,
    product: {
      id: row.product_id,
      name: row.product_name,
      price: Number(row.product_price),
      image: row.product_image || "",
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
    notes: row.notes,
    totalAmount: Number(row.total_amount),
    paymentMode: (row.payment_mode || "static_qr") as any,
    paymentStatus: (row.payment_status || "paid_tng") as any,
    fulfillmentStatus: row.fulfillment_status,
    orderSource: ((row as any).order_source || "web") as any,
    holidaySurcharge: row.holiday_surcharge ? Number(row.holiday_surcharge) : undefined,
    holidayName: row.holiday_name,
  };
}

function mapOrderToRow(order: Order): SupabaseOrderRow {
  return {
    id: order.id,
    store_slug: order.storeSlug,
    created_at: order.createdAt,
    product_id: order.product.id,
    product_name: order.product.name,
    product_price: order.product.price,
    product_image: order.product.image,
    addons: order.addons,
    fulfillment_method: order.fulfillmentMethod,
    delivery_zone_name: order.deliveryZoneName,
    delivery_fee: order.deliveryFee,
    delivery_date: order.deliveryDate,
    delivery_time_slot: order.deliveryTimeSlot,
    recipient_name: order.recipient.name,
    recipient_phone: order.recipient.phone,
    delivery_address: order.recipient.deliveryAddress,
    card_message: order.cardMessage,
    notes: order.notes,
    total_amount: order.totalAmount,
    payment_mode: order.paymentMode,
    payment_status: order.paymentStatus,
    fulfillment_status: order.fulfillmentStatus,
    order_source: order.orderSource || "web",
    holiday_surcharge: order.holidaySurcharge,
    holiday_name: order.holidayName,
  };
}

/**
 * Returns all orders for a specific tenant store slug.
 */
export async function getOrdersByStore(storeSlug: string): Promise<Order[]> {
  const sb = getSupabaseConfig();
  if (sb) {
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
      console.warn("Supabase fetch returned non-200 status, falling back to local storage:", res.status);
    } catch (err) {
      console.error("Supabase getOrdersByStore error, falling back to local file:", err);
    }
  }

  // Local fallback
  const allOrders = loadOrdersFromFile();
  return allOrders
    .filter((o) => o.storeSlug.toLowerCase() === storeSlug.toLowerCase())
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

/**
 * Creates and records a new order in the store book.
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
  if (sb) {
    try {
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

      if (res.ok) {
        const inserted: SupabaseOrderRow[] = await res.json();
        if (inserted && inserted[0]) {
          return mapRowToOrder(inserted[0]);
        }
      }
      console.warn("Supabase insert returned non-200 status:", res.status);
    } catch (err) {
      console.error("Supabase recordNewOrder error, saving to local file:", err);
    }
  }

  // Local fallback
  const allOrders = loadOrdersFromFile();
  const updated = [newOrder, ...allOrders];
  saveOrdersToFile(updated);
  return newOrder;
}

/**
 * Updates an order's fulfillment status (e.g. "preparing", "dispatched", "completed").
 */
export interface OrderUpdatePayload {
  fulfillmentStatus?: FulfillmentStatus;
  deliveryTimeSlot?: string;
  deliveryDate?: string;
  notes?: string;
}

/**
 * Updates an order's fulfillment status, rescheduled delivery time slot, date, or notes.
 */
export async function updateOrderDetails(
  orderId: string,
  updates: OrderUpdatePayload
): Promise<Order | null> {
  const sb = getSupabaseConfig();
  if (sb) {
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
        const updated: SupabaseOrderRow[] = await res.json();
        if (updated && updated[0]) {
          return mapRowToOrder(updated[0]);
        }
      }
    } catch (err) {
      console.error("Supabase updateOrderDetails error, falling back to local file:", err);
    }
  }

  // Local fallback
  const allOrders = loadOrdersFromFile();
  const index = allOrders.findIndex((o) => o.id === orderId);
  if (index === -1) return null;

  if (updates.fulfillmentStatus) allOrders[index].fulfillmentStatus = updates.fulfillmentStatus;
  if (updates.deliveryTimeSlot) allOrders[index].deliveryTimeSlot = updates.deliveryTimeSlot;
  if (updates.deliveryDate) allOrders[index].deliveryDate = updates.deliveryDate;
  if (updates.notes !== undefined) allOrders[index].notes = updates.notes;

  saveOrdersToFile(allOrders);
  return allOrders[index];
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
 * Wipes all orders from both Supabase (if configured) and local storage.
 */
export async function clearAllOrders(): Promise<{
  supabaseCleared: boolean;
  localCleared: boolean;
}> {
  let supabaseCleared = false;
  let localCleared = false;

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

  // Clear local file & in-memory cache
  inMemoryOrders = [];
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
    localCleared = true;
  } catch (err) {
    console.error("Error clearing local orders file:", err);
  }

  return { supabaseCleared, localCleared };
}

