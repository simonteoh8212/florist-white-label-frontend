import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
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
        <Toaster
          position="top-right"
          containerStyle={{
            top: "calc(16px + env(safe-area-inset-top, 0px))",
            right: 16,
            zIndex: 99999,
          }}
          toastOptions={{
            duration: 3000,
            style: {
              background: "#ffffff",
              color: "#1c1917",
              border: "1px solid #e7e5e4",
              borderRadius: "16px",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
            },
            success: {
              iconTheme: {
                primary: "#0f9d6b",
                secondary: "#ffffff",
              },
            },
            error: {
              iconTheme: {
                primary: "#dc2626",
                secondary: "#ffffff",
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
