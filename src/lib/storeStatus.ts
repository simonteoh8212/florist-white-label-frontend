import fs from "fs";
import path from "path";

export interface StoreEmergencyStatus {
  storeSlug: string;
  isTodayPaused: boolean;
  pausedDate?: string; // YYYY-MM-DD format
  isTomorrowBlocked: boolean;
  blockedDate?: string; // YYYY-MM-DD format
  emergencyNotice?: string;
  holidayPricingDisplay?: "separate_surcharge" | "inclusive";
  outOfStockProductIds?: string[];
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const STATUS_FILE = path.join(DATA_DIR, "store_status.json");

let inMemoryStatuses: Record<string, StoreEmergencyStatus> = {};

function getDateString(daysAhead: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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

function loadStatusesFromFile(): Record<string, StoreEmergencyStatus> {
  if (Object.keys(inMemoryStatuses).length > 0) {
    return inMemoryStatuses;
  }
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const raw = fs.readFileSync(STATUS_FILE, "utf-8");
      inMemoryStatuses = JSON.parse(raw);
      return inMemoryStatuses;
    }
  } catch (err) {
    console.error("Error loading store statuses from file:", err);
  }
  return {};
}

function saveStatusesToFile(statuses: Record<string, StoreEmergencyStatus>): void {
  inMemoryStatuses = { ...statuses };
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATUS_FILE, JSON.stringify(statuses, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving store statuses to file:", err);
  }
}

/**
 * Normalizes status by auto-expiring single-day pauses when the date has passed.
 * e.g., if a florist paused today on Oct 26, when Oct 27 arrives, Oct 26's pause expires.
 */
function normalizeStatus(status: StoreEmergencyStatus): StoreEmergencyStatus {
  const todayStr = getDateString(0);
  const tomorrowStr = getDateString(1);

  let isTodayPaused = status.isTodayPaused;
  let isTomorrowBlocked = status.isTomorrowBlocked;

  if (isTodayPaused && status.pausedDate && status.pausedDate !== todayStr) {
    isTodayPaused = false;
  }

  if (isTomorrowBlocked && status.blockedDate && status.blockedDate !== tomorrowStr) {
    isTomorrowBlocked = false;
  }

  return {
    ...status,
    isTodayPaused,
    isTomorrowBlocked,
  };
}

/**
 * Retrieve the current emergency status for a store.
 */
export async function getStoreEmergencyStatus(slug: string): Promise<StoreEmergencyStatus> {
  const normalizedSlug = slug.toLowerCase();
  const todayStr = getDateString(0);
  const tomorrowStr = getDateString(1);

  const defaultStatus: StoreEmergencyStatus = {
    storeSlug: normalizedSlug,
    isTodayPaused: false,
    pausedDate: todayStr,
    isTomorrowBlocked: false,
    blockedDate: tomorrowStr,
    emergencyNotice: "",
    updatedAt: new Date().toISOString(),
  };

  // 1. Try Supabase if configured
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      const res = await fetch(
        `${sb.url}/rest/v1/store_status?store_slug=eq.${encodeURIComponent(normalizedSlug)}&select=*`,
        {
          headers: {
            apikey: sb.key,
            Authorization: `Bearer ${sb.key}`,
          },
          cache: "no-store",
        }
      );
      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length > 0) {
          const row = rows[0];
          const fetchedStatus: StoreEmergencyStatus = {
            storeSlug: row.store_slug,
            isTodayPaused: Boolean(row.is_today_paused),
            pausedDate: row.paused_date || todayStr,
            isTomorrowBlocked: Boolean(row.is_tomorrow_blocked),
            blockedDate: row.blocked_date || tomorrowStr,
            emergencyNotice: row.emergency_notice || "",
            holidayPricingDisplay: row.holiday_pricing_display || row.holidayPricingDisplay || undefined,
            outOfStockProductIds: Array.isArray(row.out_of_stock_product_ids)
              ? row.out_of_stock_product_ids
              : Array.isArray(row.outOfStockProductIds)
              ? row.outOfStockProductIds
              : [],
            updatedAt: row.updated_at || new Date().toISOString(),
          };
          return normalizeStatus(fetchedStatus);
        }
      }
    } catch (err) {
      console.warn("Supabase store_status fetch failed, falling back to local file:", err);
    }
  }

  // 2. Local file / in-memory fallback
  const allStatuses = loadStatusesFromFile();
  if (allStatuses[normalizedSlug]) {
    return normalizeStatus(allStatuses[normalizedSlug]);
  }

  return defaultStatus;
}

/**
 * Update the emergency status for a store.
 */
export async function updateStoreEmergencyStatus(
  slug: string,
  updates: Partial<StoreEmergencyStatus>
): Promise<StoreEmergencyStatus> {
  const normalizedSlug = slug.toLowerCase();
  const current = await getStoreEmergencyStatus(normalizedSlug);
  const todayStr = getDateString(0);
  const tomorrowStr = getDateString(1);

  const updated: StoreEmergencyStatus = {
    ...current,
    ...updates,
    storeSlug: normalizedSlug,
    pausedDate: updates.isTodayPaused ? todayStr : updates.pausedDate ?? current.pausedDate ?? todayStr,
    blockedDate: updates.isTomorrowBlocked ? tomorrowStr : updates.blockedDate ?? current.blockedDate ?? tomorrowStr,
    outOfStockProductIds: updates.outOfStockProductIds ?? current.outOfStockProductIds ?? [],
    updatedAt: new Date().toISOString(),
  };

  // 1. Try Supabase if configured
  const sb = getSupabaseConfig();
  if (sb) {
    try {
      await fetch(`${sb.url}/rest/v1/store_status`, {
        method: "POST",
        headers: {
          apikey: sb.key,
          Authorization: `Bearer ${sb.key}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          store_slug: updated.storeSlug,
          is_today_paused: updated.isTodayPaused,
          paused_date: updated.pausedDate,
          is_tomorrow_blocked: updated.isTomorrowBlocked,
          blocked_date: updated.blockedDate,
          emergency_notice: updated.emergencyNotice || null,
          holiday_pricing_display: updated.holidayPricingDisplay || null,
          out_of_stock_product_ids: updated.outOfStockProductIds || [],
          updated_at: updated.updatedAt,
        }),
      });
    } catch (err) {
      console.warn("Supabase store_status update failed, saved to local file:", err);
    }
  }

  // 2. Always persist locally
  const allStatuses = loadStatusesFromFile();
  allStatuses[normalizedSlug] = updated;
  saveStatusesToFile(allStatuses);

  return updated;
}
