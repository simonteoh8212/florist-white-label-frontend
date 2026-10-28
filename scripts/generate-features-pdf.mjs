import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

async function generateFeaturesPDF() {
  const pdfDoc = await PDFDocument.create();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  // A4 dimensions in points
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 36;
  const marginTop = 42;
  const marginBottom = 42;
  const contentWidth = pageWidth - marginX * 2; // 523.28

  // Palette
  const colorRosePrimary = rgb(0.74, 0.09, 0.36); // #BE185D
  const colorRoseDark = rgb(0.61, 0.09, 0.30); // #9D174D
  const colorRoseSoft = rgb(0.99, 0.95, 0.96); // #FFF1F2
  const colorRoseBorder = rgb(0.96, 0.80, 0.86); // #FBCFE8
  const colorDark = rgb(0.11, 0.10, 0.12); // #1C1917
  const colorText = rgb(0.20, 0.19, 0.22); // #332F35
  const colorMuted = rgb(0.45, 0.44, 0.48); // #71717A
  const colorLightBg = rgb(0.97, 0.97, 0.98); // #F8F9FA
  const colorBorder = rgb(0.88, 0.88, 0.90); // #E2E4E8
  const colorWhite = rgb(1, 1, 1);
  const colorCodeBg = rgb(0.94, 0.94, 0.96); // #F0F1F5
  const colorCodeText = rgb(0.18, 0.25, 0.38); // #2E4057

  // Helper: word wrap lines
  function getWrappedLines(text, width, fontSize, font) {
    if (!text) return [];
    // Clean string from any non-standard unicode that might break Helvetica
    const sanitized = text
      .replace(/→/g, "->")
      .replace(/•/g, "-")
      .replace(/–|—/g, "-")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");

    const paragraphs = sanitized.split("\n");
    const lines = [];

    for (const paragraph of paragraphs) {
      const words = paragraph.split(" ");
      let currentLine = "";

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (!word) continue;
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > width && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
    }

    return lines;
  }

  // Categories data definition
  const categories = [
    {
      id: "01",
      title: "Multi-Tenant Routing & Platform Hub",
      description: "Edge subdomain routing, store isolation, and the central platform directory.",
      items: [
        {
          task: "Browse tenant directory (Dev/Demo mode)",
          howTo: "Navigate to root URL on bare host to test dynamic tenant switcher.",
          ui: "Root URL: / or localhost:3000",
          code: "app/page.tsx",
        },
        {
          task: "Toggle Directory vs. Public Landing",
          howTo: "Switch SHOW_TENANT_DIRECTORY between true and false to toggle platform state.",
          ui: "Root URL (Controlled via .env)",
          code: ".env / app/page.tsx (L22-L25)",
        },
        {
          task: "Wildcard Subdomain Routing",
          howTo: "Access tenant directly via subdomain (e.g. autarix.flowerapp.my) without /store/ prefix.",
          ui: "Subdomain: [slug].flowerapp.my",
          code: "middleware.ts (L18-L54)",
        },
      ],
    },
    {
      id: "02",
      title: "Customer Storefront & Catalog Discovery",
      description: "Arrangement browsing, live search, view modes, and high-resolution photography.",
      items: [
        {
          task: "Visit florist branded storefront",
          howTo: "Explore personalized brand styling, logo, banner, and curated flower collections.",
          ui: "/store/[slug] (or subdomain)",
          code: "app/store/[slug]/page.tsx",
        },
        {
          task: "Filter bouquets by category",
          howTo: "Click category pills (All, Birthday, Graduation, Condolence, Balloons & Gifts).",
          ui: "Category pills under search bar",
          code: "components/StorefrontClient.tsx",
        },
        {
          task: "Live search floral arrangements",
          howTo: "Type keywords in search input for instant filtering across names and descriptions.",
          ui: "Top search bar input field",
          code: "components/StorefrontClient.tsx",
        },
        {
          task: "Toggle Grid vs. List view mode",
          howTo: "Click layout switch button; preference persists in cookies and localStorage.",
          ui: "Header view toggle icon",
          code: "components/StorefrontClient.tsx\ncomponents/ProductCard.tsx",
        },
        {
          task: "Filter out sold-out items",
          howTo: "Check 'Hide Sold Out' toggle to view exclusively in-stock arrangements.",
          ui: "Catalog toolbar filter switch",
          code: "components/StorefrontClient.tsx",
        },
        {
          task: "Sort catalog by price",
          howTo: "Select sorting from dropdown (Price: Low to High / High to Low).",
          ui: "Catalog toolbar sort dropdown",
          code: "components/StorefrontClient.tsx",
        },
        {
          task: "Preview high-res photo lightbox",
          howTo: "Click any product image thumbnail to launch full-screen modal zoom.",
          ui: "Click product image card",
          code: "components/ProductImageModal.tsx",
        },
        {
          task: "Switch Language (English / Chinese)",
          howTo: "Select language in dropdown; updates catalog, checkout, and WhatsApp receipts.",
          ui: "Top header language dropdown",
          code: "components/LanguageSelector.tsx\nsrc/i18n/translations.ts",
        },
        {
          task: "Read studio policies & SSM info",
          howTo: "Click footer policy link to view business registration, refund, and delivery rules.",
          ui: "Footer 'Store Policies' link",
          code: "components/StorePolicyModal.tsx",
        },
      ],
    },
    {
      id: "03",
      title: "Customer Favourites & Wishlist",
      description: "Local storage wishlisting with drawer preview and one-click checkout.",
      items: [
        {
          task: "Bookmark/favourite arrangement",
          howTo: "Tap the floating heart icon on any product card.",
          ui: "Heart button on bouquet cards",
          code: "components/ProductCard.tsx",
        },
        {
          task: "View saved arrangements drawer",
          howTo: "Tap top-right heart badge (shows active count with bounce animation).",
          ui: "Top header heart badge",
          code: "components/FavouritesDrawer.tsx\ncomponents/FavouritesProvider.tsx",
        },
        {
          task: "Order directly from favourites",
          howTo: "Click 'Order Now' on any item in drawer to open checkout immediately.",
          ui: "Inside Favourites Drawer",
          code: "components/FavouritesDrawer.tsx",
        },
      ],
    },
    {
      id: "04",
      title: "Add-ons, Quantity & Stepper",
      description: "Bouquet personalization with live calculated pricing.",
      items: [
        {
          task: "Adjust bouquet order quantity",
          howTo: "Use [-] [Qty] [+] stepper; auto-updates subtotal, addons, and delivery thresholds.",
          ui: "Checkout Drawer Step 1",
          code: "components/QtyStepper.tsx",
        },
        {
          task: "Select gift add-ons",
          howTo: "Toggle LED fairy lights, helium balloons, chocolates, greeting cards, plushies.",
          ui: "Checkout Drawer Step 1 (Add-ons)",
          code: "components/CheckoutDrawer.tsx",
        },
        {
          task: "Configure store add-on items",
          howTo: "Define custom add-on list, pricing, and icons per florist.",
          ui: "Code configuration",
          code: "src/config/stores.data.ts (addons)",
        },
      ],
    },
    {
      id: "05",
      title: "Delivery Logistics & Peak Surcharge Engine",
      description: "Zone delivery fees, time slots, rush detection, and holiday pricing rules.",
      items: [
        {
          task: "Select Delivery vs. Atelier Pickup",
          howTo: "Toggle between doorstep delivery and self-pickup at the florist atelier.",
          ui: "Checkout Drawer Step 1",
          code: "components/CheckoutDrawer.tsx",
        },
        {
          task: "Calculate zone fee & free delivery",
          howTo: "Select delivery area from dropdown; free delivery applies automatically if qualified.",
          ui: "Delivery Zone dropdown",
          code: "components/CheckoutDrawer.tsx\nsrc/config/stores.ts",
        },
        {
          task: "Pick delivery date & time window",
          howTo: "Select target date and 1-hour time slot (or exact time); rush warning triggers if close.",
          ui: "Date & Time selector",
          code: "components/CheckoutDrawer.tsx\nsrc/config/stores.ts",
        },
        {
          task: "Holiday peak surcharge calculation",
          howTo: "Dynamic price surge (fixed or %) auto-activates during peak dates (e.g. Valentine's).",
          ui: "Auto-calculated on date selection",
          code: "src/lib/holidayPricing.ts\nsrc/config/stores.data.ts",
        },
        {
          task: "Studio holiday order capacity cap",
          howTo: "Real-time order count check; closes date and suggests alternative if fully booked.",
          ui: "Date picker capacity alert",
          code: "app/api/store/capacity/route.ts\ncomponents/CheckoutDrawer.tsx",
        },
      ],
    },
    {
      id: "06",
      title: "Payment, Checkout & WhatsApp Bridge",
      description: "Touch 'n Go eWallet proof, structured receipts, and confetti celebrations.",
      items: [
        {
          task: "Pay with Touch 'n Go (TNG) QR",
          howTo: "Step 2 displays store TNG QR code, account name, and 1-click app deep-link.",
          ui: "Checkout Drawer Step 2",
          code: "components/TngPaymentView.tsx",
        },
        {
          task: "Send WhatsApp order confirmation",
          howTo: "Step 3 button generates structured invoice and opens WhatsApp to the florist.",
          ui: "Checkout Drawer Step 3",
          code: "utils/whatsapp.ts\ncomponents/CheckoutDrawer.tsx",
        },
        {
          task: "Copy formatted order text",
          howTo: "Click 'Copy Order Text' for easy manual sharing or pasting into WhatsApp.",
          ui: "Checkout Drawer Step 3",
          code: "components/OrderSuccess.tsx",
        },
        {
          task: "Trigger petal celebration burst",
          howTo: "Flower petal confetti animation launches on successful order placement.",
          ui: "Checkout confirmation screen",
          code: "components/PetalBurst.tsx",
        },
      ],
    },
    {
      id: "07",
      title: "Florist Dispatch Terminal & Order Book (Admin)",
      description: "Fulfillment workflow, order filtering, rescheduling, and customer contact.",
      items: [
        {
          task: "Access Florist Dispatch Terminal",
          howTo: "Navigate to orders URL and authenticate with 4-digit PIN.",
          ui: "/store/[slug]/orders",
          code: "app/store/[slug]/orders/page.tsx",
        },
        {
          task: "Staff PIN security & lockout",
          howTo: "Numeric keypad login with rate limiting (5 failed attempts lock for 5 minutes).",
          ui: "PIN authentication overlay",
          code: "components/FloristOrderBookClient.tsx\napp/api/orders/route.ts",
        },
        {
          task: "Filter orders by date tab",
          howTo: "Click [Today], [Tomorrow], [Upcoming], or [All] tabs to manage production.",
          ui: "Top date filter bar",
          code: "components/FloristOrderBookClient.tsx",
        },
        {
          task: "Filter orders by channel",
          howTo: "Filter by [All], [Web], [Walk-in], or [Phone] order sources.",
          ui: "Channel filter chips",
          code: "components/FloristOrderBookClient.tsx",
        },
        {
          task: "Search orders",
          howTo: "Search by Customer Name, Phone number, or Order ID in real-time.",
          ui: "Order book search bar",
          code: "components/FloristOrderBookClient.tsx",
        },
        {
          task: "Update fulfillment status",
          howTo: "Cycle through New -> Preparing -> Ready -> Dispatched -> Completed / Cancelled.",
          ui: "Status buttons on order cards",
          code: "components/FloristOrderBookClient.tsx\nsrc/lib/orders.ts",
        },
        {
          task: "Reschedule delivery slot",
          howTo: "Open reschedule modal to change date, choose time slot, or enter custom slot.",
          ui: "Order card 'Reschedule' button",
          code: "components/FloristOrderBookClient.tsx",
        },
        {
          task: "Copy driver delivery slip",
          howTo: "One-click copy formatted address, recipient, and notes for courier drivers.",
          ui: "Order card 'Copy Slip' icon",
          code: "components/FloristOrderBookClient.tsx",
        },
        {
          task: "Message customer directly",
          howTo: "Tap WhatsApp button next to customer phone number to chat directly.",
          ui: "Order card WhatsApp button",
          code: "components/FloristOrderBookClient.tsx",
        },
        {
          task: "View daily financial breakdown",
          howTo: "Inspect bottom summary bar for Cash vs. DuitNow/TNG totals and order counts.",
          ui: "Daily Summary sticky bar",
          code: "components/FloristOrderBookClient.tsx",
        },
      ],
    },
    {
      id: "08",
      title: "Quick POS Order Creation (Walk-in & Phone)",
      description: "Counter point-of-sale for takeaways and phone delivery bookings.",
      items: [
        {
          task: "Open Quick Order modal",
          howTo: "Click [+ Quick Order] button in the florist dispatch header.",
          ui: "Florist Order Book header",
          code: "components/FloristOrderBookClient.tsx",
        },
        {
          task: "Select order channel",
          howTo: "Choose Walk-in Counter, Phone Order, or Web Order source.",
          ui: "Quick Order Channel selector",
          code: "components/FloristOrderBookClient.tsx",
        },
        {
          task: "Catalog flower vs custom price",
          howTo: "Select from catalog or input custom arrangement name and price.",
          ui: "Product type toggle & fields",
          code: "components/FloristOrderBookClient.tsx",
        },
        {
          task: "Set Takeaway, Pickup or Delivery",
          howTo: "Select Immediate Takeaway (ready now) or scheduled delivery with recipient address.",
          ui: "Fulfillment selector",
          code: "components/FloristOrderBookClient.tsx",
        },
        {
          task: "Record payment method & status",
          howTo: "Record payment via Cash, DuitNow QR, TNG, or Transfer, with Paid / Pending status.",
          ui: "Payment method pills",
          code: "components/FloristOrderBookClient.tsx\napp/api/orders/route.ts",
        },
      ],
    },
    {
      id: "09",
      title: "Emergency & Inventory Live Controls",
      description: "Real-time store throttling, sold-out toggling, and broadcast notices.",
      items: [
        {
          task: "Open Emergency Drawer",
          howTo: "Click shield/alert icon in the florist dispatch header.",
          ui: "Emergency Drawer toggle button",
          code: "components/FloristOrderBookClient.tsx",
        },
        {
          task: "Pause today's incoming orders",
          howTo: "Toggle 'Pause Today's Orders' switch when production reaches atelier capacity.",
          ui: "Emergency Drawer toggle",
          code: "src/lib/storeStatus.ts\napp/api/store/status/route.ts",
        },
        {
          task: "Block tomorrow's pre-orders",
          howTo: "Toggle 'Block Tomorrow's Pre-orders' switch to stop advance bookings.",
          ui: "Emergency Drawer toggle",
          code: "src/lib/storeStatus.ts",
        },
        {
          task: "Toggle individual product stock",
          howTo: "Click 'Sold Out' on flowers that are out of fresh floral stock.",
          ui: "Product stock switches in drawer",
          code: "components/FloristOrderBookClient.tsx\ndata/store_status.json",
        },
        {
          task: "Broadcast emergency banner",
          howTo: "Type custom notice (e.g. 'Sold out of red roses'); displays across customer screens.",
          ui: "Emergency Drawer notice input",
          code: "components/StorePausedAnnouncementModal.tsx",
        },
        {
          task: "Reset all stock to In Stock",
          howTo: "Click 'Reset All Products to In Stock' after receiving morning flower shipments.",
          ui: "Emergency Drawer action button",
          code: "components/FloristOrderBookClient.tsx",
        },
      ],
    },
    {
      id: "10",
      title: "Tenant Onboarding & Catalog Management",
      description: "Setting up new florist brands, logos, delivery zones, and bulk imports.",
      items: [
        {
          task: "Configure new florist tenant",
          howTo: "Add store object to STORES map with SSM, WhatsApp, colors, logo, QR, and zones.",
          ui: "Code configuration",
          code: "src/config/stores.data.ts",
        },
        {
          task: "Edit/add products for tenant",
          howTo: "Update JSON catalog with product names, prices, tags, categories, and photos.",
          ui: "File editing",
          code: "src/config/tenants/[slug]/products.json",
        },
        {
          task: "Bulk import catalog from CSV",
          howTo: "Run terminal script: node scripts/import-products.mjs --store=[name] --file=[catalog.csv]",
          ui: "Terminal CLI command",
          code: "scripts/import-products.mjs",
        },
      ],
    },
    {
      id: "11",
      title: "Database, Persistence & Seeding",
      description: "PostgreSQL with Supabase, row-level security, and zero-config local fallback.",
      items: [
        {
          task: "Supabase PostgreSQL setup",
          howTo: "Execute SQL schema creating orders table, indexing store_slug, and RLS policies.",
          ui: "Supabase SQL Editor",
          code: "docs/supabase-schema.sql",
        },
        {
          task: "Configure database credentials",
          howTo: "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.",
          ui: ".env file configuration",
          code: ".env\nsrc/lib/orders.ts",
        },
        {
          task: "Seed demo test orders",
          howTo: "Run terminal script or trigger GET endpoint to populate realistic test data.",
          ui: "CLI: node scripts/seed-supabase.mjs\nor visit /api/seed",
          code: "scripts/seed-supabase.mjs\napp/api/seed/route.ts",
        },
        {
          task: "Clear all test orders",
          howTo: "Run terminal script to wipe test orders from Supabase database.",
          ui: "CLI: node scripts/clear-database.mjs",
          code: "scripts/clear-database.mjs\nsrc/lib/orders.ts",
        },
      ],
    },
    {
      id: "12",
      title: "B2B Merchant Agreement & Onboarding",
      description: "Legal templates, merchant onboarding contracts, and PDF generation.",
      items: [
        {
          task: "Review Merchant Agreement Template",
          howTo: "Read or customize B2B terms covering service fees, hardware, SLA, and SSM details.",
          ui: "Markdown documentation file",
          code: "docs/MERCHANT_AGREEMENT_TEMPLATE.md",
        },
        {
          task: "Generate Merchant Agreement PDF",
          howTo: "Run terminal script to generate formatted printable PDF contract for florist partners.",
          ui: "CLI: npm run generate-agreement-pdf",
          code: "scripts/generate-agreement-pdf.mjs\ndocs/MERCHANT_AGREEMENT_TEMPLATE.pdf",
        },
      ],
    },
  ];

  // Document Page Tracker
  const pages = [];
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  pages.push(currentPage);
  let cursorY = pageHeight - marginTop;

  function addNewPage() {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    pages.push(currentPage);
    cursorY = pageHeight - marginTop;

    // Draw running top header on subsequent pages
    currentPage.drawText("FLOWERAPP.MY  -  WHITE-LABEL FLORIST WEB APP CAPABILITIES GUIDE", {
      x: marginX,
      y: cursorY,
      size: 8,
      font: fontBold,
      color: colorRosePrimary,
    });

    currentPage.drawText("VERSION 1.0", {
      x: pageWidth - marginX - fontBold.widthOfTextAtSize("VERSION 1.0", 8),
      y: cursorY,
      size: 8,
      font: fontBold,
      color: colorMuted,
    });

    cursorY -= 8;
    currentPage.drawLine({
      start: { x: marginX, y: cursorY },
      end: { x: pageWidth - marginX, y: cursorY },
      thickness: 0.75,
      color: colorBorder,
    });
    cursorY -= 16;
  }

  function ensureSpace(neededPoints) {
    if (cursorY - neededPoints < marginBottom) {
      addNewPage();
    }
  }

  // ==========================================
  // PAGE 1: COVER HEADER & OVERVIEW
  // ==========================================
  // Brand Tag Pill
  const brandPillText = "FLOWERAPP.MY  •  PLATFORM CAPABILITIES & DIRECTORY";
  currentPage.drawRectangle({
    x: marginX,
    y: cursorY - 18,
    width: fontBold.widthOfTextAtSize(brandPillText, 8) + 16,
    height: 18,
    color: colorRoseSoft,
    borderColor: colorRoseBorder,
    borderWidth: 0.5,
  });
  currentPage.drawText(brandPillText, {
    x: marginX + 8,
    y: cursorY - 12.5,
    size: 8,
    font: fontBold,
    color: colorRosePrimary,
  });
  cursorY -= 28;

  // Document Title
  currentPage.drawText("Florist Web App: Complete Feature Directory", {
    x: marginX,
    y: cursorY,
    size: 19,
    font: fontBold,
    color: colorDark,
  });
  cursorY -= 16;

  // Subtitle
  currentPage.drawText("Master operations directory: How to perform every action and where to locate it in the UI & codebase.", {
    x: marginX,
    y: cursorY,
    size: 9.5,
    font: fontOblique,
    color: colorMuted,
  });
  cursorY -= 16;

  // Metadata Card
  const metaHeight = 38;
  currentPage.drawRectangle({
    x: marginX,
    y: cursorY - metaHeight,
    width: contentWidth,
    height: metaHeight,
    color: colorLightBg,
    borderColor: colorBorder,
    borderWidth: 0.75,
  });

  const col1X = marginX + 12;
  const col2X = marginX + 180;
  const col3X = marginX + 360;
  const metaY1 = cursorY - 14;
  const metaY2 = cursorY - 27;

  currentPage.drawText("ARCHITECTURE", { x: col1X, y: metaY1, size: 7.5, font: fontBold, color: colorMuted });
  currentPage.drawText("Next.js 16 + Edge Middleware", { x: col1X, y: metaY2, size: 8.5, font: fontRegular, color: colorDark });

  currentPage.drawText("DATABASE & PERSISTENCE", { x: col2X, y: metaY1, size: 7.5, font: fontBold, color: colorMuted });
  currentPage.drawText("Supabase PostgreSQL + JSON Fallback", { x: col2X, y: metaY2, size: 8.5, font: fontRegular, color: colorDark });

  currentPage.drawText("CHECKOUT & DISPATCH", { x: col3X, y: metaY1, size: 7.5, font: fontBold, color: colorMuted });
  currentPage.drawText("Touch 'n Go QR + WhatsApp Bridge", { x: col3X, y: metaY2, size: 8.5, font: fontRegular, color: colorDark });

  cursorY -= metaHeight + 20;

  // ==========================================
  // RENDER EACH CATEGORY
  // ==========================================
  const colWidthTask = 185;
  const colWidthUi = 150;
  const colWidthCode = contentWidth - colWidthTask - colWidthUi; // 188.28

  for (const cat of categories) {
    // Check if we have space for Category Header + at least 1 row
    ensureSpace(70);

    // Section Category Banner
    const bannerHeight = 22;
    currentPage.drawRectangle({
      x: marginX,
      y: cursorY - bannerHeight,
      width: contentWidth,
      height: bannerHeight,
      color: colorRoseDark,
    });

    const categoryTitle = `${cat.id}.  ${cat.title.toUpperCase()}`;
    currentPage.drawText(categoryTitle, {
      x: marginX + 10,
      y: cursorY - 15,
      size: 9.5,
      font: fontBold,
      color: colorWhite,
    });
    cursorY -= bannerHeight;

    // Table Header Row
    const tableHeaderHeight = 16;
    currentPage.drawRectangle({
      x: marginX,
      y: cursorY - tableHeaderHeight,
      width: contentWidth,
      height: tableHeaderHeight,
      color: colorLightBg,
      borderColor: colorBorder,
      borderWidth: 0.5,
    });

    currentPage.drawText("CAPABILITY & HOW-TO", {
      x: marginX + 8,
      y: cursorY - 11.5,
      size: 7.5,
      font: fontBold,
      color: colorMuted,
    });

    currentPage.drawText("WHERE IN UI / ACTION", {
      x: marginX + colWidthTask + 8,
      y: cursorY - 11.5,
      size: 7.5,
      font: fontBold,
      color: colorMuted,
    });

    currentPage.drawText("CODEBASE REFERENCE", {
      x: marginX + colWidthTask + colWidthUi + 8,
      y: cursorY - 11.5,
      size: 7.5,
      font: fontBold,
      color: colorMuted,
    });

    cursorY -= tableHeaderHeight;

    // Render items in this category
    for (let i = 0; i < cat.items.length; i++) {
      const item = cat.items[i];

      // Prepare wrapped lines
      const taskLines = getWrappedLines(item.task, colWidthTask - 16, 8.5, fontBold);
      const howToLines = getWrappedLines(item.howTo, colWidthTask - 16, 7.5, fontRegular);
      const uiLines = getWrappedLines(item.ui, colWidthUi - 16, 8, fontRegular);
      const codeLines = getWrappedLines(item.code, colWidthCode - 16, 7.5, fontRegular);

      const taskHeight = (taskLines.length * 10.5) + (howToLines.length * 9.5);
      const uiHeight = uiLines.length * 10;
      const codeHeight = codeLines.length * 9.5;

      const rowContentHeight = Math.max(taskHeight, uiHeight, codeHeight);
      const rowPadding = 12; // 6pt top, 6pt bottom
      const rowTotalHeight = rowContentHeight + rowPadding;

      ensureSpace(rowTotalHeight + 6);

      // Alternating row background
      const isAlt = i % 2 === 1;
      currentPage.drawRectangle({
        x: marginX,
        y: cursorY - rowTotalHeight,
        width: contentWidth,
        height: rowTotalHeight,
        color: isAlt ? rgb(0.985, 0.985, 0.99) : colorWhite,
        borderColor: colorBorder,
        borderWidth: 0.5,
      });

      // Draw Column 1: Task Title & How-to
      let textY = cursorY - 11;
      for (const line of taskLines) {
        currentPage.drawText(line, {
          x: marginX + 8,
          y: textY,
          size: 8.5,
          font: fontBold,
          color: colorDark,
        });
        textY -= 10.5;
      }
      textY -= 1;
      for (const line of howToLines) {
        currentPage.drawText(line, {
          x: marginX + 8,
          y: textY,
          size: 7.5,
          font: fontRegular,
          color: colorMuted,
        });
        textY -= 9.5;
      }

      // Draw Column 2: UI Location
      textY = cursorY - 11;
      for (const line of uiLines) {
        currentPage.drawText(line, {
          x: marginX + colWidthTask + 8,
          y: textY,
          size: 8,
          font: fontRegular,
          color: colorText,
        });
        textY -= 10;
      }

      // Draw Column 3: Code Reference (Code style background badge)
      textY = cursorY - 11;
      for (const line of codeLines) {
        currentPage.drawText(line, {
          x: marginX + colWidthTask + colWidthUi + 8,
          y: textY,
          size: 7.5,
          font: fontRegular,
          color: colorCodeText,
        });
        textY -= 9.5;
      }

      // Vertical column dividers
      currentPage.drawLine({
        start: { x: marginX + colWidthTask, y: cursorY },
        end: { x: marginX + colWidthTask, y: cursorY - rowTotalHeight },
        thickness: 0.5,
        color: colorBorder,
      });

      currentPage.drawLine({
        start: { x: marginX + colWidthTask + colWidthUi, y: cursorY },
        end: { x: marginX + colWidthTask + colWidthUi, y: cursorY - rowTotalHeight },
        thickness: 0.5,
        color: colorBorder,
      });

      cursorY -= rowTotalHeight;
    }

    cursorY -= 14; // Space between categories
  }

  // ==========================================
  // FOOTER PASS: DRAW PAGE NUMBERS
  // ==========================================
  const totalPages = pages.length;
  for (let idx = 0; idx < totalPages; idx++) {
    const p = pages[idx];
    const footerY = marginBottom - 18;

    p.drawLine({
      start: { x: marginX, y: footerY + 12 },
      end: { x: pageWidth - marginX, y: footerY + 12 },
      thickness: 0.5,
      color: colorBorder,
    });

    const leftFooter = "FlowerApp.my • White-Label Florist Architecture & Capabilities Directory";
    p.drawText(leftFooter, {
      x: marginX,
      y: footerY,
      size: 7.5,
      font: fontRegular,
      color: colorMuted,
    });

    const rightFooter = `Page ${idx + 1} of ${totalPages}`;
    const rfWidth = fontRegular.widthOfTextAtSize(rightFooter, 7.5);
    p.drawText(rightFooter, {
      x: pageWidth - marginX - rfWidth,
      y: footerY,
      size: 7.5,
      font: fontRegular,
      color: colorMuted,
    });
  }

  // Save PDF to docs directory
  const docsDir = path.join(process.cwd(), "docs");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const outputPath = path.join(docsDir, "FLOWERAPP_FEATURES_DIRECTORY.pdf");
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  console.log(`[SUCCESS] Generated Features PDF with ${totalPages} pages: ${outputPath}`);
}

generateFeaturesPDF().catch((err) => {
  console.error("Failed to generate features PDF:", err);
  process.exit(1);
});

