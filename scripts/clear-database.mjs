import fs from "fs";
import path from "path";

// 1. Clear local data/orders.json
const dataFile = path.join(process.cwd(), "data", "orders.json");
if (fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, "[]\n", "utf-8");
  console.log("✓ Cleared local data/orders.json");
}

// 2. Read .env for Supabase
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes("your-project-id")) {
  console.log(`Connecting to Supabase at ${SUPABASE_URL} to delete orders...`);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=neq.empty_placeholder_string`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (res.ok) {
      console.log("✓ Cleared all orders from Supabase database!");
    } else {
      const errText = await res.text();
      console.error(`✗ Failed to clear Supabase orders (${res.status}): ${errText}`);
    }
  } catch (err) {
    console.error("✗ Error clearing Supabase orders:", err.message);
  }
}

console.log("\n🧹 Done! All orders have been wiped clean.");
