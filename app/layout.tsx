import type { Metadata, Viewport } from "next";
import { floristConfig } from "@/config/florist.config";
import "./globals.css";

export const metadata: Metadata = {
  title: `${floristConfig.storeName} | Artisanal Floral Studio`,
  description: `${floristConfig.tagline}. Handcrafted floral arrangements with seamless Touch 'n Go eWallet checkout and WhatsApp confirmation.`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-stone-50 font-sans antialiased text-stone-900 selection:bg-rose-100 selection:text-rose-900">
        {children}
      </body>
    </html>
  );
}
