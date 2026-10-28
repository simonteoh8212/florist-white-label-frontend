#!/usr/bin/env node

/**
 * CSV Product Importer for FlowerApp.my White-Label Platform
 *
 * Usage:
 *   node scripts/import-products.mjs --store=autarix --file=templates/products_template.csv
 *   npm run import-products -- --store=autarix --file=./inventory.csv
 *
 * Options:
 *   --store=<slug>    Target tenant store slug (e.g., autarix, greenland)
 *   --file=<path>     Path to the source CSV file
 *   --append          Append new items to existing catalog rather than replacing
 *   --help            Show help documentation
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Smart resilient argument parser
function parseArgs() {
  const rawArgs = process.argv.slice(2);
  const options = {
    store: "",
    file: "",
    append: false,
    help: false,
  };

  // Expand any accidentally glued arguments like "--store=autarix--file=catalog.csv"
  const args = [];
  for (const raw of rawArgs) {
    if (raw.includes("--file=") && raw.includes("--store=")) {
      const parts = raw.split(/(?=--(?:store|file|append)=)/);
      args.push(...parts);
    } else {
      args.push(raw);
    }
  }

  const positionals = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i].trim();

    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--append") {
      options.append = true;
    } else if (arg.startsWith("--store=")) {
      options.store = arg.split("=")[1].trim();
    } else if (arg === "--store" && args[i + 1]) {
      options.store = args[++i].trim();
    } else if (arg.startsWith("--file=")) {
      options.file = arg.split("=")[1].trim();
    } else if (arg === "--file" && args[i + 1]) {
      options.file = args[++i].trim();
    } else if (!arg.startsWith("-")) {
      positionals.push(arg);
    }
  }

  // Handle positional arguments (e.g. "autarix autarix_products.csv")
  for (const pos of positionals) {
    if (pos.endsWith(".csv") || pos.includes("/") || pos.includes("\\")) {
      if (!options.file) options.file = pos;
    } else {
      if (!options.store) options.store = pos;
    }
  }

  return options;
}

// Robust CSV parser supporting commas inside quotes, escaped quotes, UTF-8 BOM, and comments
function parseCSV(text) {
  // Strip UTF-8 BOM (Byte Order Mark) if created by Excel
  const cleanText = (text || "").replace(/^\uFEFF/, "");
  const lines = cleanText
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith("#");
    });
  if (lines.length === 0) return { headers: [], rows: [] };

  function parseLine(line) {
    const values = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  }

  const rawHeaders = parseLine(lines[0]);
  const headers = rawHeaders.map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ""));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === 0 || values.every((v) => v === "")) continue;

    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

// Clean and normalize price value (e.g. "RM 168.00" -> 168)
function normalizePrice(val) {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

// Format image URL: auto-prefix local tenant folder if just filename provided
function normalizeImage(imgStr, storeSlug) {
  const trimmed = (imgStr || "").trim();
  if (!trimmed) {
    return `https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80`;
  }
  // External URL (CDN / Unsplash / S3)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  // Already full path with leading slash: "/stores/autarix/..."
  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  // Missing leading slash: "stores/autarix/..."
  if (trimmed.startsWith("stores/")) {
    return `/${trimmed}`;
  }
  // Prefixed with slug: "autarix/birthday_bouquet.webp"
  if (trimmed.startsWith(`${storeSlug}/`)) {
    return `/stores/${trimmed}`;
  }
  // Just the filename: "birthday_bouquet.webp" -> "/stores/autarix/birthday_bouquet.webp"
  return `/stores/${storeSlug}/${trimmed}`;
}

function showHelp() {
  console.log(`
🌸 FlowerApp.my - CSV Product Catalog Importer 🌸

Usage:
  node scripts/import-products.mjs --store=<slug> --file=<path_to_csv> [--append]

Arguments:
  --store=<slug>   Target store folder (e.g. "autarix", "greenland")
  --file=<path>    Path to CSV file (e.g. "templates/products_template.csv")
  --append         Append imported products to existing catalog instead of replacing
  --help, -h       Display this help message

Expected CSV Columns:
  - name / title        (Required) Product arrangement title
  - price               (Required) Numeric price (e.g. 168 or RM 168)
  - category            (Optional) Category tab (e.g. Birthday, Romance, Vase)
  - description         (Optional) Product story or details
  - image               (Optional) File name in /public/stores/<slug>/ or external URL
  - tag                 (Optional) Highlight pill (e.g. Best Seller, Popular)
  - name_zh             (Optional) Chinese arrangement title
  - category_zh         (Optional) Chinese category tab
  - tag_zh              (Optional) Chinese tag pill
  - description_zh      (Optional) Chinese description
  - in_stock            (Optional) true / false (defaults to true)
  - id                  (Optional) Custom product id (auto-generated if omitted)

Example:
  node scripts/import-products.mjs --store=autarix --file=./autarix_100_items.csv
`);
}

async function run() {
  const options = parseArgs();

  if (options.help || (!options.store && !options.file)) {
    showHelp();
    process.exit(0);
  }

  if (!options.store) {
    console.error("❌ Error: Missing --store argument (e.g. --store=autarix)");
    process.exit(1);
  }

  if (!options.file) {
    console.error("❌ Error: Missing --file argument (e.g. --file=./products.csv)");
    process.exit(1);
  }

  const storeSlug = options.store.toLowerCase().trim();
  const filePath = path.isAbsolute(options.file)
    ? options.file
    : path.join(rootDir, options.file);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: CSV file not found at: ${filePath}`);
    process.exit(1);
  }

  console.log(`\n⏳ Reading CSV from: ${path.relative(rootDir, filePath)}...`);
  const csvContent = fs.readFileSync(filePath, "utf-8");
  const { rows } = parseCSV(csvContent);

  if (rows.length === 0) {
    console.error("❌ Error: No valid product rows found in CSV file.");
    process.exit(1);
  }

  // Tenant directory and destination JSON
  const tenantDir = path.join(rootDir, "src", "config", "tenants", storeSlug);
  const targetJsonPath = path.join(tenantDir, "products.json");

  let existingProducts = [];
  if (options.append && fs.existsSync(targetJsonPath)) {
    try {
      existingProducts = JSON.parse(fs.readFileSync(targetJsonPath, "utf-8"));
      console.log(`📦 Found ${existingProducts.length} existing products in catalog.`);
    } catch {
      existingProducts = [];
    }
  }

  const existingIds = new Set(existingProducts.map((p) => p.id));
  const newProducts = [];
  let startIndex = existingProducts.length + 1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row.name || row.title || row.productname || row.product;
    if (!name || !name.trim()) continue;

    const price = normalizePrice(row.price || row.amount || row.cost);
    const category = (row.category || row.type || "Bouquets").trim();
    const description = (row.description || row.desc || row.details || "").trim();
    const tag = (row.tag || row.badge || "").trim();
    const rawImage = row.image || row.imageurl || row.photo || row.picture;
    const image = normalizeImage(rawImage, storeSlug);

    let id = (row.id || "").trim();
    if (!id || existingIds.has(id)) {
      const padIndex = String(startIndex + i).padStart(2, "0");
      id = `${storeSlug}-${padIndex}`;
    }

    const productObj = {
      id,
      name: name.trim(),
      price,
      description,
      image,
      category,
    };

    if (tag) {
      productObj.tag = tag;
    }

    const nameZh = (row.name_zh || row.namezh || row.chinesename || "").trim();
    if (nameZh) productObj.nameZh = nameZh;

    const descriptionZh = (row.description_zh || row.descriptionzh || row.details_zh || "").trim();
    if (descriptionZh) productObj.descriptionZh = descriptionZh;

    const categoryZh = (row.category_zh || row.categoryzh || "").trim();
    if (categoryZh) productObj.categoryZh = categoryZh;

    const tagZh = (row.tag_zh || row.tagzh || "").trim();
    if (tagZh) productObj.tagZh = tagZh;

    const rawStock = row.in_stock ?? row.instock;
    if (rawStock !== undefined && rawStock !== "") {
      const stockStr = String(rawStock).toLowerCase().trim();
      productObj.inStock = stockStr !== "false" && stockStr !== "0" && stockStr !== "no";
    }

    newProducts.push(productObj);
    existingIds.add(id);
  }

  const finalProducts = options.append
    ? [...existingProducts, ...newProducts]
    : newProducts;

  if (!fs.existsSync(tenantDir)) {
    fs.mkdirSync(tenantDir, { recursive: true });
  }

  fs.writeFileSync(targetJsonPath, JSON.stringify(finalProducts, null, 2), "utf-8");

  console.log(`\n✅ Successfully imported ${newProducts.length} products for store "${storeSlug}"!`);
  console.log(`📁 Saved to: ${path.relative(rootDir, targetJsonPath)}`);
  console.log(`📊 Total catalog count: ${finalProducts.length} items`);
  console.log(`\nCategories found:`);
  const categoryCounts = {};
  finalProducts.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    console.log(`  • ${cat}: ${count} arrangements`);
  });
  console.log("\n✨ Done! Next.js will auto-refresh the storefront with the updated catalog.\n");
}

run().catch((err) => {
  console.error("❌ Unexpected error during import:", err);
  process.exit(1);
});
