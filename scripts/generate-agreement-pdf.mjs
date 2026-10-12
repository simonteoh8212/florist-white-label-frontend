import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

async function generateAgreementPDF() {
  const pdfDoc = await PDFDocument.create();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // A4 dimensions in points (72 points/inch)
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;

  // Color Palette
  const colorPrimary = rgb(0.74, 0.09, 0.36); // #BE185D Crimson Rose
  const colorDark = rgb(0.12, 0.12, 0.14); // Text stone-900
  const colorMuted = rgb(0.45, 0.45, 0.48); // Stone-500
  const colorLightBorder = rgb(0.88, 0.88, 0.9); // Border stone-200
  const colorLightBg = rgb(0.97, 0.96, 0.95); // stone-50 background

  // Helper to draw text with automatic word wrap
  function drawWrappedText(page, text, x, y, width, fontSize, font, color, lineHeight) {
    const words = text.split(" ");
    let currentLine = "";
    let cursorY = y;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > width && currentLine) {
        page.drawText(currentLine, { x, y: cursorY, size: fontSize, font, color });
        currentLine = word;
        cursorY -= lineHeight;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      page.drawText(currentLine, { x, y: cursorY, size: fontSize, font, color });
      cursorY -= lineHeight;
    }

    return cursorY;
  }

  // --- PAGE 1 ---
  let page1 = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Header Brand Tag
  page1.drawText("FLOWERAPP.MY • MERCHANT SERVICES", {
    x: margin,
    y,
    size: 9,
    font: fontBold,
    color: colorPrimary,
  });
  y -= 18;

  // Main Title
  page1.drawText("Independent Florist Merchant SaaS Agreement", {
    x: margin,
    y,
    size: 18,
    font: fontBold,
    color: colorDark,
  });
  y -= 14;

  page1.drawText("Terms & Conditions for Independent Florist Ateliers Operating on flowerapp.my", {
    x: margin,
    y,
    size: 9.5,
    font: fontItalic,
    color: colorMuted,
  });
  y -= 16;

  // Divider Line
  page1.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 1,
    color: colorLightBorder,
  });
  y -= 16;

  // Metadata Summary Box
  const metaBoxHeight = 68;
  page1.drawRectangle({
    x: margin,
    y: y - metaBoxHeight,
    width: contentWidth,
    height: metaBoxHeight,
    color: colorLightBg,
    borderColor: colorLightBorder,
    borderWidth: 1,
  });

  let metaY = y - 16;
  page1.drawText("Platform Provider:", { x: margin + 14, y: metaY, size: 8.5, font: fontBold, color: colorDark });
  page1.drawText("flowerapp.my (operated by Platform Provider)", { x: margin + 115, y: metaY, size: 8.5, font: fontRegular, color: colorDark });

  metaY -= 16;
  page1.drawText("Merchant Partner:", { x: margin + 14, y: metaY, size: 8.5, font: fontBold, color: colorDark });
  page1.drawText("[Florist Brand Name] (Operated by [Registered Entity Name], SSM: [SSM Number])", { x: margin + 115, y: metaY, size: 8.5, font: fontRegular, color: colorDark });

  metaY -= 16;
  page1.drawText("Effective Date:", { x: margin + 14, y: metaY, size: 8.5, font: fontBold, color: colorDark });
  page1.drawText("[Date]", { x: margin + 115, y: metaY, size: 8.5, font: fontRegular, color: colorDark });
  page1.drawText("Governing Law: Malaysia", { x: margin + 280, y: metaY, size: 8.5, font: fontRegular, color: colorMuted });

  y -= metaBoxHeight + 22;

  // Section 1
  page1.drawText("1. Scope of Service & Platform Role", { x: margin, y, size: 11, font: fontBold, color: colorPrimary });
  y -= 14;
  y = drawWrappedText(
    page1,
    "1.1 Software Platform: The Platform Provider grants the Merchant a non-exclusive license to use the flowerapp.my software platform, dedicated tenant subdomain routing (e.g. yourflorist.flowerapp.my), customizable fulfillment slots, Touch 'n Go payment proof launcher, and WhatsApp order dispatch bridges.",
    margin, y, contentWidth, 8.5, fontRegular, colorDark, 12
  );
  y -= 3;
  y = drawWrappedText(
    page1,
    "1.2 Technology Provider Only: The Platform Provider is strictly a technology and software infrastructure provider. The Platform Provider is NOT a merchant, retailer, florist, delivery agent, or payment processor.",
    margin, y, contentWidth, 8.5, fontRegular, colorDark, 12
  );
  y -= 12;

  // Section 2
  page1.drawText("2. Direct Payments & No Escrow", { x: margin, y, size: 11, font: fontBold, color: colorPrimary });
  y -= 14;
  y = drawWrappedText(
    page1,
    "2.1 Direct Peer-to-Peer Transactions: All customer payments (via Touch 'n Go eWallet, DuitNow QR, bank transfer, or payment gateway) are transacted directly between the customer and the Merchant's authorized account.",
    margin, y, contentWidth, 8.5, fontRegular, colorDark, 12
  );
  y -= 3;
  y = drawWrappedText(
    page1,
    "2.2 No Fund Handling: The Platform Provider does not collect, hold, escrow, or process customer sales proceeds at any time, avoiding unnecessary intermediary fees and ensuring immediate merchant cash flow.",
    margin, y, contentWidth, 8.5, fontRegular, colorDark, 12
  );
  y -= 12;

  // Section 3
  page1.drawText("3. Merchant Responsibilities & Legal Compliance", { x: margin, y, size: 11, font: fontBold, color: colorPrimary });
  y -= 14;
  y = drawWrappedText(
    page1,
    "The Merchant agrees and acknowledges that they are solely and exclusively responsible for:",
    margin, y, contentWidth, 8.5, fontRegular, colorDark, 12
  );
  y -= 4;

  const responsibilities = [
    "3.1 Business Registration: Maintaining active business registration under the Registration of Businesses Act 1956 (ROBA) or Companies Act 2016 with Suruhanjaya Syarikat Malaysia (SSM).",
    "3.2 Product Quality & Fulfillment: Creating floral arrangements, packaging, handling perishable fresh flowers, and dispatching orders within agreed time slots.",
    "3.3 Consumer Rights & Refunds: Resolving customer inquiries, cancellations, or refund requests in good faith in compliance with the Consumer Protection (Electronic Trade Transactions) Regulations 2012.",
    "3.4 Data Privacy (PDPA 2010): Treating sender and recipient contact information and delivery addresses as strictly confidential and used solely for fulfilling orders and driver dispatch.",
    "3.5 Taxation & e-Invoicing: Reporting sales revenue and complying with Inland Revenue Board of Malaysia (LHDN) MyInvois e-Invoicing requirements.",
    "3.6 Intellectual Property: Ensuring all flower images, logos, and descriptions uploaded to the catalog are original work or properly licensed."
  ];

  for (const resp of responsibilities) {
    y = drawWrappedText(page1, resp, margin + 8, y, contentWidth - 8, 8, fontRegular, colorDark, 11);
    y -= 3;
  }

  // Footer for Page 1
  page1.drawText("flowerapp.my • Independent Merchant SaaS Agreement", { x: margin, y: 25, size: 8, font: fontRegular, color: colorMuted });
  page1.drawText("Page 1 of 2", { x: pageWidth - margin - 40, y: 25, size: 8, font: fontRegular, color: colorMuted });

  // --- PAGE 2 ---
  let page2 = pdfDoc.addPage([pageWidth, pageHeight]);
  y = pageHeight - margin;

  // Header Page 2
  page2.drawText("FLOWERAPP.MY • MERCHANT SERVICES", {
    x: margin,
    y,
    size: 9,
    font: fontBold,
    color: colorPrimary,
  });
  y -= 18;

  page2.drawText("Independent Florist Merchant SaaS Agreement (Continued)", {
    x: margin,
    y,
    size: 14,
    font: fontBold,
    color: colorDark,
  });
  y -= 14;

  page2.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 1,
    color: colorLightBorder,
  });
  y -= 18;

  // Section 4
  page2.drawText("4. Limitation of Liability & Service 'As-Is'", { x: margin, y, size: 11, font: fontBold, color: colorPrimary });
  y -= 14;
  y = drawWrappedText(
    page2,
    "4.1 Service Uptime: The Platform is provided on an 'as-is' and 'as-available' basis. The Platform Provider utilizes industry-standard cloud hosting infrastructure but does not guarantee 100% uninterrupted uptime.",
    margin, y, contentWidth, 8.5, fontRegular, colorDark, 12
  );
  y -= 3;
  y = drawWrappedText(
    page2,
    "4.2 No Consequential Damages: To the maximum extent permitted by Malaysian law, the Platform Provider shall NOT be liable to the Merchant or any third party for lost profits, lost sales, reputational damage, or indirect damages arising from server downtime, internet disruptions, or third-party service outages (e.g., WhatsApp, Touch 'n Go, telecommunications).",
    margin, y, contentWidth, 8.5, fontRegular, colorDark, 12
  );
  y -= 3;
  y = drawWrappedText(
    page2,
    "4.3 Total Liability Cap: In any event, the Platform Provider's aggregate liability under this agreement shall be strictly capped at the total software subscription fees paid by the Merchant to the Platform Provider in the preceding three (3) months.",
    margin, y, contentWidth, 8.5, fontRegular, colorDark, 12
  );
  y -= 14;

  // Section 5
  page2.drawText("5. Indemnification", { x: margin, y, size: 11, font: fontBold, color: colorPrimary });
  y -= 14;
  y = drawWrappedText(
    page2,
    "The Merchant agrees to defend, indemnify, and hold harmless the Platform Provider against any claims, losses, fines, or legal expenses (including legal fees) arising from: (a) customer disputes regarding flower freshness, late delivery, or non-delivery; (b) intellectual property infringement claims regarding photos uploaded by the Merchant; or (c) regulatory penalties imposed by KPDN, SSM, or other Malaysian authorities due to the Merchant's business practices.",
    margin, y, contentWidth, 8.5, fontRegular, colorDark, 12
  );
  y -= 14;

  // Section 6
  page2.drawText("6. Governing Law & Dispute Resolution", { x: margin, y, size: 11, font: fontBold, color: colorPrimary });
  y -= 14;
  y = drawWrappedText(
    page2,
    "This Agreement shall be governed by and construed in accordance with the laws of Malaysia. Any dispute arising out of or in connection with this agreement shall be settled amicably between the parties, or submitted to the jurisdiction of the courts of Malaysia.",
    margin, y, contentWidth, 8.5, fontRegular, colorDark, 12
  );
  y -= 24;

  // Signatures Title
  page2.drawText("7. Signatures & Acceptance", { x: margin, y, size: 11, font: fontBold, color: colorPrimary });
  y -= 14;

  page2.drawText("By signing below or confirming acceptance in writing, both parties agree to the terms herein.", {
    x: margin,
    y,
    size: 8.5,
    font: fontItalic,
    color: colorMuted,
  });
  y -= 16;

  // Signature Boxes
  const sigBoxWidth = (contentWidth - 18) / 2;
  const sigBoxHeight = 145;

  // Left Box: Platform Provider
  page2.drawRectangle({
    x: margin,
    y: y - sigBoxHeight,
    width: sigBoxWidth,
    height: sigBoxHeight,
    color: colorLightBg,
    borderColor: colorLightBorder,
    borderWidth: 1,
  });

  let boxLeftY = y - 18;
  page2.drawText("FOR PLATFORM PROVIDER:", { x: margin + 14, y: boxLeftY, size: 8.5, font: fontBold, color: colorDark });
  boxLeftY -= 14;
  page2.drawText("flowerapp.my", { x: margin + 14, y: boxLeftY, size: 8, font: fontRegular, color: colorMuted });

  boxLeftY -= 45;
  page2.drawLine({
    start: { x: margin + 14, y: boxLeftY },
    end: { x: margin + sigBoxWidth - 14, y: boxLeftY },
    thickness: 1,
    color: colorLightBorder,
  });
  boxLeftY -= 12;
  page2.drawText("Authorized Signature", { x: margin + 14, y: boxLeftY, size: 7.5, font: fontItalic, color: colorMuted });

  boxLeftY -= 18;
  page2.drawText("Name: _______________________________", { x: margin + 14, y: boxLeftY, size: 8, font: fontRegular, color: colorDark });
  boxLeftY -= 16;
  page2.drawText("Date: _______________________________", { x: margin + 14, y: boxLeftY, size: 8, font: fontRegular, color: colorDark });

  // Right Box: Merchant Partner
  const rightBoxX = margin + sigBoxWidth + 18;
  page2.drawRectangle({
    x: rightBoxX,
    y: y - sigBoxHeight,
    width: sigBoxWidth,
    height: sigBoxHeight,
    color: colorLightBg,
    borderColor: colorLightBorder,
    borderWidth: 1,
  });

  let boxRightY = y - 18;
  page2.drawText("FOR MERCHANT PARTNER:", { x: rightBoxX + 14, y: boxRightY, size: 8.5, font: fontBold, color: colorDark });
  boxRightY -= 14;
  page2.drawText("[Florist Brand Name / Company]", { x: rightBoxX + 14, y: boxRightY, size: 8, font: fontRegular, color: colorMuted });

  boxRightY -= 45;
  page2.drawLine({
    start: { x: rightBoxX + 14, y: boxRightY },
    end: { x: rightBoxX + sigBoxWidth - 14, y: boxRightY },
    thickness: 1,
    color: colorLightBorder,
  });
  boxRightY -= 12;
  page2.drawText("Authorized Signature & Company Stamp", { x: rightBoxX + 14, y: boxRightY, size: 7.5, font: fontItalic, color: colorMuted });

  boxRightY -= 18;
  page2.drawText("Name / Title: ________________________", { x: rightBoxX + 14, y: boxRightY, size: 8, font: fontRegular, color: colorDark });
  boxRightY -= 16;
  page2.drawText("Date: _______________________________", { x: rightBoxX + 14, y: boxRightY, size: 8, font: fontRegular, color: colorDark });

  // Footer for Page 2
  page2.drawText("flowerapp.my • Independent Merchant SaaS Agreement", { x: margin, y: 25, size: 8, font: fontRegular, color: colorMuted });
  page2.drawText("Page 2 of 2", { x: pageWidth - margin - 40, y: 25, size: 8, font: fontRegular, color: colorMuted });

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  const outputDir = path.resolve("docs");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "MERCHANT_AGREEMENT_TEMPLATE.pdf");
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`[SUCCESS] Agreement PDF generated at: ${outputPath}`);
}

generateAgreementPDF().catch((err) => {
  console.error("[ERROR]", err);
  process.exit(1);
});
