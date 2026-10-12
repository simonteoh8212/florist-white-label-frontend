import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://flowerapp.my"
  ),
  title: {
    default: "FlowerApp.my | Multi-Tenant Florist Platform",
    template: "%s | FlowerApp.my",
  },
  description:
    "White-label mobile-first florist catalog platform with wildcard subdomain routing, Touch 'n Go checkout proof, and WhatsApp bridge.",
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
